import type { FlattenToc } from "../../service/post/types/TocGenrator";

export interface TocProps {
  idList: string[],
  flattenToc: FlattenToc[],
}
