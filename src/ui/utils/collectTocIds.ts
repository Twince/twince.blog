import type { TocNode } from "../../service/post/types/TocGenrator"

export const collectTocIds = (toc: TocNode[]): string[] => {
  return toc.flatMap((node) => [
    node.id,
    ...collectTocIds(node.children),
  ])
}