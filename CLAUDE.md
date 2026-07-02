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

**완료: root 페이지 Figma v2(3917:491) + mobile(4114:883) 픽셀 매칭 구현.** (2026-07-03)
사용자가 v1/v2 중 **v2(시리즈 위·토픽 아래)** 채택 — 근거: 구체(콘텐츠)→추상(분류) 순서,
밀도 교차 리듬(무거움-가벼움-무거움) 청킹, 칩=피드 진입 어포던스, 모바일 선형화 일관성.

**다음 작업(사용자 EDGE — 학습 모드 결정 지점):**
1. `SeriesCardSummary` 타입 설계 + `getSeriesCards()` 구현 (`service/post/types/SeriesServicer.ts`의 힌트 참고)
   → `RootLayout.astro`의 `MOCK_SERIES` 교체. 핵심: postCount 역참조 집계(N+1 vs 1-pass 맵).
2. 최근 포스트 개수 제한 — `PostGridLayout`에 limit prop vs RecentPosts 래퍼 (계약 결정).
3. 칩·시리즈 카드 라우팅(`/series/[id]`, 카테고리 페이지) — 현재 칩은 비링크, 시리즈 링크는 dead route.
4. 헤더 메뉴 라벨: 코드 POSTS/SERIES/SLIDES vs 시안 POST/SERIES/CATEGORIES — 불일치 해소 결정.

### root 구현 노트 (2026-07-03 사이클)
- `src/ui/css/root/root.css`: **`--root-scale` × Figma raw(정수)** 패턴. row 카드는 `--card-scale`
  컨텍스트 override — 현재 root **1.1**, 태블릿 0.8, 전역(/posts) 1.2. 그리드 gap-x-16(64px).
  **파생 토큰(--card-row-*)은 반드시 소비 지점(.row-post-card)에 선언** — :root에 두면 var()가
  :root에서 치환돼 컨텍스트 override가 무시됨(실제로 밟은 버그, 재발 주의).
- 콘텐츠 컬럼 1100px 중앙(시안 1094), 브레이크포인트 **3단(768/1024, 미디어 레인지 문법)**:
  `<768` 모바일 / `768≤w<1024` 태블릿(--root-scale 0.85·시리즈 2개) / `≥1024` 데스크탑.
  레인지 문법이라 정수 경계 + 소수 뷰포트 갭 없음.
- row 카드는 `<768`에서 CSS만으로 col 시안 변형(flex-col + tags order -1 + topic 숨김).
- hover 시스템: 색은 전부 `--color-brand-hover`(현재 brand-500과 동일값 — **사용자가 직접 튜닝 예정인 임시값**).
  섹션 링 = inset 1.5px(히어로 상단 접합부는 top 밴드 제외 — 헤더 보더와 이중선 방지), 칩 = scale(1.05),
  프로필 hover = 로고·그리드 색 전환 + 그리드 opacity 0.1→0.32, 화살표(↖)는 y축 등장(레일/시리즈 공통 문법).
- series-desc = **하단 고정 존**(margin-top:auto + 4줄 고정 높이 + 상단 정렬) — 길이 무관 시작선 통일.
- 히어로 배경 = `--color-bg-hero`(신설: L=gray-75/D=gray-900) — 페이지 bg와 한 단계 차이.
- Header 모바일 2단 ↔ BaseLayout 높이는 `--header-h`(index.css) 단일 출처. ThemeToggle은 중복 렌더라 id → `data-theme-toggle`.
- 프로필 실측 타이포(design_context): TWINCE=**Pretendard Black(900) 54.161px**(Staatliches 아님!),
  인용구·레일=JetBrains Mono Light 9.478px(레일은 dashed 보더+아래→위), 연락처=Pretendard Light 11.509px+skewX(-18.54°),
  SUNWOO HA 배지=**Jersey 20** 12.186px + backdrop-blur 4px + bg 흰10% + border-primary.
- 배경 아트 = **TwistedGridMotion.astro**(자동 생성): `assets/graphic/twisted_grid.svg`(수식 생성기
  `twisted_ribbon_diverge_converge.html`의 출력)를 파싱해 row들이 곡면 따라 위로 흐르는 SMIL d-morph 컨베이어
  (row_k→row_{k-1} 동시 이동 = 루프 불변 → 이음새 없음. 경계는 외삽 row + 페이드). 재생성 스크립트는 scratchpad에
  있었음 — 필요시 CLAUDE 세션에서 재작성 가능(원리 위 한 줄이면 충분). 유속은 dur(1.2s), 정지 원하면 <animate> 제거.
  121KB 인라인 SMIL이 root HTML에 포함(렌더 ~249KB) — 향후 최적화 후보.
