// 포스트 상세 페이지 스크롤 게이트 — 양방향 대칭 충전 인터랙션
// 상태: hidden → ready ↔ charging → snapping-forward → arrived ↔ charging-back → snapping-back → ready
// 감지는 scroll 이벤트의 scrollTop 산술 비교로 일원화한다. IO/센티널을 쓰지 않는 이유:
// 콜백이 비동기라 빠른 스크롤이 경계를 지나친 뒤 판정되고, 경계 정확히에선 서브픽셀 오차로 불안정.
// 하단 경계(boundary) = relatedPosts.offsetTop - clientHeight, 상단 경계 = relatedPosts.offsetTop.
// 뷰포트 절반 이상의 점프(PageDown/End·TOC 링크 등 키보드/프로그램 입력)는 클램프 대신
// 게이트를 해제하고 통과시킨다 — 휠/터치 없는 사용자도 양방향 이동이 가능해야 함(접근성).

let scrollRootEl: HTMLElement | null = null;
let resizeListener: (() => void) | null = null;
let inputBlockingAttached = false;

interface ScrollGateConfig {
  scrollRootId: string;
}

const RAW_THRESHOLD = 600;       // 진입 충전 임계값
const RAW_THRESHOLD_BACK = 180;  // 복귀 충전 임계값 (대칭 동작이되 가볍게)
const DECAY_RATE = 0.9;
const DECAY_IDLE_DURATION = 120; // ms — 입력 멈춤 판단
const RELEASE_DURATION = 350;    // ms — snap tween (CSS transform transition과 동일)
const BOUNDARY_EPSILON = 2;      // px — 서브픽셀 여유
const GESTURE_GAP = 120;         // ms — 입력이 이만큼 끊기면 새 제스처
const SPIKE_RATIO = 1.5;         // 감쇠 중이던 관성 대비 델타 급증 = 새 제스처
const SPIKE_FLOOR = 15;          // px — 스파이크 판정 최소 델타
const LINE_DELTA_PX = 16;        // deltaMode=LINE(Firefox 노치 휠) 정규화 계수

type GateState = 'hidden' | 'ready' | 'charging' | 'snapping-forward' | 'arrived' | 'charging-back' | 'snapping-back';

let state: GateState = 'hidden';
let raw = 0;
let lastInputTime = 0;
let isAtBottom = false;
let isAtRelatedTop = false;
let lastScrollTop = 0;
// 경계 도달을 만든 제스처의 잔여 관성은 충전 금지 — 한 번 '튕기고' 새 제스처부터 충전
let chargeBlocked = false;
let lastBlockedInputTime = 0;
let lastBlockedDelta = Infinity;
let currentDock: 'top' | 'bottom' = 'bottom';

let decayRafId: number | null = null;
let releaseRafId: number | null = null;
let checkDecayTimerId: number | null = null;
let returnTimerId: number | null = null;

let startReleaseTime = 0;
let releaseStartScroll = 0;

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function normalizeWheelDelta(e: WheelEvent): number {
  if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) return e.deltaY * LINE_DELTA_PX;
  if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return e.deltaY * (scrollRootEl?.clientHeight ?? window.innerHeight);
  }
  return e.deltaY;
}

function getRelatedTop(): number | null {
  const relatedPosts = document.getElementById('related-posts');
  return relatedPosts ? relatedPosts.offsetTop : null;
}

function getBoundary(scrollRoot: HTMLElement): number | null {
  const relTop = getRelatedTop();
  return relTop === null ? null : Math.max(0, relTop - scrollRoot.clientHeight);
}

// 진행률: 방향별 임계값에 tau를 비례시켜 링이 차오르는 감각을 동일하게 유지
function updateProgress() {
  const threshold = state === 'charging-back' ? RAW_THRESHOLD_BACK : RAW_THRESHOLD;
  const tau = threshold / 4;
  const progress = clamp(1 - Math.exp(-raw / tau), 0, 1);
  document.documentElement.style.setProperty('--gate-progress', progress.toString());
}

function setState(newState: GateState) {
  if (state === newState) return;
  state = newState;
  document.querySelector('[data-gate]')?.setAttribute('data-gate', newState);
}

function getControl(): HTMLElement | null {
  return document.querySelector('.gate-control');
}

// 도킹 전환 — 위치는 fixed 고정, 이동량만 CSS var로 전달(애니메이션은 CSS transition)
function setDock(dock: 'top' | 'bottom') {
  currentDock = dock;
  const control = getControl();
  if (!control) return;

  if (dock === 'top') {
    const headerHeight =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 80;
    const bottomDockTop = window.innerHeight - 48 - 60;
    control.style.setProperty('--gate-dock-y', `${headerHeight + 12 - bottomDockTop}px`);
  } else {
    control.style.setProperty('--gate-dock-y', '0px');
  }
}

