import type { FlattenToc } from "../../service/post/types/TocGenrator";

export const findSectionEndIndex = (
  flattenToc: FlattenToc[],
  activeIdIndex: number,
  rootDepth: number,
): number | null => {
  let maxIndex = activeIdIndex;
  for (let i = activeIdIndex; i < flattenToc.length - 1; i++) {
    if (flattenToc[i + 1].depth === rootDepth) {
      maxIndex = i;
      break;
    } else if (i === flattenToc.length - 2 && maxIndex === activeIdIndex) {
      maxIndex = flattenToc.length - 1;
      break;
    }
  }
  return maxIndex;
};
