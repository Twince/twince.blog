import type { FlattenToc } from "../../service/post/types/TocGenrator";

export const findActiveIdIndex = (flattenToc: FlattenToc[], activeId: string): number => {
  for(let i=0; i<flattenToc.length; i++) {
    if(flattenToc[i].id === activeId) return i;
  }
}