// x 좌표 = 본문 컬럼(스크롤 루트) 중앙 — 뷰포트 중앙이 아님(사이드바만큼 어긋난다)
function updateControlX() {
  const scrollRoot = scrollRootEl;
  const control = getControl();
  if (!scrollRoot || !control) return;
  const rect = scrollRoot.getBoundingClientRect();
  control.style.left = `${rect.left + rect.width / 2}px`;
}

function cancelDecay() {
  if (decayRafId !== null) {
    cancelAnimationFrame(decayRafId);
    decayRafId = null;
  }
}

// non-passive(wheel/touchmove)는 경계 구간에서만 부착 — 상시 부착 시 리스너의 존재만으로
// 컴포지터 스레드 스크롤이 죽어 본문 전체가 버벅인다
function updateInputBlocking() {
  const scrollRoot = scrollRootEl;
  if (!scrollRoot) return;

  const need = isAtBottom; // arrived 계열도 top >= boundary라 포함됨
  if (need === inputBlockingAttached) return;
  inputBlockingAttached = need;

  if (need) {
    scrollRoot.addEventListener('wheel', onWheel, { passive: false });
    scrollRoot.addEventListener('touchmove', onTouchMove, { passive: false });
  } else {
    scrollRoot.removeEventListener('wheel', onWheel);
    scrollRoot.removeEventListener('touchmove', onTouchMove);
  }
}

function armChargeBlock() {
  chargeBlocked = true;
  lastBlockedInputTime = Date.now();
  lastBlockedDelta = Infinity;
}

// true면 이번 입력은 도달 제스처의 관성 — 무시. 새 제스처 판정 기준:
// 입력 공백(GESTURE_GAP) 또는 델타 급증(관성은 단조 감쇠하므로 스파이크 = 새 입력)
function consumeChargeBlock(amount: number): boolean {
  if (!chargeBlocked) return false;

  const now = Date.now();
  const isNewGesture =
    now - lastBlockedInputTime >= GESTURE_GAP ||
    (amount >= SPIKE_FLOOR && amount > lastBlockedDelta * SPIKE_RATIO);

  if (isNewGesture) {
    chargeBlocked = false;
    return false;
  }

  lastBlockedInputTime = now;
  lastBlockedDelta = amount;
  return true;
}

// 단일 진실 소스: 대칭 클램프 + 상태 전환 모두 여기서
function onScroll() {
  const scrollRoot = scrollRootEl;
  if (!scrollRoot) return;

  const relTop = getRelatedTop();
  if (relTop === null) return;
  const boundary = Math.max(0, relTop - scrollRoot.clientHeight);

  let top = scrollRoot.scrollTop;

  if (state === 'hidden' || state === 'ready' || state === 'charging') {
    if (top > boundary && lastScrollTop <= boundary) {
      const crossed = top - lastScrollTop;
      if (crossed < scrollRoot.clientHeight / 2) {
        scrollRoot.scrollTop = boundary;
        top = boundary;
        armChargeBlock();
      } else {
        // 키보드/프로그램의 큰 하향 점프 — 게이트 해제 통과
        cancelDecay();
        raw = 0;
        updateProgress();
        setDock('top');
        setState('arrived');
      }
    }
  } else if (state === 'arrived' || state === 'charging-back') {
    if (top < relTop && lastScrollTop >= relTop) {
      const crossed = lastScrollTop - top;
      if (crossed < scrollRoot.clientHeight / 2) {
        scrollRoot.scrollTop = relTop;
        top = relTop;
        armChargeBlock();
      } else {
        // 키보드/프로그램의 큰 상향 점프(TOC 링크·PageUp 등) — 게이트 해제 통과
        cancelDecay();
        raw = 0;
        updateProgress();
        setDock('bottom');
        setState(top >= boundary - BOUNDARY_EPSILON ? 'ready' : 'hidden');
      }
    }
  }

  isAtBottom = top >= boundary - BOUNDARY_EPSILON;
  isAtRelatedTop = top <= relTop + BOUNDARY_EPSILON;

  if (state === 'hidden' && isAtBottom) {
    if (lastScrollTop < top) armChargeBlock();
    setState('ready');
  } else if ((state === 'ready' || state === 'charging') && !isAtBottom) {
    cancelDecay();
    raw = 0;
    updateProgress();
    setState('hidden');
  } else if (state === 'charging-back' && !isAtRelatedTop) {
    cancelDecay();
    raw = 0;
    updateProgress();
    setState('arrived');
  }

  lastScrollTop = top;
  updateInputBlocking();
}

