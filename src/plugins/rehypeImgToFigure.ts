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

/* 같은 줄 위의 공백만 있는 간격(줄바꿈 없음) — 이미지 나란히 배치의 판별 기준 */
const isInlineGap = (nodes: ElementContent[]) =>
  nodes.every((n) => isWhitespaceText(n) && !(n.type === 'text' && n.value.includes('\n')));

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

/* 이미지 → figure/figcaption 승격 + 저작 편의 문법. 문단을 이미지 경계로 세그먼트화한다:
     [선행 본문?] [img 그룹 (↵ 캡션 텍스트?)]* …
   - img 그룹: 같은 줄에 나란히 쓴 이미지들(줄바꿈 없는 공백 간격) → <div class="img-row"> 가로 배치
   - 캡션 우선순위: 그룹 뒤 연속 줄 텍스트(공동 캡션) > alt. 공동 캡션이 없는 그룹은
     이미지별 alt가 각자의 캡션으로 승격된다(단독 이미지의 alt 폴백과 동일 의미론).
     공동 캡션이 있으면 alt는 대체 텍스트(SR 전용)로만 유지
   - 크기 힌트: alt 끝의 |폭 또는 |폭x높이 (예: ![도면|400](...)) → width:min(100%, 400px), 비율 유지
     (Obsidian 리사이즈 문법과 호환 — 높이값은 비율 붕괴 방지를 위해 무시)
   모든 이미지가 줄바꿈 경계 위에 있어야 하며, 아니면(문장 속 진짜 인라인) 문단을 건드리지 않는다. */
