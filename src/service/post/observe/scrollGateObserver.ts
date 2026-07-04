// 포스트 상세 페이지 스크롤 게이트
// 상태 머신: hidden → ready ↔ charging ↔ snapping-forward → arrived ↔ snapping-back
// 바닥: IntersectionObserver(gate-sentinel) / 관련포스트-top: IntersectionObserver(related-posts-top-sentinel)
// 위치: position: fixed top 값 동적 변경
// 아이콘↔링: progress에 따라 opacity 토글

let gateObserver: IntersectionObserver | null = null;
let relatedPostsObserver: IntersectionObserver | null = null;
let wheelListener: ((e: WheelEvent) => void) | null = null;
let touchStartListener: ((e: TouchEvent) => void) | null = null;
let touchMoveListener: ((e: TouchEvent) => void) | null = null;

interface ScrollGateConfig {
  sentinelId: string;              // 바닥 도달 감지용 (#gate-sentinel)
  scrollRootId: string;            // 스크롤 컨테이너 (#article-wrapper)
  relatedPostsSentinelId: string;  // 관련포스트-top 진입 감지용 (#related-posts-top-sentinel)
}

// 튜닝값
const TAU = 150;                 // 지수 감쇠 곡선 계수
const RAW_THRESHOLD = 600;       // threshold
const DECAY_RATE = 0.9;          // 프레임당 감쇠율
const DECAY_IDLE_DURATION = 120; // 입력 멈춤 판단 ms
const RELEASE_DURATION = 350;    // snap 애니메이션 시간 ms
const GRACE_PERIOD = 1000;       // 빠른 재도전 유예 시간 ms

type GateState = 'hidden' | 'ready' | 'charging' | 'snapping-forward' | 'arrived' | 'snapping-back';

let state: GateState = 'hidden';
let raw = 0;
let lastInputTime = 0;
let returnedAt = 0;              // snapping-back 완료 시각
let isAtBottom = false;          // 바닥 도달 상태
let isAtTopOfRelated = false;    // 관련포스트 상단 진입

let decayRafId: number | null = null;
let releaseRafId: number | null = null;
let checkDecayTimerId: number | null = null;

let startReleaseTime = 0;
let releaseStartScroll = 0;
let releaseStartTop = 0;
let releaseEndTop = 0;

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function updateProgress() {
  const progress = clamp(1 - Math.exp(-raw / TAU), 0, 1);
  const root = document.documentElement;
  root.style.setProperty('--gate-progress', progress.toString());
  updateIconCrossfade(progress);
}

function updateIconCrossfade(progress: number) {
  // progress가 극단(0 또는 1)에서 벗어날 때 아이콘↔링 크로스페이드
  // 0~0.1: chevron-down → 링으로 페이드아웃
  // 0.1~0.9: 링만 보임
  // 0.9~1: 링 → chevron-up으로 페이드인
  // CSS의 opacity 토글은 JS가 progress 값을 보고 동적으로 조정하거나,
  // 아래처럼 극단값에서만 상태를 바꾸는 방식도 가능

  // 현재 계획: CSS에서 data-gate 상태별로 기본 opacity를 설정하고,
  // progress 값에 따라 중간값(0.1~0.9)에서는 링만 보이도록 추가 조정
  // → 여기선 상태 관리만 하고, 실제 크로스페이드 애니메이션은 CSS transition으로 처리
  // (JS는 극단값 진입 시점에 opacity 값만 바꿈)
}

function setState(newState: GateState) {
  if (state === newState) return;
  state = newState;

  const control = document.querySelector('[data-gate]');
  if (control) {
    control.setAttribute('data-gate', newState);
  }
}

function updateControlPosition(top: number) {
  const control = document.querySelector('.gate-control') as HTMLElement;
  if (control) {
    control.style.top = `${top}px`;
  }
}

// 컨트롤 위치 계산 (vp 기준 fixed)
function getBottomDockingTop(): number {
  return window.innerHeight - 48 - 60; // bottom 48px + control height 60px = top 위치
}

function getTopDockingTop(): number {
  const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 80;
  return headerHeight + 24;
}

function onWheel(e: WheelEvent) {
  // 바닥이고 아래방향일 때만 개입
  if (!isAtBottom || e.deltaY <= 0) return;
  if (state === 'hidden') return;

  e.preventDefault();
  raw += e.deltaY;
  lastInputTime = Date.now();

  // decay 루프가 있으면 멈춤
  if (decayRafId !== null) {
    cancelAnimationFrame(decayRafId);
    decayRafId = null;
  }

  setState('charging');

  if (raw >= RAW_THRESHOLD) {
    raw = RAW_THRESHOLD;
    triggerRelease();
  } else {
    updateProgress();
  }
}

function onTouchStart(e: TouchEvent) {
  if (!isAtBottom || state === 'hidden') return;
  (e.currentTarget as HTMLElement).dataset.touchStartY = e.touches[0].clientY.toString();
}

