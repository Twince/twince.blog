import { visit } from "unist-util-visit";

import type { TocNode } from "../types/TocGenrator";
import type { Root, Element, Text } from "hast";

export const tocGenerator = {
  getToc(tree: Root): TocNode[] {
    const tocNode: TocNode[] = [];
    const stack: TocNode[] = [];
    visit(tree, "element", (node: Element) => {
      if (!isHeading(node)) return;

      const depth = getHeadingDepth(node);
      const text = extractText(node);
      const id = slugify(text);

      node.properties = node.properties || {};
      node.properties.id = id;

      const toc: TocNode = {
        id: id,
        text: text,
        depth: depth,
        children: [],
      };

      // 스택 = 조상 후보. 자기보다 깊거나 같은 top을 걷어내면 남는 top이 부모(없으면 루트)
      while (stack.length > 0 && stack.at(-1)!.depth >= depth) stack.pop();
      if (stack.length === 0) tocNode.push(toc);
      if (stack.length > 0) stack.at(-1)!.children.push(toc);
      stack.push(toc);
    });
    return tocNode;
  },
};

const isHeading = (node: Element): boolean => {
  return /^h[1-6]$/.test(node.tagName);
};

const getHeadingDepth = (node: Element): number => {
  return Number(node.tagName[1]);
};

const extractText = (children: Element): string => {
  let result: string = "";
  visit(children, "text", (node: Text) => {
    result += node.value; // 표현식 화살표는 문자열이 visitor 반환값으로 흘러 타입 에러
  });
  return result;
};

const slugify = (text: string): string => {
  return text.split(" ").join("-").toLowerCase();
}; // TODO: title이 완전히 겹칠 시 -1 을 붙이는 식의 엣치케이스 보완로직 추가