function charge(amount: number, chargingState: 'charging' | 'charging-back') {
  raw += amount;
  lastInputTime = Date.now();
  cancelDecay();
  setState(chargingState);

  const threshold = chargingState === 'charging-back' ? RAW_THRESHOLD_BACK : RAW_THRESHOLD;
  if (raw >= threshold) {
    raw = threshold;
    updateProgress();
    if (chargingState === 'charging') triggerRelease();
    else triggerSnappingBack();
  } else {
    updateProgress();
  }
}

function onWheel(e: WheelEvent) {
  // tween 진행 중엔 네이티브 스크롤이 tween과 경합하지 않게 차단
  if (releaseRafId !== null) {
    e.preventDefault();
    return;
  }

  const delta = normalizeWheelDelta(e);

  if (isAtBottom && delta > 0 && (state === 'ready' || state === 'charging')) {
    e.preventDefault();
    if (consumeChargeBlock(delta)) return;
    charge(delta, 'charging');
    return;
  }

  if (isAtRelatedTop && delta < 0 && (state === 'arrived' || state === 'charging-back')) {
    e.preventDefault();
    if (consumeChargeBlock(-delta)) return;
    charge(-delta, 'charging-back');
  }
}

function onTouchStart(e: TouchEvent) {
  (e.currentTarget as HTMLElement).dataset.touchPrevY = e.touches[0].clientY.toString();
}

function onTouchMove(e: TouchEvent) {
  if (releaseRafId !== null) {
    e.preventDefault();
    return;
  }

  // 직전 이벤트와의 증분만 충전 — 누적 오프셋을 매번 더하면 raw가 드래그 거리 제곱으로 폭증
  const el = e.currentTarget as HTMLElement;
  const prevY = parseFloat(el.dataset.touchPrevY || 'NaN');
  const currentY = e.touches[0].clientY;
  el.dataset.touchPrevY = currentY.toString();
  if (Number.isNaN(prevY)) return;

  const delta = prevY - currentY; // +: 아래로 스크롤

  if (delta > 0 && isAtBottom && (state === 'ready' || state === 'charging')) {
    e.preventDefault();
    if (consumeChargeBlock(delta)) return;
    charge(delta, 'charging');
    return;
  }

  if (delta < 0 && isAtRelatedTop && (state === 'arrived' || state === 'charging-back')) {
    e.preventDefault();
    if (consumeChargeBlock(-delta)) return;
    charge(-delta, 'charging-back');
  }
}

function startDecay() {
  if (decayRafId !== null) return;

  function decay() {
    if (Date.now() - lastInputTime > DECAY_IDLE_DURATION) {
      raw *= DECAY_RATE;
      if (raw < 1) {
        raw = 0;
        updateProgress();
        setState(state === 'charging-back' ? 'arrived' : 'ready');
        decayRafId = null;
        return;
      }
      updateProgress();
    }
    decayRafId = requestAnimationFrame(decay);
  }

  decayRafId = requestAnimationFrame(decay);
}

function checkAndStartDecay() {
  if (
    raw > 0 &&
    Date.now() - lastInputTime > DECAY_IDLE_DURATION &&
    decayRafId === null &&
    releaseRafId === null &&
    (state === 'charging' || state === 'charging-back')
  ) {
    startDecay();
  }
}

function triggerRelease() {
  if (releaseRafId !== null) return;

  const scrollRoot = scrollRootEl;
  if (!scrollRoot) return;
  const startTarget = getRelatedTop();
  if (startTarget === null) return;

  setState('snapping-forward');
  setDock('top');

  const finish = () => {
    raw = 0;
    updateProgress();
    setState('arrived');
    releaseRafId = null;
  };

  if (prefersReducedMotion()) {
    scrollRoot.scrollTop = startTarget;
    finish();
    return;
  }

  startReleaseTime = Date.now();
  releaseStartScroll = scrollRoot.scrollTop;

  function animate() {
    const progress = Math.min((Date.now() - startReleaseTime) / RELEASE_DURATION, 1);
    // 목표는 프레임마다 재계산 — tween 중 본문 높이가 변해도(각주 토글 등) 정확히 정렬
    const target = getRelatedTop() ?? startTarget;
    scrollRoot!.scrollTop = releaseStartScroll + (target - releaseStartScroll) * easeInOutQuad(progress);

    if (progress < 1) releaseRafId = requestAnimationFrame(animate);
    else finish();
  }

  releaseRafId = requestAnimationFrame(animate);
}

