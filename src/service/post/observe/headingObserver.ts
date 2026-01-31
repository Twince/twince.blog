import type { ActiveId } from "../types/HeadingObserver";

let activeId: ActiveId = null;
let observer: IntersectionObserver | null = null;

export const HeadingObserver = {
  init(root: HTMLElement) {
    if(observer) return;
    observer = new IntersectionObserver((entries) => {
      const isVisable = entries.filter((entry) => entry.isIntersecting)
      if(isVisable.length === 0) return;
      const topHeading = isVisable.reduce((prev, curr) => prev.boundingClientRect.top < curr.boundingClientRect.top ? prev : curr)
      const nextActiveId = topHeading.target.id;
      if(nextActiveId === activeId) return;
      activeId = nextActiveId;
      
    }, {
      root: root,
      rootMargin: "0px 0px -70% 0px",
      threshold: 0,
    }
    )
  },

  bind(idList: string[]) {
    if(!observer) throw new Error("HeadingObserver.init() must be called first")
    activeId = null;
    const headings = Array.from(idList.map((id) => document.querySelector(`#${CSS.escape(id)}`))) //TODO: slug hash로 수정 or 정합화 로직 수정
    if(headings.length === 0 || headings === null) {
      console.error("heading이 존재하지 않음");  
      return;
    }
    headings.forEach((heading) => observer?.observe(heading));
  },
  disconnect() {
    if(!observer) throw new Error("HeadingObserver.init() must be called first")
    observer.disconnect();
  },

  getActiveId(): ActiveId {
    return activeId;
  }
}

export function createHaadingObserver() {

}