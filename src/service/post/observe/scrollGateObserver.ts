// 포스트 상세 페이지 스크롤 게이트 — 단방향(아래로) 충전 인터랙션
// 상태: hidden → ready ↔ charging → snapping-forward → arrived
//
// 핵심 구조(바운스 근본 해결): 관련 포스트 섹션(#related-posts)은 게이트 통과 전까지
// height 0으로 접어 둔다. 그러면 스크롤 컨테이너는 "경계 아래로는 스크롤할 콘텐츠가 없는"
// 상태가 되고, 아래로의 오버스크롤은 브라우저의 네이티브 스크롤 클램프가 막는다.
// → JS가 컴포지터 스무스 스크롤과 싸울 필요 자체가 사라진다(1~15차 튕김의 근본 원인 제거):
//   preventDefault로 못 멈추는 "이미 시작된" 네이티브 애니메이션이 애초에 시작될 수 없다.
//
// 위로(관련 포스트 → 본문) 복귀는 자유 스크롤이다 — 클램프가 없으니 위쪽 바운스도 없다.
// 경계 위로 다시 올라오면 관련 포스트를 재수납(collapse)해 게이트를 재장전한다.
//
// 바닥에서의 충전은 passive wheel/touchmove로 델타만 읽어 누적한다(네이티브 클램프가
// 이미 이동을 막으므로 preventDefault가 필요 없다 — 상시 passive라 컴포지터 스크롤을 죽이지 않음).

let scrollRootEl: HTMLElement | null = null;
let resizeListener: (() => void) | null = null;

interface ScrollGateConfig {
  scrollRootId: string;
}

const RAW_THRESHOLD = 600;       // 충전 임계값
const DECAY_RATE = 0.9;
const DECAY_IDLE_DURATION = 120; // ms — 입력 멈춤 판단
const RELEASE_DURATION = 350;    // ms — snap tween
const BOUNDARY_EPSILON = 2;      // px — 서브픽셀 여유
const RECOLLAPSE_MARGIN = 8;     // px — arrived에서 이만큼 위로 올라오면 관련 포스트 재수납
const GESTURE_GAP = 120;         // ms — 입력이 이만큼 끊기면 새 제스처
const SPIKE_RATIO = 1.5;         // 감쇠 중이던 관성 대비 델타 급증 = 새 제스처
const SPIKE_FLOOR = 15;          // px — 스파이크 판정 최소 델타
const LINE_DELTA_PX = 16;        // deltaMode=LINE(Firefox 노치 휠) 정규화 계수

type GateState = 'hidden' | 'ready' | 'charging' | 'snapping-forward' | 'arrived';

let state: GateState = 'hidden';
let raw = 0;
let lastInputTime = 0;
let isAtBottom = false;
let lastScrollTop = 0;
// 경계 도달을 만든 제스처의 잔여 관성은 충전 금지 — 한 번 '멈추고' 새 제스처부터 충전
let chargeBlocked = false;
let lastBlockedInputTime = 0;
let lastBlockedDelta = Infinity;

let decayRafId: number | null = null;
let releaseRafId: number | null = null;
let checkDecayTimerId: number | null = null;

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
  // 접힌 상태에서도 offsetTop = 본문 바닥(관련 포스트 height 0라 위치는 그대로) → 경계 일관
  return relatedPosts ? relatedPosts.offsetTop : null;
}

function getBoundary(scrollRoot: HTMLElement): number | null {
  const relTop = getRelatedTop();
  return relTop === null ? null : Math.max(0, relTop - scrollRoot.clientHeight);
}

// 관련 포스트 수납/전개 — 접으면 스크롤 컨테이너에서 경계 아래 콘텐츠가 사라진다(네이티브 클램프)
function setRelatedCollapsed(collapsed: boolean) {
  const related = document.getElementById('related-posts');
  if (!related) return;
  if (collapsed) related.setAttribute('data-collapsed', 'true');
  else related.removeAttribute('data-collapsed');
}

