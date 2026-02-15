import { visit } from 'unist-util-visit';
import type { Element, Root, Parent } from 'hast';

export const imgFigurelizer = {
  transform() {
    return (tree: Root) => {
      visit(tree, {type: 'element', tagName: 'img'}, (node: Element, index, parent) => {
        if (typeof index !== 'number' || !parent || parent.type !== 'element') return;
        
        const alt = node.properties?.alt as string | undefined;
        if(!alt) return;

        if(parent.tagName === 'p') {
          console.log("p 태그가 확인됨.")
          const isOnlyImage = parent.children.every((child) => // every는 모든 값이 truthy할때만 true반환
            (child.type === 'text' && /^\s*$/.test(child.value)) || child === node
          ) // 현재 노드가 text && 빈문자열이거나 자기 자신 그 자체면 = 이미지

          if(isOnlyImage) {
            console.log("only image 들어옴!")
            const figId = `caption-${alt.replace(/\s+/g, '-').toLowerCase()}`;
              node.properties = {
              ...node.properties,
              'aria-labelledby': figId,
            } // AEO와 A11Y를 위해 figure와 figcaption 관계맺기

            const figcaption = { 
              type: 'element', 
              tagName: 'figcaption', 
              properties: { id: figId},  
              children: [{ type: 'text', value: alt,}]
            }

            parent.tagName = 'figure';
            parent.children = [node, figcaption] // 이미지만 있을떄 figcaption을 추가하므로, 기존 chilrend 값을 초기화하고 node(img)와 figcaption값만 삽입

            return tree;
          }
        }
    })
  }

    
  }
}