function onTouchMove(e: TouchEvent) {
  if (!isAtBottom || state === 'hidden') return;

  const touchStart = parseFloat((e.currentTarget as HTMLElement).dataset.touchStartY || '0');
  const delta = touchStart - e.touches[0].clientY;

  if (delta <= 0) return; // 위로 스와이프면 개입 안 함

  e.preventDefault();
  raw += Math.abs(delta);
  lastInputTime = Date.now();

  if (decayRafId !== null) {
    cancelAnimationFrame(decayRafId);
    decayRafId = null;
  }

  setState('charging');

  if (raw >= RAW_THRESHOLD) {
    raw = RAW_THRESHOLD;
    triggerRelease();
  } else {
    updateProgress();
  }
}

function startDecay() {
  if (decayRafId !== null) return;

  function decay() {
    const now = Date.now();
    const timeSinceLastInput = now - lastInputTime;

    // grace period 내에는 decay 멈춤
    if (returnedAt > 0 && now - returnedAt < GRACE_PERIOD) {
      decayRafId = requestAnimationFrame(decay);
      return;
    }

    if (timeSinceLastInput > DECAY_IDLE_DURATION) {
      raw *= DECAY_RATE;
      if (raw < 1) {
        // decay 완료 → ready
        raw = 0;
        updateProgress();
        setState('ready');
        decayRafId = null;
        return;
      }
      updateProgress();
      decayRafId = requestAnimationFrame(decay);
    } else {
      decayRafId = requestAnimationFrame(decay);
    }
  }

  decayRafId = requestAnimationFrame(decay);
}

function checkAndStartDecay() {
  const now = Date.now();
  if (
    raw > 0 &&
    now - lastInputTime > DECAY_IDLE_DURATION &&
    decayRafId === null &&
    releaseRafId === null &&
    state !== 'arrived'
  ) {
    startDecay();
  }
}

function triggerRelease() {
  if (releaseRafId !== null) return;

  setState('snapping-forward');

  const scrollRoot = document.getElementById('article-wrapper');
  const relatedPosts = document.getElementById('related-posts');

  if (!scrollRoot || !relatedPosts) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  startReleaseTime = Date.now();
  releaseStartScroll = scrollRoot.scrollTop;
  releaseStartTop = getBottomDockingTop();
  releaseEndTop = getTopDockingTop();
  const relatedPostsTop = relatedPosts.offsetTop;

  function animate() {
    const now = Date.now();
    const elapsed = now - startReleaseTime;
    const progress = Math.min(elapsed / RELEASE_DURATION, 1);

    if (prefersReducedMotion) {
      scrollRoot.scrollTop = relatedPostsTop;
      updateControlPosition(releaseEndTop);
      raw = RAW_THRESHOLD; // grace period용으로 유지
      returnedAt = Date.now();
      setState('arrived');
      releaseRafId = null;
    } else {
      // cubic-bezier(0.25, 1, 0.5, 1) tween
      const easeProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const newScroll = releaseStartScroll + (relatedPostsTop - releaseStartScroll) * easeProgress;
      scrollRoot.scrollTop = newScroll;

      const newTop = releaseStartTop + (releaseEndTop - releaseStartTop) * easeProgress;
      updateControlPosition(newTop);

      if (progress < 1) {
        releaseRafId = requestAnimationFrame(animate);
      } else {
        raw = RAW_THRESHOLD; // grace period용으로 유지
        returnedAt = Date.now();
        setState('arrived');
        releaseRafId = null;
      }
    }
  }

  releaseRafId = requestAnimationFrame(animate);
}

function onGateControlClick() {
  if (state !== 'arrived') return;

  triggerSnappingBack();
}

function triggerSnappingBack() {
  if (releaseRafId !== null) return;

  setState('snapping-back');

  const scrollRoot = document.getElementById('article-wrapper');
  if (!scrollRoot) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  startReleaseTime = Date.now();
  releaseStartScroll = scrollRoot.scrollTop;
  releaseStartTop = getTopDockingTop();
  releaseEndTop = getBottomDockingTop();

  // 바닥(각주 끝) 위치 계산: 스크롤 높이에서 클라이언트 높이를 뺀 값 중,
  // 관련 포스트 섹션 직전
  const relatedPosts = document.getElementById('related-posts');
  const relatedPostsTop = relatedPosts?.offsetTop ?? scrollRoot.scrollHeight;
  const targetScrollTop = Math.max(0, relatedPostsTop - scrollRoot.clientHeight + 1);

  function animate() {
    const now = Date.now();
    const elapsed = now - startReleaseTime;
    const progress = Math.min(elapsed / RELEASE_DURATION, 1);

    if (prefersReducedMotion) {
      scrollRoot.scrollTop = targetScrollTop;
      updateControlPosition(releaseEndTop);
      raw = 0;
      returnedAt = 0;
      setState('ready');
      releaseRafId = null;
    } else {
      const easeProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const newScroll = releaseStartScroll + (targetScrollTop - releaseStartScroll) * easeProgress;
      scrollRoot.scrollTop = newScroll;

      const newTop = releaseStartTop + (releaseEndTop - releaseStartTop) * easeProgress;
      updateControlPosition(newTop);

      if (progress < 1) {
        releaseRafId = requestAnimationFrame(animate);
      } else {
        raw = 0;
        returnedAt = 0;
        setState('ready');
        releaseRafId = null;
      }
    }
  }

  releaseRafId = requestAnimationFrame(animate);
}

