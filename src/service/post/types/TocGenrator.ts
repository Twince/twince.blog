export type TocNode = {
  id: string;
  text: string;
  depth: number;
  children: TocNode[];
}