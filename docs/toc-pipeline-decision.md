# TOC 파이프라인 결정 메모 (보류 중 — 2026-07-19)

## 증상 가족 (커스텀 로더 한 뿌리)

- 콘텐츠 수정 시 TOC 소실 (워처가 frontmatter 원본으로 store 덮어씀 — toc 주입은 초기 1회뿐)
- fresh 부팅 레이스로 posts 컬렉션 empty → 전 포스트 404
- dev 중 이미지 추가/삭제 시 stale (`docs/authoring-images.md` 함정 2)
- 삭제된 포스트가 store에 유령으로 잔존 → `/_image` 500 + 깨진 카드 (digest 조작이 재동기화 방해)

원인 위치: `src/content/config.ts`의 커스텀 로더 — glob 실행 후 store 전체를 순회하며
`markdownToHast` → `tocGenerator.getToc` → `data.toc` 주입 + digest 변조.
**"로드 후 일괄 후처리" 패턴은 워처의 증분 업데이트에 사각지대가 있다.**

## 임시 운용 (결정 전까지)

콘텐츠 파일 추가/삭제/이동 후에는 `pnpm run dev:fresh` (+ 필요시 `node_modules/.astro`,
`node_modules/.vite`까지 삭제). 브라우저 하드 리프레시는 서버 store 오염에 무력하다.

## 해소안 C (채택 유력, 보류 중)

커스텀 로더 → 순정 glob 원복. TOC는 `render(entry)`가 공식 반환하는 `headings`
(depth/slug/text 평면 배열)로 렌더 시점에 트리 빌드. 기존 스택 알고리즘
(`tocGenerator.ts`) 재사용 — 입력만 hast → 평면 배열.

얻는 것: 버그 가족 소멸, 마크다운 이중 컴파일 제거, 본문↔TOC id 단일 출처
(커스텀 slugify와 Astro 슬러거의 구두점 불일치 클래스 수정).

트레이드오프: TOC가 데이터(`entry.data.toc`)에서 렌더 파생물로 격하 —
`render()` 컨텍스트 밖(검색 인덱스·카드 등 미래 소비자)에서는 못 읽음. 현재 소비자는
아티클 페이지 하나라 실비용 0. TocWrapper는 자급자족(slug→fetch)에서 props 수신
(ArticleLayout의 render 결과 배선)으로 계약 변경.

## EDGE 결정 지점 (사용자)

1. TocWrapper 새 props 계약 — headings 원본 vs 빌드된 트리 중 무엇을 받을지
2. `buildTocTree(headings)` 시그니처 + depth 필터 정책
3. 스키마 `toc` 필드 제거 파급 정리 (validateToc·TocGenrator 타입)

검증 체크: 본문 heading id가 정말 Astro 기본 슬러거 산출인지 구현 시 확인.
