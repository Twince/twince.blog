import { visit } from 'unist-util-visit';
import type { Element, ElementContent, Root } from 'hast';

const isWhitespaceText = (node: ElementContent) =>
  node.type === 'text' && /^\s*$/.test(node.value);

const isBreak = (node: ElementContent) =>
  node.type === 'element' && node.tagName === 'br';

const isImg = (node: ElementContent): node is Element =>
  node.type === 'element' && node.tagName === 'img';

const hasContent = (nodes: ElementContent[]) => !nodes.every(isWhitespaceText);

/* 소프트브레이크(\n) 경계 검사 — "줄을 나눠 쓴" 이미지와 "문장 속 진짜 인라인" 이미지를
   구분하는 유일한 단서. 경계가 없으면 저자가 인라인을 의도한 것이므로 건드리지 않는다. */
const endsWithLineBreak = (nodes: ElementContent[]) => {
  const last = nodes[nodes.length - 1];
  if (!last) return true; // 비어 있음 = 문단 시작 경계
  return isBreak(last) || (last.type === 'text' && /\n\s*$/.test(last.value));
};
const startsWithLineBreak = (nodes: ElementContent[]) => {
  const first = nodes[0];
  if (!first) return true; // 비어 있음 = 문단 끝 경계
  return isBreak(first) || (first.type === 'text' && /^\s*\n/.test(first.value));
};

const trimTrailing = (nodes: ElementContent[]): ElementContent[] => {
  const out = [...nodes];
  while (out.length && (isWhitespaceText(out[out.length - 1]) || isBreak(out[out.length - 1]))) out.pop();
  const last = out[out.length - 1];
  if (last?.type === 'text') out[out.length - 1] = { ...last, value: last.value.replace(/\s+$/, '') };
  return out;
};
const trimLeading = (nodes: ElementContent[]): ElementContent[] => {
  const out = [...nodes];
  while (out.length && (isWhitespaceText(out[0]) || isBreak(out[0]))) out.shift();
  if (out[0]?.type === 'text') out[0] = { ...out[0], value: out[0].value.replace(/^\s+/, '') };
  return out;
};

/* 이미지 → figure/figcaption 승격. 문단을 이미지 경계로 세그먼트화해 저작 패턴을 흡수한다:
     [선행 본문?] [img (↵ 캡션 텍스트?)] [img (↵ 캡션 텍스트?)] …
   → <p>본문</p> <figure><img><figcaption>캡션|alt</figcaption></figure> …
   캡션 우선순위: 이미지 뒤 연속 줄 텍스트 > alt(단독일 때). alt는 대체 텍스트로 항상 유지.
   모든 이미지가 줄바꿈 경계 위에 있어야 하며, 아니면(문장 속 진짜 인라인) 문단을 건드리지 않는다. */
export function rehypeImgToFigure() {
  let figCount = 0; // alt가 중복돼도 figId가 유일하도록
  return (tree: Root) => {
    // alt 부재 시 장식 이미지로 명시(alt 자체가 없으면 SR이 파일 경로를 낭독)
    visit(tree, { type: 'element', tagName: 'img' }, (node: Element) => {
      if (node.properties?.alt === undefined) {
        node.properties = { ...node.properties, alt: '' };
      }
    });

    visit(tree, { type: 'element', tagName: 'p' }, (p: Element, index, parent) => {
      if (typeof index !== 'number' || !parent) return;
      if (!p.children.some(isImg)) return;

      // 세그먼트화: [선행 런] (img, [후행 런])* — 후행 런은 다음 img 전까지의 인라인 콘텐츠
      const leading: ElementContent[] = [];
      const pairs: { img: Element; run: ElementContent[] }[] = [];
      for (const child of p.children) {
        if (isImg(child)) pairs.push({ img: child, run: [] });
        else if (pairs.length === 0) leading.push(child);
        else pairs[pairs.length - 1].run.push(child);
      }

      // 모든 이미지가 줄바꿈 경계 위에 있는지 검사 — 하나라도 인라인이면 문단 전체 보존
      const boundaries = pairs.every(({ run }, i) => {
        const prevRun = i === 0 ? leading : pairs[i - 1].run;
        return endsWithLineBreak(prevRun) && startsWithLineBreak(run);
      });
      if (!boundaries) return;

      const replacement: ElementContent[] = [];
      if (hasContent(leading)) replacement.push({ ...p, children: trimTrailing(leading) });

      let converted = false;
      for (const { img, run } of pairs) {
        const alt = (img.properties?.alt as string | undefined) ?? '';
        const captionChildren: ElementContent[] =
          hasContent(run) ? trimTrailing(trimLeading(run))
          : alt ? [{ type: 'text', value: alt }]
          : [];

        if (captionChildren.length === 0) {
          replacement.push(img); // 캡션 소스 없음(장식 이미지) — 승격 없이 유지
          continue;
        }

        figCount += 1;
        const figId = `caption-${figCount}`;
        img.properties = {
          ...img.properties,
          'aria-labelledby': figId,
        }; // AEO와 A11Y를 위해 figure와 figcaption 관계맺기

        replacement.push({
          type: 'element',
          tagName: 'figure',
          properties: {},
          children: [
            img,
            { type: 'element', tagName: 'figcaption', properties: { id: figId }, children: captionChildren },
          ],
        });
        converted = true;
      }
      if (!converted) return; // 전부 장식 이미지 — 원문 유지

      parent.children.splice(index, 1, ...replacement);
      return index + replacement.length; // 삽입분 건너뛰고 순회 계속
    });
  }
}