function onGateControlClick() {
  // 클릭/Enter로도 양방향 통과 가능해야 함 — 휠·터치 없는 입력 수단의 유일한 경로
  if (state === 'arrived') triggerSnappingBack();
  else if (state === 'ready' || state === 'charging') triggerRelease();
}

function triggerSnappingBack() {
  if (releaseRafId !== null) return;

  const scrollRoot = scrollRootEl;
  if (!scrollRoot) return;

  setState('snapping-back');
  setDock('bottom');
  raw = 0;
  updateProgress();

  const startTarget = getBoundary(scrollRoot) ?? 0;

  const finish = () => {
    raw = 0;
    updateProgress();
    setState('ready');
    releaseRafId = null;
  };

  if (prefersReducedMotion()) {
    scrollRoot.scrollTop = startTarget;
    finish();
    return;
  }

  startReleaseTime = Date.now();
  releaseStartScroll = scrollRoot.scrollTop;

  function animate() {
    const progress = Math.min((Date.now() - startReleaseTime) / RELEASE_DURATION, 1);
    const target = getBoundary(scrollRoot!) ?? startTarget;
    scrollRoot!.scrollTop = releaseStartScroll + (target - releaseStartScroll) * easeInOutQuad(progress);

    if (progress < 1) releaseRafId = requestAnimationFrame(animate);
    else finish();
  }

  releaseRafId = requestAnimationFrame(animate);
}

export const ScrollGateObserver = {
  // 본문 높이가 스크롤 없이 변했을 때(각주 토글 등) 외부에서 호출 — 경계 재클램프.
  // 콘텐츠가 줄면 서 있던 scrollTop이 새 경계를 넘어 관련 포스트가 걸쳐 보일 수 있다.
  sync() {
    const scrollRoot = scrollRootEl;
    if (!scrollRoot) return;
    const boundary = getBoundary(scrollRoot);
    if (boundary === null) return;

    if (
      (state === 'hidden' || state === 'ready' || state === 'charging') &&
      scrollRoot.scrollTop > boundary
    ) {
      scrollRoot.scrollTop = boundary;
      lastScrollTop = boundary;
    }
  },

  init({ scrollRootId }: ScrollGateConfig) {
    if (scrollRootEl) return;

    const scrollRoot = document.getElementById(scrollRootId);
    if (!scrollRoot) return;
    scrollRootEl = scrollRoot;

    setState('hidden');
    setDock('bottom');
    updateProgress();
    updateControlX();
    // 사이드바 등장 transform(translateX) 종료 후 본문 컬럼 위치가 확정된다 — 재측정
    window.setTimeout(updateControlX, 700);

    lastScrollTop = scrollRoot.scrollTop;
    scrollRoot.addEventListener('scroll', onScroll, { passive: true });
    scrollRoot.addEventListener('touchstart', onTouchStart, { passive: true });

    document.querySelector('.gate-button')?.addEventListener('click', onGateControlClick);

    resizeListener = () => {
      if (currentDock === 'top') setDock('top');
      updateControlX();
      onScroll(); // clientHeight 변동으로 경계·상태가 이동했을 수 있음
    };
    window.addEventListener('resize', resizeListener);

    if (checkDecayTimerId !== null) clearInterval(checkDecayTimerId);
    checkDecayTimerId = window.setInterval(checkAndStartDecay, 50);

    onScroll(); // 초기 상태 판정 (앵커 진입 등으로 이미 바닥일 수 있음)
  },

  disconnect() {
    if (scrollRootEl) {
      scrollRootEl.removeEventListener('scroll', onScroll);
      scrollRootEl.removeEventListener('touchstart', onTouchStart);
      scrollRootEl.removeEventListener('wheel', onWheel);
      scrollRootEl.removeEventListener('touchmove', onTouchMove);
    }
    scrollRootEl = null;
    inputBlockingAttached = false;

    document.querySelector('.gate-button')?.removeEventListener('click', onGateControlClick);

    if (resizeListener) window.removeEventListener('resize', resizeListener);
    cancelDecay();
    if (releaseRafId !== null) cancelAnimationFrame(releaseRafId);
    if (checkDecayTimerId !== null) clearInterval(checkDecayTimerId);
    if (returnTimerId !== null) clearTimeout(returnTimerId);

    resizeListener = null;
    releaseRafId = null;
    checkDecayTimerId = null;
    returnTimerId = null;
  },
};
