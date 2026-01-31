import { unified } from "unified";
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import type { Root as MdastRoot } from 'mdast';
import type { Root as HastRoot } from 'hast';

export async function markdownToHast(markdown: string): Promise<HastRoot> {
  const processor = unified()
    .use(remarkParse) // Markdown -> MDAST
    .use(remarkRehype); // MDAST -> HAST 변환 엔진 장착

  const mdast = processor.parse(markdown); // 동기 파싱
  const hast = await processor.run(mdast); // 변환 실행 (Async)
  
  return hast as HastRoot;
}