export const ScrollGateObserver = {
  init({ sentinelId, scrollRootId, relatedPostsSentinelId }: ScrollGateConfig) {
    if (gateObserver) return;

    const gateSentinel = document.getElementById(sentinelId);
    const scrollRoot = document.getElementById(scrollRootId);
    const relatedPostsSentinel = document.getElementById(relatedPostsSentinelId);
    const control = document.querySelector('.gate-button');

    if (!gateSentinel || !scrollRoot) return;

    setState('hidden');
    updateProgress();

    // 바닥 도달 감지
    gateObserver = new IntersectionObserver(
      ([entry]) => {
        isAtBottom = !entry.isIntersecting;
        if (isAtBottom && state === 'hidden') {
          setState('ready');
        } else if (!isAtBottom && state === 'ready') {
          setState('hidden');
          raw = 0;
          updateProgress();
        }
      },
      { root: scrollRoot, threshold: 0 }
    );
    gateObserver.observe(gateSentinel);

    // 관련포스트 상단 진입 감지 (arrived 상태에서만)
    if (relatedPostsSentinel) {
      relatedPostsObserver = new IntersectionObserver(
        ([entry]) => {
          isAtTopOfRelated = entry.isIntersecting;
          if (isAtTopOfRelated && state === 'arrived') {
            // 자유 스크롤로 복귀 시작
            triggerSnappingBackFreeScroll();
          }
        },
        { root: scrollRoot, threshold: 0 }
      );
      relatedPostsObserver.observe(relatedPostsSentinel);
    }

    // wheel/touch 리스너
    wheelListener = onWheel;
    scrollRoot.addEventListener('wheel', wheelListener, { passive: false });

    touchStartListener = onTouchStart;
    touchMoveListener = onTouchMove;
    scrollRoot.addEventListener('touchstart', touchStartListener, { passive: true });
    scrollRoot.addEventListener('touchmove', touchMoveListener, { passive: false });

    // 클릭 리스너
    if (control) {
      control.addEventListener('click', onGateControlClick);
    }

    // decay 체크 루프
    if (checkDecayTimerId !== null) clearInterval(checkDecayTimerId);
    checkDecayTimerId = window.setInterval(() => {
      checkAndStartDecay();
    }, 50);
  },

  disconnect() {
    gateObserver?.disconnect();
    relatedPostsObserver?.disconnect();
    gateObserver = null;
    relatedPostsObserver = null;

    const scrollRoot = document.getElementById('article-wrapper');
    if (scrollRoot) {
      if (wheelListener) scrollRoot.removeEventListener('wheel', wheelListener);
      if (touchStartListener) scrollRoot.removeEventListener('touchstart', touchStartListener);
      if (touchMoveListener) scrollRoot.removeEventListener('touchmove', touchMoveListener);
    }

    const control = document.querySelector('.gate-button');
    if (control) {
      control.removeEventListener('click', onGateControlClick);
    }

    if (decayRafId !== null) cancelAnimationFrame(decayRafId);
    if (releaseRafId !== null) cancelAnimationFrame(releaseRafId);
    if (checkDecayTimerId !== null) clearInterval(checkDecayTimerId);

    wheelListener = null;
    touchStartListener = null;
    touchMoveListener = null;
  },
};

// 자유 스크롤로 복귀할 때 (스크롤은 사용자가 이미 하고 있으므로 컨트롤 위치만 tween)
function triggerSnappingBackFreeScroll() {
  if (releaseRafId !== null) return;
  if (state !== 'arrived') return;

  setState('snapping-back');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  startReleaseTime = Date.now();
  releaseStartTop = getTopDockingTop();
  releaseEndTop = getBottomDockingTop();

  function animate() {
    const now = Date.now();
    const elapsed = now - startReleaseTime;
    const progress = Math.min(elapsed / 250, 1); // 250ms (click 버전은 350ms)

    if (prefersReducedMotion) {
      updateControlPosition(releaseEndTop);
      raw = 0;
      returnedAt = 0;
      setState('ready');
      releaseRafId = null;
    } else {
      const easeProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const newTop = releaseStartTop + (releaseEndTop - releaseStartTop) * easeProgress;
      updateControlPosition(newTop);

      if (progress < 1) {
        releaseRafId = requestAnimationFrame(animate);
      } else {
        raw = 0;
        returnedAt = 0;
        setState('ready');
        releaseRafId = null;
      }
    }
  }

  releaseRafId = requestAnimationFrame(animate);
}
