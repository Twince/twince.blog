export type TocNode = {
  id: string;
  text: string;
  depth: number;
  children: TocNode[];
}

export type FlattenToc = {
  id: string;
  text: string;
  depth: number;
  parentId: string;
}