import { visit } from 'unist-util-visit';
import type { Element, Root } from 'hast';

// GFM 각주 섹션(section.footnotes)을 <details>/<summary> 토글로 변환.
// summary = [화살표 아이콘] 각주 (n)  — n은 각주 개수.
// 아이콘은 assets/icons/arrow_left.svg의 path를 currentColor로 인라인(원본은 fill=black 하드코딩).
const ARROW_LEFT_PATH =
  'M13.1625 15.5876C13.3386 15.7637 13.4375 16.0026 13.4375 16.2516C13.4375 16.5007 13.3386 16.7396 13.1625 16.9157C12.9863 17.0918 12.7475 17.1908 12.4984 17.1908C12.2493 17.1908 12.0105 17.0918 11.8343 16.9157L5.58433 10.6657C5.49693 10.5786 5.42759 10.4751 5.38027 10.3611C5.33295 10.2472 5.30859 10.125 5.30859 10.0016C5.30859 9.87824 5.33295 9.75606 5.38027 9.64211C5.42759 9.52815 5.49693 9.42466 5.58433 9.33756L11.8343 3.08756C12.0105 2.91144 12.2493 2.8125 12.4984 2.8125C12.7475 2.8125 12.9863 2.91144 13.1625 3.08756C13.3386 3.26368 13.4375 3.50255 13.4375 3.75163C13.4375 4.0007 13.3386 4.23957 13.1625 4.41569L7.5773 10.0008L13.1625 15.5876Z';

function textEl(tagName: string, className: string, value: string): Element {
  return {
    type: 'element',
    tagName,
    properties: { className: [className] },
    children: [{ type: 'text', value }],
  };
}

export function rehypeFootnotesToggle() {
  return (tree: Root) => {
    visit(tree, { type: 'element', tagName: 'section' }, (node: Element) => {
      const className = node.properties?.className;
      if (!Array.isArray(className) || !className.includes('footnotes')) return;

      const ol = node.children.find(
        (child): child is Element => child.type === 'element' && child.tagName === 'ol'
      );
      const count = ol
        ? ol.children.filter((child) => child.type === 'element' && child.tagName === 'li').length
        : 0;

      // GFM이 넣는 숨김 h2(#footnote-label)는 summary가 라벨을 대신하므로 제거
      const body = node.children.filter(
        (child) => !(child.type === 'element' && child.tagName === 'h2')
      );

      const arrow: Element = {
        type: 'element',
        tagName: 'svg',
        properties: {
          className: ['footnotes-toggle-arrow'],
          viewBox: '0 0 20 20',
          width: '16',
          height: '16',
          fill: 'none',
          'aria-hidden': 'true',
        },
        children: [
          {
            type: 'element',
            tagName: 'path',
            properties: { d: ARROW_LEFT_PATH, fill: 'currentColor' },
            children: [],
          },
        ],
      };

      const summary: Element = {
        type: 'element',
        tagName: 'summary',
        properties: { className: ['footnotes-summary'] },
        children: [
          arrow,
          textEl('span', 'footnotes-title', '각주'),
          textEl('span', 'footnotes-count', `(${count})`),
        ],
      };

      const details: Element = {
        type: 'element',
        tagName: 'details',
        properties: { className: ['footnotes-toggle'], open: true },
        children: [summary, ...body],
      };

      node.children = [details];
    });
  };
}
