import { visit } from 'unist-util-visit';
import type { Element, Root, Parent } from 'hast';

export function rehypeImgToFigure() {
  let figCount = 0; // alt가 중복돼도 figId가 유일하도록
  return (tree: Root) => {
      visit(tree, {type: 'element', tagName: 'img'}, (node: Element, index, parent) => {
        if (typeof index !== 'number' || !parent || parent.type !== 'element') return;

        const alt = node.properties?.alt as string | undefined;
        if(!alt) {
          // alt 부재 시 장식 이미지로 명시(alt 자체가 없으면 SR이 파일 경로를 낭독)
          node.properties = { ...node.properties, alt: '' };
          return;
        }

        if(parent.tagName === 'p') {
          const isOnlyImage = parent.children.every((child) => // every는 모든 값이 truthy할때만 true반환
            (child.type === 'text' && /^\s*$/.test(child.value)) || child === node
          ) // 현재 노드가 text && 빈문자열이거나 자기 자신 그 자체면 = 이미지

          if(isOnlyImage) {
            figCount += 1;
            const figId = `caption-${figCount}-${alt.replace(/\s+/g, '-').toLowerCase()}`;
              node.properties = {
              ...node.properties,
              'aria-labelledby': figId,
            } // AEO와 A11Y를 위해 figure와 figcaption 관계맺기

            const figcaption: Element = {
              type: 'element',
              tagName: 'figcaption',
              properties: { id: figId},
              children: [{ type: 'text', value: alt,}]
            }

            parent.tagName = 'figure';
            parent.children = [node, figcaption] // 이미지만 있을떄 figcaption을 추가하므로, 기존 chilrend 값을 초기화하고 node(img)와 figcaption값만 삽입
          }
        }
    })
  }
}