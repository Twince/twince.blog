// 포스트 상세 스크롤 게이트 — 단방향 충전.
// 상태: hidden → ready ↔ charging → snapping-forward → arrived
//
// 관련 포스트를 통과 전까지 height 0으로 접어, 경계 아래에 스크롤할 콘텐츠가 없게 만든다.
// 네이티브 클램프가 경계를 지키므로 JS가 컴포지터 스크롤과 싸울 필요가 없고,
// 리스너도 전부 passive로 둘 수 있다. 이 구조에 이르기까지의 실패 이력은
// docs/gate-history.md, 결정 근거는 docs/decisions.md D4.

let scrollRootEl: HTMLElement | null = null;
let resizeListener: (() => void) | null = null;

interface ScrollGateConfig {
  scrollRootId: string;
}

// 휠은 관성 델타가 계속 날아오지만 터치는 손가락 이동 거리가 전부다(관성 스크롤은 touchmove 미발생)
const WHEEL_THRESHOLD = 600;
const TOUCH_THRESHOLD = 300;
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
let threshold = WHEEL_THRESHOLD;
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

// tween 구간만의 네이티브 스크롤 가드. tween이 scrollTop을 소유하는 동안 사용자 입력이
// 끼어들면 미세 지터가 생긴다(시각 품질 문제). non-passive 리스너는 존재 자체가 컴포지터
// 스크롤을 죽이므로 상시 부착하지 않고 tween 시작~종료에만 붙였다 뗀다.
function preventNativeScroll(e: Event) {
  e.preventDefault();
}

function attachTweenGuard() {
  if (!scrollRootEl) return;
  scrollRootEl.addEventListener('wheel', preventNativeScroll, { passive: false });
  scrollRootEl.addEventListener('touchmove', preventNativeScroll, { passive: false });
}

function detachTweenGuard() {
  if (!scrollRootEl) return;
  scrollRootEl.removeEventListener('wheel', preventNativeScroll);
  scrollRootEl.removeEventListener('touchmove', preventNativeScroll);
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
  const tau = threshold / 4;
  const progress = clamp(1 - Math.exp(-raw / tau), 0, 1);
  document.documentElement.style.setProperty('--gate-progress', progress.toString());
}

function setState(newState: GateState) {
  if (state === newState) return;
  state = newState;
  document.querySelector('[data-gate]')?.setAttribute('data-gate', newState);
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

function charge(amount: number, limit: number) {
  threshold = limit;
  raw += amount;
  lastInputTime = Date.now();
  cancelDecay();
  setState('charging');

  if (raw >= threshold) {
    raw = threshold;
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
  charge(delta, WHEEL_THRESHOLD);
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
  charge(delta, TOUCH_THRESHOLD);
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

  const maybeTarget = getRelatedTop();
  if (maybeTarget === null) {
    setRelatedCollapsed(true);
    return;
  }
  const startTarget: number = maybeTarget; // 클로저(animate)에는 제어흐름 내로잉이 전파되지 않음

  setState('snapping-forward');

  const finish = () => {
    detachTweenGuard(); // 부착 안 된 경로(reduced-motion)에서도 removeEventListener는 no-op
    raw = 0;
    updateProgress();
    setState('arrived');
    releaseRafId = null;
  };

  if (prefersReducedMotion()) {
    // tween 없는 즉시 이동 — 경합할 프레임 구간이 없으니 가드 불필요
    scrollRoot.scrollTop = startTarget;
    finish();
    return;
  }

  attachTweenGuard(); // tween 시작 직전 — finish()에서 반드시 해제
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
    // 컨트롤은 in-flow(문서 흐름 내) — x 센터링은 CSS(margin: auto)가 담당, JS 지오메트리 불필요

    lastScrollTop = scrollRoot.scrollTop;
    scrollRoot.addEventListener('scroll', onScroll, { passive: true });
    scrollRoot.addEventListener('touchstart', onTouchStart, { passive: true });
    scrollRoot.addEventListener('wheel', onWheel, { passive: true });
    scrollRoot.addEventListener('touchmove', onTouchMove, { passive: true });

    document.querySelector('.gate-button')?.addEventListener('click', onGateControlClick);

    resizeListener = () => {
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
      detachTweenGuard(); // tween 중 disconnect돼도 가드 리스너 누수 방지(scrollRootEl null화 전)
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