function updateProgress() {
  const tau = RAW_THRESHOLD / 4;
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

// 단일 진실 소스: 경계 판정 + 상태 전환. 클램프는 없다(네이티브 클램프가 경계를 지킨다).
function onScroll() {
  const scrollRoot = scrollRootEl;
  if (!scrollRoot) return;

  const boundary = getBoundary(scrollRoot);
  if (boundary === null) return;

  const top = scrollRoot.scrollTop;
  isAtBottom = top >= boundary - BOUNDARY_EPSILON;

  if (state === 'hidden' && isAtBottom) {
    // 아래로 스크롤해 바닥 도달 — 도달을 만든 제스처의 잔여 관성은 충전 금지
    if (lastScrollTop < top) armChargeBlock();
    setState('ready');
  } else if ((state === 'ready' || state === 'charging') && !isAtBottom) {
    // 바닥에서 벗어남 — 충전 리셋
    cancelDecay();
    raw = 0;
    updateProgress();
    setState('hidden');
  } else if (state === 'arrived' && top < boundary - RECOLLAPSE_MARGIN) {
    // 관련 포스트에서 본문으로 복귀(위로) — 이 시점 관련 포스트는 뷰포트 아래로 벗어나 있어
    // 재수납이 보이지 않는다. 게이트 재장전.
    setRelatedCollapsed(true);
    setState('hidden');
  }

  lastScrollTop = top;
}

function charge(amount: number) {
  raw += amount;
  lastInputTime = Date.now();
  cancelDecay();
  setState('charging');

  if (raw >= RAW_THRESHOLD) {
    raw = RAW_THRESHOLD;
    updateProgress();
    triggerRelease();
  } else {
    updateProgress();
  }
}

// passive — 델타만 읽어 충전. 바닥에선 네이티브 클램프가 이동을 막으므로 preventDefault 불필요.
function onWheel(e: WheelEvent) {
  if (releaseRafId !== null) return; // snap tween이 scrollTop을 소유
  if (state !== 'ready' && state !== 'charging') return;

  const delta = normalizeWheelDelta(e);
  if (delta <= 0 || !isAtBottom) return;
  if (consumeChargeBlock(delta)) return;
  charge(delta);
}

function onTouchStart(e: TouchEvent) {
  (e.currentTarget as HTMLElement).dataset.touchPrevY = e.touches[0].clientY.toString();
}

function onTouchMove(e: TouchEvent) {
  if (releaseRafId !== null) return;

  const el = e.currentTarget as HTMLElement;
  const prevY = parseFloat(el.dataset.touchPrevY || 'NaN');
  const currentY = e.touches[0].clientY;
  el.dataset.touchPrevY = currentY.toString();
  if (Number.isNaN(prevY)) return;

  const delta = prevY - currentY; // +: 아래로 스크롤
  if (delta <= 0 || !isAtBottom) return;
  if (state !== 'ready' && state !== 'charging') return;
  if (consumeChargeBlock(delta)) return;
  charge(delta);
}

function startDecay() {
  if (decayRafId !== null) return;

  function decay() {
    if (Date.now() - lastInputTime > DECAY_IDLE_DURATION) {
      raw *= DECAY_RATE;
      if (raw < 1) {
        raw = 0;
        updateProgress();
        setState('ready');
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
    state === 'charging'
  ) {
    startDecay();
  }
}

function triggerRelease() {
  if (releaseRafId !== null) return;

  const scrollRoot = scrollRootEl;
  if (!scrollRoot) return;

  // 관련 포스트를 펼쳐 스크롤 여지를 만든다(그 전엔 height 0라 relTop로 스크롤 불가)
  setRelatedCollapsed(false);

  const startTarget = getRelatedTop();
  if (startTarget === null) {
    setRelatedCollapsed(true);
    return;
  }

  setState('snapping-forward');

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
  // 클릭/Enter로도 통과 가능해야 함 — 휠·터치 없는 입력 수단의 경로(a11y)
  if (state === 'ready' || state === 'charging') triggerRelease();
}

export const ScrollGateObserver = {
  // 본문 높이가 스크롤 없이 변했을 때(각주 토글 등) 외부에서 호출 — 경계 재판정.
  sync() {
    onScroll();
  },

  init({ scrollRootId }: ScrollGateConfig) {
    if (scrollRootEl) return;

    const scrollRoot = document.getElementById(scrollRootId);
    if (!scrollRoot) return;
    scrollRootEl = scrollRoot;

    setRelatedCollapsed(true); // 게이트 통과 전 관련 포스트 수납(경계 아래 콘텐츠 제거)
    setState('hidden');
    updateProgress();
    updateControlX();
    // 사이드바 등장 transform(translateX) 종료 후 본문 컬럼 위치가 확정된다 — 재측정
    window.setTimeout(updateControlX, 700);

    lastScrollTop = scrollRoot.scrollTop;
    scrollRoot.addEventListener('scroll', onScroll, { passive: true });
    scrollRoot.addEventListener('touchstart', onTouchStart, { passive: true });
    scrollRoot.addEventListener('wheel', onWheel, { passive: true });
    scrollRoot.addEventListener('touchmove', onTouchMove, { passive: true });

    document.querySelector('.gate-button')?.addEventListener('click', onGateControlClick);

    resizeListener = () => {
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
      scrollRootEl.removeEventListener('touchmove', onTouchMove);
      scrollRootEl.removeEventListener('wheel', onWheel);
    }
    scrollRootEl = null;

    document.querySelector('.gate-button')?.removeEventListener('click', onGateControlClick);

    if (resizeListener) window.removeEventListener('resize', resizeListener);
    cancelDecay();
    if (releaseRafId !== null) cancelAnimationFrame(releaseRafId);
    if (checkDecayTimerId !== null) clearInterval(checkDecayTimerId);

    resizeListener = null;
    releaseRafId = null;
    checkDecayTimerId = null;
  },
};
