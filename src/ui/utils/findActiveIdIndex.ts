import type { FlattenToc } from "../../service/post/types/TocGenrator";

export const findActiveIdIndex = (flattenToc: FlattenToc[], activeId: string): number => {
  return flattenToc.findIndex((item) => item.id === activeId); // 미발견 -1 (기존 undefined와 소비처 비교 결과 동일)
}