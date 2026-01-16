import type { TocNode } from "../types/TocGenrator";

const isTocNode = (toc: unknown): toc is TocNode  => {
  if(typeof toc !== 'object' || toc === null) return false;

  const node = toc as Record<string, unknown>;

  if(typeof node.id !== 'string') return false;
  if(typeof node.text !== 'string') return false;
  if(typeof node.depth !== 'number') return false;
  if(!Array.isArray(node.children)) return false;

  return node.children.every((v) => isTocNode(v));
}

export const validateToc = (metadata: unknown): TocNode[] | null => {
  if(!Array.isArray(metadata)) return null;
  if(metadata.every((v) => isTocNode(v))) {
    return metadata;
  }
  return null;
}