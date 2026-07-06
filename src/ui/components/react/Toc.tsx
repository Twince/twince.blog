import { useEffect, useRef, useState } from "react";
import { HeadingObserver } from "../../../service/post/observe/headingObserver";
import { useScrollTo } from "./useScrollTo";
import { findActiveIdIndex } from "../../utils/findActiveIdIndex";
import { findSectionRootIndex } from "../../utils/findSectionRootIndex";
import { findSectionEndIndex } from "../../utils/findSectionEndIndex";

import clsx from 'clsx';
import type { TocProps } from "../../types/TocProps";


export const Toc = ({idList, flattenToc}: TocProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const [sectionRootIndex, setSectionRootIndex] = useState<number | null>(null);
  const [currentActiveIndex, setCurrentActiveIndex] = useState<number | null>(0);
  const [sectionEndIndex, setSectionEndIndex] = useState<number | null>(null);
  const rootContainerId = 'article-wrapper'
  const rootDepth = 2;
  const hiddenDepth = 6;

  const { scrollTo } = useScrollTo(rootContainerId);
  const lastActiveIdRef = useRef<string | null>(null);

  const scrollIntoView = (itemId: string) => {
    scrollTo(itemId);
  }

  useEffect(() => {
  const root = document.getElementById(rootContainerId);
  if(!root) return;
    HeadingObserver.init(root);
    HeadingObserver.bind(idList);
    const onChange = () => {
      const activeId = HeadingObserver.getActiveId();
      if (activeId === lastActiveIdRef.current) return; // 스크롤 프레임마다 동일 값 O(n) 재스캔 방지
      lastActiveIdRef.current = activeId;
      setActiveId(activeId)

      if(activeId != null) {
        const activeIdIndex = findActiveIdIndex(flattenToc, activeId)
        setCurrentActiveIndex(activeIdIndex)
        setSectionRootIndex(findSectionRootIndex(flattenToc, activeIdIndex, rootDepth, hiddenDepth));
        setSectionEndIndex(findSectionEndIndex(flattenToc, activeIdIndex, rootDepth, hiddenDepth));
      }
    };
    
    root.addEventListener("scroll", onChange);
    
    return () => {
      HeadingObserver.disconnect();
      root.removeEventListener("scroll", onChange)
    };
  }, [])

  let headingCount = 0;
  return(
    <div className={"pt-8 toc-root"}>
    <h2 className={"font-black -traslate-x-4 underline-offset-2"}>TABLE OF CONTENTS</h2>
    <ul>
      {flattenToc.map((item, index) => {
        const activeBorderCondition = (index >= sectionRootIndex) && (index <= sectionEndIndex);
        const activeTextCondition = (index <= currentActiveIndex) && (index >= sectionRootIndex);
        const primaryHeading = item.depth === rootDepth || item.depth === hiddenDepth;

        if(primaryHeading) headingCount++;
        return (
          <li key={item.id} className={"flex max-w-[33ch] break-keep"} onClick={() => scrollIntoView(item.id)} >
            <div key={item.id} toc-depth={item.depth}
            className={clsx(
              "toc-item flex h-fit relative hover:border-text-quaternary transition-[box-shadow] duration-300 ease-in-out ",
              activeBorderCondition ? "border-l-2 border-brand-hover! hover:shadow-[inset_1px_0_0_0_var(--color-brand-hover)]" : "border-l-1x border-bg-primary hover:shadow-[inset_1px_0_0_0_var(--color-text-quaternary)]",
              activeTextCondition ? "text-brand-hover!" : "text-text-primary",
              currentActiveIndex === index ? "shadow-[inset_0.5px_0_0_0_var(--color-brand-hover)]" : "",
              index === 0 && "mt-4!"
              )}>
                {primaryHeading && (<p className={"root-index"}>{String(headingCount).padStart(2, '0')}</p>)}
                <div className={"pl-10 h-fit"}><p className={"sub-title truncate hover:translate-x-0.5 rounded-[1px] duration-300 ease-out"}>{`${item.text}`}</p></div>
            </div>
          </li>
        )})}
    </ul>
    </div>
  )  
}