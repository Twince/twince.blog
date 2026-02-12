import { unified } from "unified";
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import type { Root as MdastRoot } from 'mdast';
import type { Root as HastRoot } from 'hast';
import { imgFigurelizer } from "../service/post/observe/imgFigurelizer";

export async function markdownToHast(markdown: string): Promise<HastRoot> {
  const processor = unified() // 반드시 함수 내부에서 매번 생성
    .use(remarkParse)
    .use(remarkRehype)

  const mdast = processor.parse(markdown);
  const hast = await processor.run(mdast) as HastRoot;
  
  return hast;
}