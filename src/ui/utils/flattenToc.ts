import type { FlattenToc, TocNode } from "../../service/post/types/TocGenrator"

export const flattenToc = (
  nodes: TocNode[],
  acc: FlattenToc[] = [],
  parentId: string = '',
): FlattenToc[] => {
  nodes.forEach(node => {
    acc.push({
      id: node.id,
      text: node.text,
      depth: node.depth,
      parentId,
    })
    flattenToc(node.children, acc, node.id);
  });
  return acc;
}