- Opus 리뷰 반영: `--header-h` 단일 출처(index.css), staatliches 토큰 콤마 버그 수정.
  잔여(사용자 사이클): 모바일에서 SeriesLayouts DOM 헛렌더(CSS 숨김만) — getSeriesCards() 도입 시 조건부 렌더로.
- topic id는 **소문자 canonical**(topics.json: dev/design/memoir/…), 표시는 title 또는 CSS uppercase.
  포스트 frontmatter도 소문자 참조로 정합(구 DEV/DESIGN/MEMOIRS는 2026-07-03 일괄 치환).
- 검증: headless Chrome은 **최소 창폭 ~500px** → 모바일은 CDP `Emulation.setDeviceMetricsOverride` 필수.
- 콘텐츠 부채: `posts/neural-network-visualization-4`의 frontmatter title이 nnv-1과 동일(복붙) → root/최근 포스트에 같은 카드 2장 노출.
  미사용 에셋 `assets/graphic/twisted_grid_crop.svg`(크롭 구버전) — 참조 0건, 정리 여부는 사용자 판단.

### 해결된 결정 (이번 사이클에서 인코딩 완료)
1. **`INSIGHT` 라벨 = `topics[0]`의 resolve된 대표 topic.** 표시값은 `topics[0].id`(예: "DEV")로 채택
   — 참조에 `.id`가 이미 있어 **sync**(getEntry/async 불필요). 비면 `null` + (향후) warn.
   나중에 표시명을 키와 다르게(번역/리네임) 하고 싶어지면 그때 `.title` resolve(async)로 전환.
2. **`category` → `tags`로 일괄 통일 완료** (동작에 이름 맞춤). 위계: **topic(상위, 통제된 참조) > tags(포스트별 자유 라벨)**.
   `types/post.ts`의 옛 `tags`/`Post`/`PostMeta`는 죽은 코드.
3. **카드 view-model 타입 계층 (안2, 소비자별 분리 — `service/post/types/PostServicer.ts`)**
   ```
   PostSummary            { slug, title, description }          ← 이웃이 그대로 소비
   NeighborSummary  =     PostSummary                            ← 의미용 별칭(독립 진화 여지)
   PostCardSummary        extends PostSummary { topic: string|null, tags: string[] }
   PostCardWithThumbnail  extends PostCardSummary { thumbnail }  ← 썸네일 없는 list는 PostCardSummary 사용
   ```
   - resolve는 **resolver**가(SRP): `resolvePost`→`ResolvedPost`, `convertToSummaryMapper`가 `topic: topics[0]?.id ?? null` 투영.
   - 코어 필드는 `| null` 제거(데이터 흐름상 non-null), `topic`만 `string|null`.
   - variant(row/col)는 **데이터 타입이 아니라** `PostGridLayout`의 `direction` discriminant가 처리. 카드엔 `{...card}` 스프레드.

### RowDirectionPost 현황 (이번에 퍼블리싱)
- 구현됨: 가로 레이아웃(썸네일 좌 + 우측 topic 라벨/title/description/tags). ColDirectionPost와 동일 토큰·클래스 컨벤션.
- CSS: `postGrid.css`의 `.row-post-card`(thumbnail/`.row-post-topic`). dev에서 `direction="row"` 렌더 검증 완료(이 세션엔 Figma MCP 없어 **픽셀 매칭은 미완** — Figma node 4200:759 기준 재조정 필요).
- **아직 `direction="row"`를 쓰는 라우트 없음** → root/topic/series 페이지에서 와이어링 필요.

### 알려진 기술 부채 (이번 작업 범위 밖, 별도 정리)
- `astro build`/`sync`가 이 환경에서 "Vite module runner closed"로 실패(콘텐츠 로더). **`astro dev`는 정상.** clean HEAD에서도 재현 → 환경 이슈.
- 기존 tsc 에러 다수: Astro5 content-layer 마이그레이션(`utils/resolver.ts`의 `.slug`/`.render` 제거), `getCollection` 필터 콜백 반환 타입 오타(`postServicer.ts:38`), unist/rehype visitor 타이핑, strict-null(`Toc.tsx` 등), `sorter.ts` import 경로.
