import { useEffect, useState } from "react";
import { HeadingObserver } from "../../../service/post/observe/headingObserver";
import { collectTocIds } from "../../utils/collectTocIds";

import type { TocProps } from "../../types/TocProps";
import type { TocNode } from "../../../service/post/types/TocGenrator";

export const Toc = ({idList, flattenToc}: TocProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  useEffect(() => {
    HeadingObserver.init();
    HeadingObserver.bind(idList);
    const onChange = () => setActiveId(HeadingObserver.getActiveId());
    window.addEventListener("scroll", onChange);
    
    return () => window.addEventListener("scroll", onChange);
  }, [])

  useEffect(() => console.log(activeId) ,[activeId])
}