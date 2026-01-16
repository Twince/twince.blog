// module
import { visit } from "unist-util-visit";

// type
import type { TocNode } from "../types/TocGenrator";
import type { Root, Element, Text } from "hast";

export const tocGenerator = {
  getToc(tree: Root): TocNode[] {
    const tocNode: TocNode[] = [];
    const stack: TocNode[] = [];
    visit(tree, "element", (node: Element) => {
      if (!isHeading(node)) return;

      const depth = getHeadingDepth(node);
      const text = extractText(node); // 현재 headings의 text값을 title로 지정
      const id = slugify(text); // ex. Title Example -> title-example 형태로 변환

      node.properties = node.properties || {};
      node.properties.id = id;

      const toc: TocNode = {
        id: id,
        text: text,
        depth: depth,
        children: [],
      };

      while (stack.length > 0 && stack.at(-1)!.depth >= depth) stack.pop(); // stack.length가 0보다 크고, stack의 현재 값에 대해 부모가 되어줄 수 없으면 pop
      if (stack.length === 0) tocNode.push(toc); // stack이 없으면 그 요소는 그냥 tocNode에 push
      if (stack.length > 0) stack.at(-1)!.children.push(toc); // 현재 depth가 stack의 top보다 더 하위라면 child로 push (stack.length > 0)
      stack.push(toc); // 현재 노드는 이후의 부모 노드의 후보가 됨.
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
  visit(children, "text", (node: Text) => (result += node.value));
  return result;
};

const slugify = (text: string): string => {
  return text.split(" ").join("-").toLowerCase();
}; // TODO: title이 완전히 겹칠 시 -1 을 붙이는 식의 엣치케이스 보완로직 추가
