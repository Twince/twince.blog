import { useEffect, useState } from "react";
import { HeadingObserver } from "../../../service/post/observe/headingObserver";
import { findActiveIdIndex } from "../../utils/findActiveIdIndex";
import { findSectionRootIndex } from "../../utils/findSectionRootIndex";
import clsx from 'clsx';

import type { TocProps } from "../../types/TocProps";
import type { TocNode } from "../../../service/post/types/TocGenrator";
import { findSectionEndIndex } from "../../utils/findSectionEndIndex";

export const Toc = ({idList, flattenToc}: TocProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const [sectionRootIndex, setSectionRootIndex] = useState<number | null>(0);
  const [currentActiveIndex, setCurrentActiveIndex] = useState<number | null>(0);
  const [sectionEndIndex, setSectionEndIndex] = useState<number | null>(0);

  const rootDepth = 2;
  useEffect(() => {
    const root = document.getElementById('article-wrapper');
    if(!root) return;

    HeadingObserver.init(root);
    HeadingObserver.bind(idList);

    const onChange = () => {
      const activeId = HeadingObserver.getActiveId();
      setActiveId(activeId)

      const activeIdIndex = findActiveIdIndex(flattenToc, activeId)
      if(activeIdIndex === null) console.log("activeId is null now!")
      setCurrentActiveIndex(activeIdIndex)
      setSectionRootIndex(findSectionRootIndex(flattenToc, activeIdIndex, rootDepth));
      setSectionEndIndex(findSectionEndIndex(flattenToc, activeIdIndex, rootDepth));
    };
    root.addEventListener("scroll", onChange);
    console.log(flattenToc)
    
    return () => root.removeEventListener("scroll", onChange);
  }, [])

  useEffect(() => console.log(currentActiveIndex) ,[currentActiveIndex])

  let rootheadingCount = 0;
  return(
    <div className={"pt-8"}>
    <h2 className={"font-black -traslate-x-4 underline-offset-2"}>TABLE OF CONTENTS</h2>
    <ul>
      {flattenToc.map((item, index) => {
        const activeBorderCondition = index >= sectionRootIndex && index <= sectionEndIndex;
        const activeTextCondition = index <= currentActiveIndex && index >= sectionRootIndex;

        if(item.depth === rootDepth) rootheadingCount++;
        return (
          <li key={item.id} className={"flex"}>
            <div key={item.id} toc-depth={item.depth} 
            className={clsx(
              "toc-item flex relative hover:border-text-quaternary transition-[box-shadow] duration-300 ease-in-out",
              activeBorderCondition ? "border-l-2 border-text-active! hover:shadow-[inset_1px_0_0_0_var(--color-text-active)]" : "border-l-1x border-bg-primary hover:shadow-[inset_1px_0_0_0_var(--color-text-quaternary)]",
              activeTextCondition ? "text-text-active!" : "text-text-primary",
              item.depth === 2 ? "mt-7 h-7 pb-0.5" : "mt-0",
              index === 0 && "mt-4!"
              )}>
                {item.depth === rootDepth && (<p className={"root-index"}>{String(rootheadingCount).padStart(2, '0')}</p>)}
                <div className={"pl-10"}><p className={"hover:translate-x-0.5 rounded-[1px] duration-300 ease-out"}>{`${item.text}`}</p></div>
            </div>
          </li>
        )})}
    </ul>
    </div>
  )  
}