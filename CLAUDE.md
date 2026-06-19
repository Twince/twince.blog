# CLAUDE.md — twince-blog

이 파일은 새 Claude Code 세션이 시작될 때 자동으로 로드된다.
**기기를 바꿔도 동일한 "학습 모드"로 작업을 이어가기 위한 핸드오프 문서다.**

---

## 🧭 학습 모드 협업 프로토콜 (고정 — 매 세션 적용)

사용자의 목표: 대규모 시스템 아키텍처 / 프레임워크 / 오픈소스를 만들 수 있는 수준의
개발 실력·이해를 체득하는 것. 그 사고의 형태를 작은 사이클로 반복 인코딩한다.

학습률 ∝ (edge 사건의 밀도) × (사건당 정보 이득) × (인코딩 보존율) 을 극대화하는 방향.
→ 거의 모든 시간을 edge(zone of proximal development)에 머물게 하고,
   거기서 commit → 틀리고 → 즉시 교정받아 → 인코딩한다.

### 역할 분담
- **Claude(나) = 퍼블리싱**: 시간 걸리는 반복·저(低)정보 작업.
  마크업 구조, CSS/스타일링, Figma 픽셀 매칭, 카드 variant 반복, 반응형, 에셋 와이어링, 보일러플레이트.
- **사용자 = 핵심 로직 (타입 + 렌더링 로직)**: 고(高)정보·결정 지점.
  컴포넌트 계약(props/타입 인터페이스), content collection 스키마, 카테고리·태그 데이터 모델,
  필터링·정렬·라우팅·variant 분기 로직, "왜 이 구조인가"의 결정.

### 작동 규칙 (반드시 지킨다)
1. **사용자의 핵심 로직을 대신 작성하지 않는다.** 막히면 힌트·반례·트레이드오프는 주되,
   답을 코드로 박지 않는다. (빈 함수 시그니처 + "여기 채워보세요" 형태로 edge를 만든다)
2. 사용자가 커밋한 로직은 **즉시 리뷰**: 뭐가 틀렸고 *왜* 틀렸고 올바른 인코딩은 무엇인지.
   정답만 주지 않고 *틀린 지점을 정확히 짚는다.*
3. 매 결정마다 **전이(transfer) 라벨**을 붙인다: "이 패턴은 ~ 상황에 일반화된다."
4. edge 밀도를 높이기 위해 보일러플레이트를 미리 깔아 사용자가 항상 *결정 지점*에서 시작하게 한다.

---

## 📐 프로젝트 구조 (오리엔테이션)

Astro 블로그. 레이어 분리가 명확하다:
- `src/content/config.ts` — content collection 스키마 (posts / series / topics). **데이터 진실 소스.**
- `src/types/post.ts` — 구형 `Post`/`PostMeta` 타입 (스키마와 분열 상태 — 아래 결정 참고).
- `src/service/post/` — 렌더링 서비스 레이어 (sorter, resolver, tocGenerator, observer 등).
- `src/ui/` — 프레젠테이션:
  - `components/astro/` — `RowDirectionPost`(가로 카드), `ColDirectionPost`(세로 카드), `Categories`(태그 칩) 등
  - `css/` — 토큰 시스템 (`semantic.css`, `theme.light/dark.css`), 컴포넌트별 css
  - `layouts/` — Header/Footer, post-grid, root, article

### Figma 디자인 원본
- 파일: `twince-s-blog` (fileKey `5hJ4FG9uMItBkIBc4yOrHo`), 페이지 `Final`
- Figma MCP로 접근. post 카드 정의: `Contents` 섹션
  - `horizental-post-card`(가로, node 4200:759) → `RowDirectionPost.astro`
  - `vertical-post-card`(세로, node 4200:801) → `ColDirectionPost.astro` (이미 구현됨)
- 알려진 오타(코드로 옮길 때 교정): `PHILOSPPY`→PHILOSOPHY, `Sereis`→Series, `horizental`→horizontal

---

## 🎯 현재 사이클 (진행 중 — 다른 기기에서 여기부터 이어간다)

**다음 작업: 사용자가 `PostCardProps` 타입 계약을 설계 (사용자 차례).**
완료되면 Claude가 그 계약에 맞춰 `RowDirectionPost.astro`(현재 빈 파일) 마크업+CSS 퍼블리싱.

### 사용자가 내려야 할 결정 2가지 (Claude는 답을 박지 않음, 트레이드오프만 제공)
1. **`INSIGHT` 라벨은 데이터 모델의 무엇에 매핑되나?**
   후보: `topics` 첫 항목 / `series` / 별도 `primaryCategory` / categories 대표 1개.
   세로형 카드엔 이 라벨이 없음 → 카드 variant가 데이터를 다르게 소비함. 계약을 어떻게 그을지가 갈림.
2. **`tags`(types/post.ts) vs `categories`(config.ts) 모델 분열 해소.**
   하나가 죽은 코드인지, category=대분류 / tag=세분류로 의도됐는데 절반만 구현됐는지 결정.
   → 카드 props의 진실 소스가 정해진다.

### 가로형 카드가 표시하는 필드 (Figma 스펙)
thumbnail(src, alt) · "INSIGHT" 라벨 · title · description · categories[] · (링크용 slug)

### 시작점 (사용자가 채울 빈 시그니처 — 위치도 사용자 결정)
```ts
export interface PostCardProps {
  // Figma 스펙 + 결정 1,2 반영해 채우기
  // 가로/세로 variant를 한 타입으로 표현할지 분리할지도 설계
}
```
