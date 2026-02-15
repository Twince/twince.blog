import type { FlattenToc } from "../../service/post/types/TocGenrator";

export const findSectionRootIndex = (flattenToc: FlattenToc[], activeIdIndex: number, rootDepth: number): number | null => {
  if(activeIdIndex === null) return null;
  for(let i=activeIdIndex; i>=0; i--) {
    if(flattenToc[i].depth === rootDepth) return i;
  }
  return null;
}