import { useEffect, useState } from "react"

const useActiveHeadingObserver = (ids: string) => {
  // useActiveEeadingsObserver라는 이름은 적절한가?
  // 무엇을 관찰하는 observer 자체를 react에 종속적으로 남기고 싶지 않다면 hook형태가 아닌 순수함수 형태로 해야함.
  // UI가 detected된 headgins를 힐터링해 Styling, linking을 제공한다면 너무 큰 책임을 가짐 = 즉, 이 hook는 감지한 UI elements에 대해 무엇이 활성화되어이 있는가(단일개체)에 대한 책임을 가짐
  // UI는 별도의 요소임(UI는 결과를 소비만 함)
  const [activeId, setActiveId] = useState<string | null>(null)
  
  useEffect(() => {
    // poseObserver 사용 또는 new IntersectionObserver 사용
    // (수정) -> IntersectionObserver를 사용하여 oberverInit에 맞게 들어온 headings(slug)들을 .filter
    // 들어온 heading이 있다면 이를 acitveIds array로 return
    // (수정) -> 여러개의 visableIds들 중 가장 위 id를 선택해서 .filter or .reduce

    // return cleanup
    // 한가지 걱정되는 점: useActiveHeadingObserver가 다른 도메인과 별개로 동작할 수 있어야한다면 이렇게 activeId에 직접 관여하는게 아니라 콜백 함수르로 돌려줘야하는게 아닌가? 하는 고민.
  }, [ids // 각 post마다 id는 바뀌므로 ids를 effect 갱신의 지표로 사용])
  return //TODO: string type의 active된 id(slug) 단수 / viewport가 post에 대한 문서 영역을 지나칠 수 있으므로 nulll이 존재할 수 있음(또는 단일 string slug)
}