export function rehypeImgToFigure() {
  let figCount = 0; // alt가 중복돼도 figId가 유일하도록

  /* figure+figcaption 생성. labelTarget이 있으면(이미지 1장짜리) img 쪽에
     aria-labelledby를 걸고, 없으면(공동 캡션 행) figure가 관계를 소유한다 */
  const makeCaptionedFigure = (
    body: ElementContent,
    captionChildren: ElementContent[],
  ): Element => {
    figCount += 1;
    const figId = `caption-${figCount}`;
    /* aria-labelledby는 항상 figure에 — img에 걸면 accname 우선순위상 alt가 소거되어
       "alt는 SR 전용으로 유지"라는 저작 계약(docs/authoring-images.md)이 깨진다 */
    return {
      type: 'element',
      tagName: 'figure',
      properties: { 'aria-labelledby': figId },
      children: [
        body,
        { type: 'element', tagName: 'figcaption', properties: { id: figId }, children: captionChildren },
      ],
    };
  };

  return (tree: Root) => {
    let sawFloat = false; // 플로트 힌트가 없는 문서(대다수)에서 정리 패스를 건너뛰기 위한 플래그
    visit(tree, { type: 'element', tagName: 'img' }, (node: Element) => {
      // alt 부재 시 장식 이미지로 명시(alt 자체가 없으면 SR이 파일 경로를 낭독)
      if (node.properties?.alt === undefined) {
        node.properties = { ...node.properties, alt: '' };
        return;
      }
      // 힌트 파싱 — alt 끝의 |토큰 나열(순서 무관): |400·|400x300 = 표시 폭, |left·|right = 본문 랩 플로트.
      // 폭은 표시만 제한(srcset·원본 비율 불변), 플로트는 문단 승격 단계에서 클래스로 반영된다
      let alt = node.properties.alt as string;
      let width: string | undefined;
      let float: string | undefined;
      let hint: RegExpMatchArray | null;
      // 폭은 2~4자리(10–9999px)만 힌트로 인정 — "비교 1|2" 같은 정당한 alt를 오인하지 않기 위한 하한
      while ((hint = alt.match(/^(.*?)\s*\|\s*((\d{2,4})(?:x\d+)?|left|right)\s*$/))) {
        const token = hint[2];
        if (token === 'left' || token === 'right') float = token;
        else width = hint[3];
        alt = hint[1];
      }
      if (width || float) {
        if (float) sawFloat = true;
        node.properties = {
          ...node.properties,
          alt,
          ...(width && { style: `width:min(100%, ${width}px);height:auto;` }),
          ...(float && { dataFloat: float }),
        };
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

      // 같은 줄 이미지들을 하나의 그룹(가로 배치)으로 병합
      const groups: { imgs: Element[]; run: ElementContent[] }[] = [];
      for (const { img, run } of pairs) {
        const last = groups[groups.length - 1];
        if (last && isInlineGap(last.run)) {
          last.imgs.push(img);
          last.run = run;
        } else {
          groups.push({ imgs: [img], run });
        }
      }

      // 모든 그룹이 줄바꿈 경계 위에 있는지 검사 — 하나라도 인라인이면 문단 전체 보존
      const boundaries = groups.every(({ run }, i) => {
        const prevRun = i === 0 ? leading : groups[i - 1].run;
        return endsWithLineBreak(prevRun) && startsWithLineBreak(run);
      });
      if (!boundaries) return;

      const replacement: ElementContent[] = [];
      if (hasContent(leading)) replacement.push({ ...p, children: trimTrailing(leading) });

      let converted = false;
      for (const { imgs, run } of groups) {
        const single = imgs.length === 1;
        // 트리밍 후 빈 런(<br>·공백뿐)은 캡션 소스가 아니다 — []는 truthy라 그대로 두면
        // 빈 figcaption이 생성되고 alt 폴백까지 억제된다(hasContent는 br을 못 거름)
        const trimmedRun = trimTrailing(trimLeading(run));
        const shared = trimmedRun.length > 0 ? trimmedRun : null;

        if (single) {
          const img = imgs[0];
          const float = img.properties?.dataFloat as string | undefined;
          const alt = (img.properties?.alt as string | undefined) ?? '';
          const caption: ElementContent[] | null =
            shared ?? (alt ? [{ type: 'text', value: alt }] : null);
          const el: Element = caption ? makeCaptionedFigure(img, caption) : img;
          if (float) {
            // 플로트는 최외곽(figure 또는 bare img)에 — 뒤따르는 문단이 감싸 흐른다
            el.properties = { ...el.properties, className: [`img-float-${float}`] };
          }
          replacement.push(el);
          if (caption || float) converted = true; // 둘 다 없으면 장식 단독 이미지 — 원문 유지 후보
          continue;
        }

        converted = true; // 나란히 배치는 캡션 유무와 무관하게 img-row로 변환됨
        if (shared) {
          const row: ElementContent = {
            type: 'element', tagName: 'div', properties: { className: ['img-row'] }, children: imgs,
          };
          replacement.push(makeCaptionedFigure(row, shared));
          continue;
        }
        // 공동 캡션 없음 — alt 있는 이미지는 각자의 figure+figcaption으로(셀별 캡션)
        const cells = imgs.map((img): ElementContent => {
          const alt = (img.properties?.alt as string | undefined) ?? '';
          return alt ? makeCaptionedFigure(img, [{ type: 'text', value: alt }]) : img;
        });
        replacement.push({
          type: 'element', tagName: 'div', properties: { className: ['img-row'] }, children: cells,
        });
      }
      if (!converted) return; // 전부 장식 단독 이미지 — 원문 유지

      parent.children.splice(index, 1, ...replacement);
      return index + replacement.length; // 삽입분 건너뛰고 순회 계속
    });

    // 플로트 마커는 문단 승격 단계에서 소비 완료 — 어떤 경로든(row 셀·인라인·미변환 문단)
    // data-float 속성이 HTML로 새지 않게 일괄 제거. 힌트가 아예 없던 문서는 순회 생략
    if (sawFloat) {
      visit(tree, { type: 'element', tagName: 'img' }, (node: Element) => {
        if (node.properties && 'dataFloat' in node.properties) delete node.properties.dataFloat;
      });
    }
  }
}
