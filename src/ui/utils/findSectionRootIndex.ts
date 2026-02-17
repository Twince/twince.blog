import type { FlattenToc } from "../../service/post/types/TocGenrator";

export const findSectionRootIndex = (flattenToc: FlattenToc[], activeIdIndex: number, rootDepth: number, hiddenDepth: number): number | null => {
  if(activeIdIndex === null) return null;
  for(let i=activeIdIndex; i>=0; i--) {
    if((flattenToc[i].depth === rootDepth) || (flattenToc[i].depth === hiddenDepth)) return i;
  }
  return null;
}