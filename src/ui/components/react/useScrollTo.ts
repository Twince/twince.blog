export const useScrollTo = (containerId: string) => {
  const scrollTo = (targetId: string, offset: number = 30 ) => {
    const container = document.getElementById(containerId);
    const element = document.getElementById(targetId);

    if(!container || !element) return;

    const containerTop = container.getBoundingClientRect().top;
    const elementTop = element.getBoundingClientRect().top;

    const targetScrollTop = container.scrollTop + (elementTop - containerTop) - offset;
    // 현재 scroll값 + ((viewport기준) 선택된 elementTop - containerTop으로 scroll container높이와 heading간 gap 계산) + offset
    container.scrollTo({
      top: targetScrollTop,
      behavior: "smooth",
    });
  }
   return { scrollTo };
}