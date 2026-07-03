// 스크롤 시작 감지 — 센티널이 스크롤 루트 밖으로 나가면 target에 상태 속성만 토글.
// 시각(등장 모션)은 CSS가 data-reveal에 반응한다. HeadingObserver와 동일한 싱글턴 문법.
let observer: IntersectionObserver | null = null;

interface RevealTargets {
  sentinelId: string;
  targetId: string;
  scrollRootId: string;
}

export const ScrollRevealObserver = {
  init({ sentinelId, targetId, scrollRootId }: RevealTargets) {
    if (observer) return;
    const sentinel = document.getElementById(sentinelId);
    const target = document.getElementById(targetId);
    const root = document.getElementById(scrollRootId);
    if (!sentinel || !target || !root) return; // 요소가 없으면 항상 보이는 기본 상태 유지(no-JS와 동일)

    target.dataset.reveal = "hidden";
    observer = new IntersectionObserver(
      ([entry]) => {
        target.dataset.reveal = entry.isIntersecting ? "hidden" : "shown";
      },
      { root, threshold: 0 }
    );
    observer.observe(sentinel);
  },

  disconnect() {
    observer?.disconnect();
    observer = null;
  },
};
