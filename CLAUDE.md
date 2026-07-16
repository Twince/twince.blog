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

**시리즈 페이지 1차 구현 완료(2026-07-03)**: `/series` 목록(SeriesListItem, 썸네일 덱+tally) +
`/series/[id]` 상세(SeriesDetailLayout: 슬러그 세로 레일+히어로+row 카드 그리드) + `series.css`(--series-scale 패턴).
데이터는 기존 공개 API 조합(getCollection + getPostsWithSeries — N+1이지만 cachedPosts라 저비용).
[id]의 getStaticPaths는 최소 구현 + EDGE 주석(0포스트 시리즈 페이지 여부·시리즈 #N 결정 주체).
※ root MOCK_SERIES의 #2·#3 id는 아직 dead route — getSeriesCards() EDGE 완료 시 해소.

**시리즈 스케일 정합(2026-07-07, A+B 채택)**: `--series-scale` 1→**1.1**(root와 동일 축), `--card-scale` 1.05→**1.1**.
읽기 텍스트 3토큰(item-desc/item-meta/hero-desc)만 `max(12px, …)` 하한 — 장식성 모노(슬러그 8.8/tally/레일)는 제외,
모바일 블록 절대값 불변. 검증 16항목 통과(1440×900 + 모바일 390×844 회귀). D안(뷰포트 연동 clamp 스케일)은 기각이 아니라
**사이트 전체(root·posts·series 동시) 결정으로 보류** — decision 버킷 ⑱로 등재. knob 간접층 덕에 전환 비용은 값 교체 한 줄.
**전이 라벨**: 고정 스케일=캔버스 충실도 레짐, 뷰포트 스케일=디바이스 인체공학 레짐 — 레짐 경계는 페이지가 아니라
*컴포넌트 재사용 경계*를 따라야 크기 점프가 없다. 스케일(비례)과 가독 하한(floor)은 별개 축의 결정.

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

### 스크롤 게이트 디버깅 (2026-07-05 사이클)
- 원인 3개 수정: ① init에 사이드바용 `scroll-sentinel`이 넘겨져 상단 96px만 지나면 바닥 판정(+`!isIntersecting`=바닥 로직 자체도 반대) → `gate-sentinel`로 교체 + intersecting(경계)/isPast(지나침) 3구간 판별. ② `related-posts-top-sentinel`이 이름과 달리 섹션 맨 아래 렌더 → 센티널 삭제, gate-sentinel 하나로 복귀 감지 통합(rootMargin -48px 히스테리시스). ③ `gate-bob` keyframe이 `.gate-control`의 transform을 덮어써 `translateX(-50%)` 파괴 + JS `style.top` 트위닝과 CSS `bottom:48px` 충돌 → **위치는 fixed 고정, 도킹 전환은 `--gate-dock-y`(translateY) CSS transition만**, bob은 아이콘 레이어로 이동.
- **전이 라벨**: transform을 애니메이션 keyframe이 소유하면 같은 속성의 다른 목적(센터링/도킹)이 전부 소거된다 — transform 합성이 필요하면 레이어(래퍼)를 분리해 속성 소유자를 하나로.
- 인터랙션 확정: 흰색 chevron이 `--gate-progress`에 따라 progress 링으로 **모프**(Face ID/Toss 느낌). 상시 트랙 원 제거, arc(stroke-dashoffset)와 chevron(opacity+scale)이 순수 CSS calc 크로스페이드 — JS는 progress 값만 쓴다. tween 중 휠은 preventDefault(네이티브 스크롤과 tween 경합 차단).
- 검증: raw CDP 스크립트(scratchpad/gate-test.mjs, gate-click-test.mjs)로 진입/충전/스냅/자유복귀/클릭복귀 E2E 통과.
- ※ 아이콘 흰색 고정(#fff)은 사용자 지정 — 라이트 테마 배경에선 안 보일 수 있음(추후 토큰화 판단은 사용자).

**2차(같은 날, 사용자 방향 전환):**
- **사이드바(TOC) 스크롤 등장 폐지** → 로드 100ms 후 data-reveal="shown" 토글(전환 400ms, 0.5초 내 완료).
  `scrollRevealObserver.ts` 삭제, scroll-sentinel 제거. CSS 전환 메커니즘(data-reveal)은 그대로 재사용.
- **게이트 감지를 IO→scroll 산술로 교체**: 센티널이 flex-col에서 shrink되어 높이 0 + 경계 정확히에선
  서브픽셀(0.125px) 오차로 intersecting 실패 → `scrollTop >= boundary(= relatedPosts.offsetTop - clientHeight)`
  비교로 일원화. gate-sentinel div, IntersectionObserver, rootMargin 히스테리시스 전부 삭제.
- **경계 하드 클램프**: 게이트 통과 전(hidden/ready/charging) scroll 이벤트에서 하향 통과 차단
  (lastScrollTop으로 방향 판별 — 관련 포스트에서 위로 빠져나올 땐 통과). IO 비동기 판정 전에
  휠 관성·키보드·스크롤바로 섹션이 살짝 노출되던 문제의 근본 해결.
- **전이 라벨**: 픽셀 경계의 정확한 판정이 필요하면 IO(비동기·서브픽셀 취약)보다 scroll 이벤트 + 산술 비교.
  IO는 "대략 이 근처 진입" 감지에 적합. 또한 flex 컨테이너 안의 고정 크기 센티널은 `shrink-0` 필수.
- **RelatedPosts 리팩토링**: BACK TO POSTS 제거, 수제 category-chip → `Tags` 컴포넌트 재사용,
  섹션 `min-height: calc(100dvh - var(--header-h))` + flex 세로 센터링(페이지 섹션처럼 풀뷰포트).
- 검증: scratchpad/gate-test-v2.mjs — 로드 등장/클램프(프로그램·휠 오버슛)/충전 스냅/클릭·자유 복귀/구조 10항목 전부 통과.

**3차(같은 날): 게이트 양방향 대칭 + 각주 토글 + 관련 포스트 스타일 정합**
- **복귀도 충전식(대칭)**: arrived에서 위 휠 = `charging-back`(임계 180 — 진입 600보다 훨씬 가볍게,
  tau=임계/4로 링 그려지는 감각 동일). 섹션 상단도 상향 클램프. 자유 스크롤 복귀(free-scroll return) 폐지.
  단, **큰 상향 점프(≥ clientHeight/2 — TOC 링크·PageUp)는 게이트 해제하고 통과**(클램프가 내비게이션을 막으면 안 됨).
  chevron-up도 progress에 따라 링으로 모프 + arrived에서 bob (ready와 대칭).
- 게이트 아이콘/링 색 `#fff` → `--color-text-primary` 토큰(라이트/다크 추종).
- **각주 토글**: `rehypeFootnotesToggle` 플러그인(신규, astro.config 등록 — config 변경은 dev 재시작 필요).
  GFM section.footnotes → details/summary 변환, summary = arrow_left 인라인 svg(currentColor) + "각주" + (n).
  기본 닫힘, 본문 각주 참조 클릭 시 자동 열림(ArticleLayout 스크립트). CSS ::before "각주" 라벨 제거.
  닫힘 = 180°(▸), 열림 = -90°(▾) 회전. 각주 접힘→본문 높이 변화는 경계 동적 재계산이라 게이트 무영향(검증됨).
- 관련 포스트: 타이틀/설명 = `--size-article-root-heading`/`--size-article-content` + `--color-article-title`
  (clamp라 모바일 픽셀 override 삭제), 배경 = `--color-bg-pure`(elevated), 콘텐츠 상단 정렬(padding-top 100px
  = 도킹 24 + 컨트롤 60 + 여백 16 — 게이트 컨트롤 픽셀 지오메트리와 결합, 센터링 제거).
- 검증: gate-test-v3.mjs(대칭 게이트 7항목) + footnote-test.mjs(토글 7항목) 전부 통과.

**4차(같은 날): 디테일 튜닝 + giscus 스캐폴딩**
- 각주 (n): weight 700 + margin-left -4px(gap 8px 대비 타이트). 화살표 닫힘 ▾(270°)→열림 ▴(450°) = 시계방향 180°(아코디언 관례).
- **`--color-bg-elevated` semantic 토큰 신설**(L: gray-75 / D: gray-925 — 페이지 bg와 50단위 한 스텝 차이, hero와 같은 값).
  관련 포스트 배경이 bg-pure(900, 차이 과함)에서 이걸로 교체.
- **관련 포스트 "글자 깨짐" 원인**: 카드 타이포 규칙(.post-title 등)이 `.post-grid-text-package` 조상 스코프 안에 있는데
  RelatedPosts에 래퍼 클래스가 없어 weight 400으로 풀림 → inner에 클래스 추가로 해소.
  **전이 라벨**: 컴포넌트를 새 컨텍스트에 이식할 땐 컴포넌트 자신뿐 아니라 *조상 스코프 클래스 계약*까지 함께 옮겨야 한다.
- 섹션 타이틀/설명 = `--size-post-grid-title`(≈25.7px)/`--size-post-description`(≈14.7px) — article prose 토큰(30px)은 과했고
  post-grid 헤더 레시피(.grid-title과 동일)로 정합.
- **giscus 댓글 스캐폴딩**(`Giscus.astro`, 각주 아래): repo `Twince/twince.blog`, repo-id `R_kgDOQk2RFQ`(조회 완료).
  **Discussions 미활성 상태라 CATEGORY_ID 비어 있음 → 컴포넌트가 렌더링 가드 중.** 활성화 절차는 컴포넌트 주석 참고
  (Discussions 켜기 → giscus 앱 설치 → giscus.app에서 category-id 발급 → 상수 채우기). 테마 토글 동기화(postMessage) 구현됨.
- 검증: round4-test.mjs 8항목 전부 통과.

**5·6차(같은 날): 각주-게이트 동작 분리 + 제스처 튕김 + 디테일**
- related 타이틀↔설명 gap 4px. 카드 tag↔title 벌어짐 재발 원인: 헤더 칩용 `.related-posts-inner :global(.tags-wrapper)`
  후손 셀렉터가 카드 내부까지 매칭 → **자식 결합자(>)로 한정**(스코프 누수 — 4차 '스코프 계약' 버그의 쌍대).
- **각주 토글 ↔ 게이트 분리**: 토글 open 시 wrapper.scrollBy(+160, smooth) 자동 스크롤. 간섭 분석 결과 3개 처리 —
  ① 토글은 스크롤 없이 경계를 옮김(특히 close 때 관련 포스트 걸침) → `ScrollGateObserver.sync()` 공개 메서드 신설,
  토글 핸들러가 1회 호출(게이트와의 결합은 이 한 줄뿐). ② 스냅 tween 중 높이 변동 → tween 목표를 프레임마다 재계산.
  ③ ref 클릭 자동 열림은 앵커 점프가 스크롤 담당 → auto-scroll 억제 플래그. 자동 스크롤 자체는 프로그램 스크롤이라
  충전(raw는 wheel/touch에서만 누적)과 원천 분리, 경계 초과는 기존 하드 클램프가 단일 방어선.
- 각주 화살표: 닫힘 ▸(180°, 옆) → 열림 ▾(270°) — 시계방향 90°.
- **제스처 튕김(chargeBlocked)**: 경계 도달을 만든 제스처의 잔여 관성은 충전 금지 — 클램프/도달 시 잠금,
  입력이 `GESTURE_GAP`(200ms) 이상 끊겨야 새 제스처로 인정해 해제. 복귀 방향(섹션 top 도달)도 대칭.
  "DOM이 더 없는 것처럼" 한 번 정지 후, 의도된 새 스크롤부터 충전.
- 게이트 링: 반지름 24→21.6(-10%), 색 `--color-brand-primary`(오렌지). 아이콘은 text-primary 유지.
- 검증: round5(8항목)·round6(튕김/링 6항목)·v3 회귀 전부 통과.

**7차(같은 날): 스크롤 성능 + neighbor 라벨 인터랙션**
- **스크롤 버벅임 해소**: wheel/touchmove의 non-passive 리스너가 상시 부착돼 컴포지터(스레드) 스크롤을 죽이던 것
  → `updateInputBlocking()`이 **경계 구간(isAtBottom)에서만 동적으로 부착/해제**. 본문 구간은 리스너 0개.
  **전이 라벨**: preventDefault가 필요한 이벤트 리스너는 "필요한 구간에서만 존재"하게 설계 — non-passive의 비용은
  핸들러 실행이 아니라 *리스너의 존재 자체*(브라우저가 매 이벤트 JS 응답을 대기).
- **헤더 위 휠 무반응**: 스크롤 컨테이너가 #article-wrapper라 형제인 헤더 위 휠은 아무것도 스크롤 안 함
  → 헤더 wheel(passive)을 wrapper.scrollBy로 포워딩. 프로그램 스크롤이라 충전과 무관, 클램프가 방어.
- **related 카드 hover 히트박스**: ul에 grid 유틸이 없어 li가 블록 전체 폭 → PostGridLayout col variant와 동일한
  grid 유틸 복사(justify-items-center 포함, li 폭=카드 폭). ※ PostGridLayout 직접 재사용은 내부 fetch 구조라 불가
  — 커스텀 리스트 주입은 CLAUDE.md 기존 EDGE(limit prop vs 래퍼) 결정에 묶임.
- related 타이틀↔설명 gap 2px. neighbor desc max-w 33ch→26ch(여백 확보).
- **neighbor hover 라벨**: '이전 글/다음 글'(quaternary, neighbor-desc 폰트)이 아이콘↔제목 사이 등장.
  라벨 width 0→40px 확장이 제목을 40px 밀고, 화살표는 transform으로 반대 20px(제목의 1/2). 라벨 translateX는 중앙 보정.
  prev 아이템은 desc를 텍스트 컬럼 안으로 재구조화(제목과 함께 이동).
- 발견(백로그): 이웃 없는 포스트의 neighbor 링크가 href="undefined" dead link(기존). wrapper에 정체불명 non-passive
  scroll 리스너 1개 존재(headingObserver 추정 — scroll은 cancelable 아니라 성능 무해).
- 검증: round7-test.mjs 10항목 전부 통과.

**8·9차(같은 날): neighbor 오버플로 수정 + 이웃 없음 폴백**
- **긴 title/desc에 화살표·라벨 소실 원인**: 7차에 desc를 flex row 안 컬럼으로 옮기면서 flex 아이템의
  `min-width: auto`(min-content 이하로 안 줄어듦)가 발동 — truncate(nowrap) 제목·break-keep desc의 min-content가
  row를 넘치게 해 화살표는 클리핑, 라벨은 shrink로 짜부. → 텍스트 컬럼 `min-w-0`, 화살표·라벨 `shrink-0`.
  **전이 라벨**: flex 안에서 truncate/nowrap이 "안 먹는" 문제의 9할은 min-width:auto — 줄어들 아이템에 min-w-0,
  보호할 아이템에 shrink-0을 명시해 "누가 줄어드는가"를 계약으로 박아라.
- 라벨 y = 화살표 y 정렬(align-self:flex-start + mt 6px + h 20px — self-stretch 세로 중앙에서 변경).
- **이웃 없음 폴백**(10차 재조정): href=/posts, **정적 레이아웃** — hover 라벨/이동 인터랙션 없음(-next/-prev 클래스 미부여),
  아이콘(root series-count 목록 svg, currentColor) 왼쪽 고정, "목록보기" 타이틀 아래 "다음/이전 글이 없어요"가 desc 자리(1줄),
  칸 높이 축소(py-4/py-3, 2줄 고정 존 미적용). 기존 href="undefined" 해소. next/previous 각각 삼항으로 정상/폴백 분기.
- **desc 클램프 + 조건부 예약**(11·12차 확정): 상한은 항상 -webkit-line-clamp:2. 하한(min-height 2줄)은
  `hasBoth`(양쪽 이웃 존재)일 때만 컴포넌트가 `neighbor-desc-reserved`를 붙임 — 정상-정상은 두 칸 높이 **동일**
  (prev 패딩도 next와 같은 pt-6 pb-5로 통일, 검증 111px==111px), 폴백 혼합은 예약 없이 컴팩트(유령 빈 줄 방지).
  **전이 라벨**: '상한 클램프'와 '하한 예약'은 별개 결정. 예약은 인접 여백 비용을 치르므로 *정렬이 필요한 컨텍스트에서만*
  켠다 — 존재 여부를 렌더 시점에 아는 SSR에선 조건부 클래스가 가장 싼 스위치.
  ※ Astro 삼항 분기 괄호 안에 JSX 주석+요소 병치 금지(단일 표현식 깨짐 — "Expected ) but found $$render"로 실제 밟음).
- 검증: round8(긴 텍스트 4항목)·round9(폴백·고정존 4항목) 전부 통과.

**10~13차(2026-07-06): 리뷰 반영 + 마감 (커밋 직전 상태)**
- Opus 워크플로 리뷰 8건 반영: ① getPostWithTags 대소문자 비대칭(tagSet만 대문자) → 양쪽 정규화.
  ② 터치 충전이 누적 오프셋을 매 이벤트 재합산(제곱 폭증) → 직전 이벤트와의 증분만(touchPrevY).
  ③ wheel deltaMode 미정규화(Firefox LINE≈3/노치) → normalizeWheelDelta(LINE×16/PAGE×clientH), 헤더 포워딩도.
  ④⑤ 키보드/스크롤바 게이트 통과 불가(a11y) → 하향에도 뷰포트 절반 이상 점프는 게이트 해제 통과 + 게이트 버튼이
  ready에서 triggerRelease(양방향 클릭/Enter 경로). ⑥ neighbor href 상대경로(프로덕션 trailing slash 404) → /posts/ 절대.
  ⑦ 리사이즈 시 경계/상태 미갱신 → resize에서 onScroll() 재판정. ⑧ 각주 해시 직접 진입 시 닫힌 토글 → 로드 시 자동 열림.
- 폴백 재조정(10차): 정적 레이아웃(hover 인터랙션·라벨 없음), 아이콘 왼쪽 고정, "~ 글이 없어요"는 desc 자리, 높이 축소.
- **관성 튕김 개선(13차)**: GESTURE_GAP 200→120ms + **델타 스파이크 언블록**(관성은 단조 감쇠 → 델타 급증 = 새 제스처,
  ≥15px && >직전×1.5). "직후 재스크롤"이 대기 없이 즉시 충전되면서도 한 제스처는 여전히 안 넘어감.
- 게이트 컨트롤 **x = 본문 컬럼 중앙**(뷰포트 중앙 아님 — updateControlX, 사이드바 reveal transform 종료 후 재측정 700ms).
  본문 하단 pb-32(128px) 전용 공간 — 컨트롤이 글과 안 겹침. top 도킹 여백 24→12px(섹션 padding-top 88px 연동).
- 각주 접힘/펼침 높이 애니메이션: `::details-content` + `interpolate-size`(Chrome 131+, 미지원은 즉시 전환 폴백).
- ~~인플로우 컨트롤 리팩토링 미착수~~ → **14차(refactor/architecture)에서 완료**: `.gate-control`을
  fixed → **in-flow(relative)** 전환. x는 `margin: auto`(레이아웃), 도킹은 `--gate-y: 120px`(48+60+12,
  뷰포트 무관 상수 — CSS 상태 셀렉터가 결정). setDock/updateControlX/700ms 재측정 등 JS 지오메트리 전부 삭제.
  각주 토글로 콘텐츠 높이가 변해도 컨트롤이 콘텐츠와 함께 움직여 위치 버그 클래스 소멸.
  각주는 기본 열림(rehype open:true), 각주↔컨트롤 여백 84→28px(footnotes pb 1rem + 컨트롤 mt 12 + 마지막 p 마진 0).
  **발견 버그**: 각주 닫힘의 ::details-content 높이 transition(250ms)이 toggle 시점의 sync()보다 늦게 끝나
  재클램프를 놓침 → transitionend + 300ms 백업 sync 추가(멱등). 검증: in-flow 8케이스 + 최종 스팟 2건 전부 통과.
  **전이 라벨**: 콘텐츠에 종속된 UI는 fixed(뷰포트 좌표)가 아니라 in-flow(콘텐츠 좌표)에 두면 콘텐츠 변형에
  공짜로 추종한다 — fixed가 필요한 건 '콘텐츠와 무관하게 화면에 붙어야 하는 것'뿐.
- 검증: round13 10항목 전부 통과. ※ 합성 휠 테스트는 이벤트 간격을 실제 관성(~10ms)에 맞춰야 GESTURE_GAP 오탐 없음.

### 아키텍처 감사 사이클 (2026-07-06, branch refactor/architecture)
5개 관점(아키텍처/보안/TS/CSS·a11y/성능) 멀티에이전트 감사 → safe 22건 리팩토링 적용 완료(**tsc 17건→0건**):
- 죽은 코드 삭제 7파일(types/post.ts, useActiveHeadingObserver, imgFigurelizer, readingStatusObserver, MinimumPost, styles/global.css, createHaadingObserver 스텁) + 미사용 import 5곳.
- 카드 <Image> widths/sizes(2.2MB 원본→srcset 3변형), 폰트 dynamic-subset + head preconnect/link(직렬 @import 체인 제거).
- TocWrapper 죽은 render() 삭제(포스트당 마크다운 2중 컴파일 해소) + client:idle, Toc onChange 동일 activeId early-return.
- config.ts toc 스키마 z.array 교정, resolver Astro5 잔재(.slug/.render) 제거, coAuthor→coAuthors, sorter import 경로.
- a11y: gate 버튼 :focus-visible + 상태별 aria-label, TwistedGridMotion reduced-motion pauseAnimations, 각주 없는 img alt="".
- 토큰: raw hex(#7b818d/#333)→primitive(slate-500/gray-850)+semantic(code-linenum/badge-lang), text-gray-800→text-text-secondary,
  u-rail :is() 통합, --u-hover-ring 단일 출처(index.css), localStorage theme 화이트리스트, index.css 레거시 @tailwind 3줄 제거.
**decision 17건(사용자 결정 대기)** — ① **✅해결(2026-07-14 커밋 160bf36)**: sorter comparator 반전(실버그 — '최신순'이 제목순으로 동작 중.
힌트: 조기 반환 조건이 반대 — timeDiff==0일 때 0을 반환하면 tiebreak이 죽고, 날짜가 다를 때 title 비교가 실행된다.
comparator는 '다르면 즉시 결정, 같으면 폴스루'가 골격). ② Toc.tsx 정비(li onClick→a href, null 규약, 폴링→IO 구독).
③ TOC 이중 생성 파이프라인 일원화. ④ tocGenerator/markdownToHast를 plugins로 이동(레이어명 정합). ⑤ getPostDetail 서비스 계약.
⑥ series 스키마 optional 위치 — 현재 `z.array(reference('series').optional())`라 **원소별** undefined(`(Reference|undefined)[]`)라서
소비처가 원소 `?.` 가드 필요. 의도는 필드 전체 optional일 확률 높음 → `z.array(reference('series')).optional()`로 옮기면 원소 non-null.
파급(getPostsWithSeries·ResolvedPost·seriesServicer 가드)이라 보류; seriesServicer의 getSeriesCount는 `if(!ref)return` 가드로 진행(스키마 어느 쪽이든 안전). ⑦ thumbnail 폴백/유령 null. ⑧ BaseLayout title prop(전 페이지 고정 <title> — WCAG 2.4.2).
⑨⑩ 기존 EDGE(getSeriesCards/limit/칩 라우팅). ⑪ gate DOM 계약·reset()·핫패스 캐시. ⑫ 의존성 취약점 36건+CSP.
⑬ .card-tag 분리+!important 해체. ⑭ quaternary 라이트 대비 3.0:1. ⑮ no-scrollbar. ⑯ SMIL 외부화. ⑰ nnv-4 중복 에셋.
⑱ 뷰포트 연동 스케일(D안) — 큰 모니터에서 1100px 고정 컬럼 전체가 작게 읽히는 문제. 사이트 전체(root·posts·series)
동시 결정 필요: clamp 곡선(하한은 노트북 구간이라 floor 병행 필수)·컬럼 축 스케일 여부(헤더·root 세로 보더 정렬 트레이드오프).
스킵(리스크): tailwind 임포트 단일화(캐스케이드), 오타 rename(TocGenrator/isVisable/sortBylastest — decision과 함께 권장).

### 게이트 바운스 최종 해결 (branch UI/root, 2026-07-08~09 — main의 in-flow 14차와 병렬 트랙)
> 정합 주의: 아래 14~16차는 UI/root 브랜치에서 **fixed 포지션 게이트 위에** 진행됐다(main의 "14차 = in-flow 전환"과 독립 트랙).
> 이번 머지(2026-07-10)는 그 최종 결론(16차 = 단방향 수납 게이트)만 **main의 in-flow 컨트롤 위에 포팅**했다 —
> 14·15차의 fixed 기반 사후교정(forceClampTo)·접근-인터셉트(PRE_BOUNDARY_MARGIN) 코드는 채택하지 않고,
> 16차의 '관련 포스트 수납 → 네이티브 클램프' 구조만 in-flow 컨트롤과 결합했다. 14·15차는 역사적 맥락으로 보존.

**14차(2026-07-08): 마우스 휠 경계 튕김 제거 — 경계 '접근'부터 인터셉트**
- **증상**: 물리 마우스 휠로 바닥 게이트 경계에 닿는 순간 페이지가 한 번에 안 멈추고 눈에 띄게 튕김/떨림(트랙패드는 거의 없음).
- **원인**: Chrome은 이산(discrete) 휠 입력을 컴포지터 스레드에서 스무스 스크롤로 애니메이션한다 — 노치 1회 = 즉시 점프가
  아니라 ~100+px를 여러 프레임에 걸쳐 보간. 그런데 게이트의 non-passive `wheel` 리스너는 `isAtBottom`(top ≥ boundary-ε)이
  **이미 true가 된 뒤**에야 부착됐다(`updateInputBlocking`) — 즉 경계를 처음 넘는 그 노치는 전부 네이티브라 무방비.
  passive `scroll`이 넘침을 보고하면 `onScroll`이 `scrollTop = boundary`로 클램프하지만, *같은 제스처의 진행 중인
  컴포지터 애니메이션이 다음 프레임에 다시 scrollTop을 덮어써* 클램프↔애니메이션이 수백 ms 싸운다. 이미 넘고 나서
  scroll 이벤트로 고치는 건 원천적으로 늦다.
- **수정**: 경계를 넘기 *전에* 인수한다. `PRE_BOUNDARY_MARGIN`(160px — 단일 애니메이션 노치 스텝 ~100px보다 넉넉히 큼) 신설.
  ① `updateInputBlocking`: 부착 조건을 `isAtBottom` → `top ≥ boundary-MARGIN`(하단 접근) **OR** `top ≤ relTop+MARGIN`(상단 복귀 접근)로
  확장(boundary·relTop을 fresh 계산). ② `onWheel`: 접근 구간(state hidden/ready/charging, `top < boundary`, `top ≥ boundary-MARGIN`,
  delta>0)에서 `preventDefault()` + `scrollRoot.scrollTop = Math.min(top+delta, boundary)`로 **무보간 활공** — 충전 없음(충전은
  기존 경계-도달 브랜치가 담당). 상단 복귀(arrived/charging-back, delta<0)도 대칭 브랜치. `top`은 반드시 실측(이 브랜치가
  onScroll보다 앞서 실행되므로 모듈 캐시 stale). ③ 터치는 그대로 — 직접 조작 델타라 싸울 컴포지터 애니메이션이 없음.
- **전이 라벨**: 브라우저가 애니메이션하는 입력(휠 스무스 스크롤)은 결과 scroll 이벤트에서 사후 클램프로 못 고친다 —
  경계를 넘기 전 *접근 마진 구간*에서 입력을 가로채 직접 처리(preventDefault + 동기 대입)해야 애니메이션 자체가 시작되지 않는다.
  "이미 일어난 애니메이션을 되돌리기 vs 애니메이션을 시작조차 못하게 선점"의 차이.
- 검증: scratchpad/gate-test-r14.mjs — 접근 마진에 주차 후 감쇠 휠 버스트(~15ms 간격, 누적 245px)로 경계 접근,
  scrollTop이 boundary 초과 0.00px·단조 수렴·게이트 활성(charging) 7항목 전부 통과. ※ CDP는 컴포지터 애니메이션을
  재현 못하므로(태스크 명시) 증상 대신 인터셉트 메커니즘의 정상 수렴을 양성 검증.

**15차(2026-07-09): "한번에 내렸을 때"도 튕김 — 마진의 구조적 한계 + 사후 교정 강화**
- **증상(사용자 재보고)**: 14차 이후에도 "스크롤을 한번에 내렸을 때"(강한 플릭 1회) 여전히 경계에서 튕김.
- **14차가 못 막는 이유**: `PRE_BOUNDARY_MARGIN` 접근-인터셉트는 "**다음** wheel 이벤트가 마진 안에서 잡혀야" 작동한다.
  그런데 강한 플릭 1회의 네이티브 스무스 스크롤 애니메이션은 **이미 시작된 뒤엔 그 wheel 이벤트가 하나뿐**이다
  (컴포지터가 자체 타이밍으로 여러 프레임에 걸쳐 진행 — 프레임마다 새 wheel 이벤트가 재발생하는 게 아니다).
  즉 `preventDefault()`는 "새 애니메이션이 시작되는 것"만 막지, "이미 시작된 애니메이션"은 절대 못 멈춘다 — 마진을
  아무리 넓혀도 단일 노치의 총 이동거리가 마진을 넘으면 구조적으로 뚫린다. 사후 교정(`onScroll`의 클램프)만이
  유일한 마지막 방어선인데, 기존 코드는 **단발 대입**(`scrollTop = boundary` 한 번)이라 컴포지터가 다음 프레임에
  또 덮어쓰면 그걸로 끝 — 재주장하지 않는다.
- **수정**: `forceClampTo(scrollRoot, target)` 신설(사후 클램프의 단일 진실 소스, 기존 두 클램프 지점 교체) —
  ① `killNativeScrollAnimation`: 같은 tick 안에서 `overflow-y: hidden` → 강제 reflow(`offsetHeight`) → 원복.
  스크롤 불가 박스로 한 순간 전환했다 복귀시키면 그 컨테이너의 활성 스크롤 애니메이션 상태 자체가 버려진다
  (취소 API가 없는 것에 대한 실전 우회책). ② 즉시 `scrollTop = target` 대입. ③ 이후 `CORRECTION_HOLD_MS`(300ms)
  동안 자체 `requestAnimationFrame` 루프로 **매 프레임 재주장** — 'scroll' 이벤트 도달 여부와 무관하게 매 프레임
  직접 `scrollTop`을 확인/재대입하므로, 브라우저가 성능상 'scroll' 이벤트 디스패치를 스로틀/코얼레싱해도(패시브
  리스너 특유의 최적화) 놓치지 않는다. `cancelCorrection()`을 실제 wheel/touch 입력, `triggerRelease`/`triggerSnappingBack`
  진입부에 배치해 정당한 입력·의도된 tween이 재개되면 즉시 양보(서로 안 싸움). 겸사겸사 `PRE_BOUNDARY_MARGIN` 160→260
  (강한 플릭의 단일 스텝을 더 여유 있게 커버 — 그래도 이 마진만으론 근본 해결이 안 되므로 사후 교정이 핵심).
- **전이 라벨**: `preventDefault`는 "입력이 새 기본 동작을 시작하는 것"만 막을 수 있다 — 그 입력이 이미 트리거한
  브라우저 자체 애니메이션(비동기·다중 프레임)은 그걸로 못 멈춘다. 이미 진행 중인 것을 멈추려면 ① 애니메이션
  상태 자체를 깨뜨리는 우회책(여기선 overflow 토글)과 ② 결과에 매 프레임 재주장하는 루프, 두 가지가 다 필요하다 —
  이벤트 하나 잡아서 막는 것과 진행 중인 프로세스를 끊는 것은 다른 문제.
- **테스트 한계(정직하게 기록)**: 이 환경의 헤드리스/헤디드 Chrome(150.0.7871.101)에서 CDP `Input.dispatchMouseEvent
  (type: mouseWheel)`는 deltaY를 **원자적으로**(멀티프레임 애니메이션 없이) 적용한다 — `--enable-smooth-scrolling`,
  헤드리스 유무와 무관. 즉 실제 버그(물리 마우스·macOS 컴포지터 휠 스무스 스크롤 — 트랙패드는 재현 안 됨과 정합)를
  CDP로 **문자 그대로 재현할 방법이 없었다**. End 키는 CDP로 진짜 멀티프레임 네이티브 애니메이션을 재현했지만
  (3183→3200→3271→3332→3471→3557→3583, 7프레임) 14차 이전 코드로도 이미 깨끗이 수렴 — 이 특정 애니메이터는
  외부 scrollTop 대입에 이미 반응해 취소되는 것으로 보임(휠 전용 macOS 애니메이터는 다를 수 있음, 확인 불가).
  page-side JS로 만든 "경쟁 작성자" 어드버서리 테스트(gate-adversary-test.mjs/-worstcase.mjs)로 대신 검증:
  최선/최악 콜백 순서 모두에서 부착 전·후 코드가 동일하게 수렴(고착 없음)함을 확인했으나, JS 대입 자체가 항상
  'scroll' 이벤트를 동기 발생시키므로 "컴포지터가 scroll 이벤트를 스킵하는 실제 프레임"은 페이지 측 스크립트로
  근본적으로 흉내 낼 수 없었다(그 스로틀링은 진짜 컴포지터 스크롤에만 적용되는 브라우저 내부 최적화). 이 fix가
  방어하는 정확한 시나리오는 CDP/page-JS 양쪽 다로는 확정 재현이 불가능하고, 실제 물리 마우스가 있는 기기에서의
  육안 확인이 유일한 최종 검증 경로 — 사용자 재확인 필요.
- 검증: gate-test-r14.mjs(회귀, 7항목 통과) + gate-repro-burst.mjs(모더레이트 노치 2세트, 회귀 없음) + gate-repro.mjs
  end/wheel/scrollbar 모드(End 키 실애니메이션 클린, 단일 강한 플릭 클린, scrollbar 즉시점프는 큰-점프 바이패스로
  의도대로 게이트 해제 통과) + gate-adversary-test.mjs·-worstcase.mjs(합성 경쟁 작성자, 양쪽 콜백 순서 모두 최종
  boundary 수렴·고착 없음) 전부 통과. 회귀 없음(charge/charging-back·chargeBlocked 제스처 튕김·PageDown/End 큰 점프
  바이패스·release/snap tween 모두 재확인).

**16차(2026-07-09): 바운스 근본 해결 — 컴포지터와 싸우지 말고, 싸울 콘텐츠 자체를 없앤다 + 단방향 전환**
- **결정 배경**: 14·15차의 접근-인터셉트(PRE_BOUNDARY_MARGIN)·사후 교정(forceClampTo/killNativeScrollAnimation/
  매프레임 재주장)은 전부 "이미 시작된 네이티브 스무스 스크롤을 사후에 되돌린다"는 싸움이었고, preventDefault로
  못 멈추는 특성상 CDP로 재현·확정 검증조차 불가능했다(15차 말미 기록). 방향을 바꿨다.
- **구조적 해결**: 관련 포스트 섹션(`#related-posts`)을 게이트 통과 전까지 `data-collapsed`로 **height 0 수납**한다
  (RelatedPosts.astro `.related-posts[data-collapsed]`: min/height 0·상하 padding 0·border 0·overflow hidden).
  그러면 스크롤 컨테이너의 `scrollHeight - clientHeight == boundary` — 경계 아래로 스크롤할 콘텐츠가 없어져
  **아래로의 오버스크롤을 브라우저 네이티브 클램프가 막는다**. 컴포지터 애니메이션이 넘어갈 대상 자체가 없으니
  바운스가 *구조적으로 불가능*(사후 교정이 아니라 원천 차단). `#article-wrapper` overscroll-behavior-y도
  `contain`→`none`(macOS 러버밴드 억제).
- **전이 라벨**: 브라우저가 소유한 애니메이션(휠 스무스 스크롤)과 JS가 매 프레임 싸우는 구조가 나오면, 이기려 하지 말고
  *싸움의 대상(경계 너머 스크롤 가능 영역)을 레이아웃에서 제거*하라. 그러면 네이티브 불변식(스크롤은 콘텐츠 끝을 못 넘음)이
  공짜로 경계를 지킨다. "플랫폼과 싸우기 vs 플랫폼의 불변식을 이용하기."
- **단방향 게이트로 전환**(사용자 결정): 위로(관련 포스트→본문) 복귀는 자유 스크롤 — 클램프가 없으니 위쪽 바운스도 없다.
  경계 위로(`top < boundary - RECOLLAPSE_MARGIN`, 이 시점 관련 포스트는 뷰포트 아래로 벗어나 재수납이 안 보임)
  올라오면 관련 포스트를 재수납해 게이트 재장전. `charging-back`·`snapping-back` 상태머신, 대칭 링(chevron-up) 전부 삭제.
- **충전 입력은 전부 passive**: 바닥에서 네이티브 클램프가 이미 이동을 막으므로 preventDefault가 불필요 → wheel/touchmove를
  상시 passive로 붙여 델타만 읽어 충전(상시 passive는 컴포지터 스크롤을 안 죽인다 — 죽이던 건 non-passive였음).
  동적 리스너 부착/해제(updateInputBlocking)도 소멸. 도킹(`--gate-dock-y`/setDock)도 제거 — 컨트롤은 ready/charging에서만
  bottom에 페이드 인, 통과 후 페이드 아웃.
- **삭제된 것**: forceClampTo·killNativeScrollAnimation·correction RAF 루프·PRE_BOUNDARY_MARGIN·updateInputBlocking·
  non-passive 리스너·charging-back/snapping-back·대칭 링·도킹. 옵서버 순 −87줄, 15차까지의 복잡도 대부분 소멸.
- **키보드 접근성**: End/PageDown 큰-점프 바이패스는 없어졌지만(더는 필요 없음 — 넘어갈 콘텐츠가 없으니 바닥에서 ready로 정지),
  게이트 통과는 포커스 가능한 `.gate-button`(Enter/클릭)이 담당 → a11y 유지.
- **검증**: scratchpad/cdp.mjs (raw CDP, 데스크탑 1440×900) 18항목 전부 통과 — 수납 상태 maxScroll==boundary·
  scrollTop=999999 대입 시 boundary로 네이티브 클램프(초과 0px)·서브임계 충전 중 scrollTop 고정+링 충전·
  완충 release→전개+arrived 정렬·위로 복귀 시 재수납+재장전·재사이클·클릭 통과. arrived 스크린샷 레이아웃 정상.
  ※ 이 fix는 CDP로 *양성 검증 가능*하다(14·15차와 달리 컴포지터 애니메이션 재현이 필요 없음 — 네이티브 클램프는
  scrollTop 대입만으로 확인됨). 그래도 물리 마우스 육안 확인 권장.

**머지 사이클(2026-07-10): 단방향 수납 게이트(UI/root)를 main의 in-flow 컨트롤 위에 포팅 (Merge UI/root → main)**
- **의미 기반 병합** — 두 브랜치가 게이트를 독립 진화시켜 `git merge`가 6파일 충돌. 파일별 채택:
  - `scrollGateObserver.ts` = **UI/root(단방향 수납)** 채택. 단 `updateControlX()`/`getControl()`과 모든 호출부
    (init 즉시·700ms 재측정·resize) 삭제 — main은 컨트롤이 in-flow라 JS x-지오메트리가 불필요(CSS `margin:auto`가 소유).
    UI/root 핵심(setRelatedCollapsed 수납 / hidden→ready↔charging→snapping-forward→arrived 단방향 / 상시 passive /
    chargeBlocked / normalizeWheelDelta / sync() / release 목표 프레임별 재계산)은 보존.
  - `ScrollGateControl.astro` = **하이브리드**: 포지셔닝은 main(in-flow relative + `margin:12px auto 48px` + flex-shrink),
    가시성·마크업·모프는 UI/root(단방향 — ready/charging에서만 opacity, chevron-down만, 도킹/--gate-y/charging-back 전부 삭제).
    main의 `.gate-button:focus-visible`·reduced-motion 유지. 버튼 aria-label="관련 포스트로 이동"(정적, 단방향).
  - `RelatedPosts.astro` = UI/root의 `[data-collapsed]` 수납 블록. padding 88px 주석은 in-flow 기준으로 현행화.
  - `article.css`·`series.css` = **main 유지**(토큰·읽기 12px floor·u-hover-ring 등 UI/root 이후의 최신 결정) — 게이트 주석의 '도킹' 문구만 제거.
  - `ArticleLayout.astro` = main 유지(Props 인터페이스·각주 transitionend+300ms 백업 sync·헤더 휠 포워딩). 단 `overscrollBehaviorY: 'none'`만 UI/root에서 취함(macOS 러버밴드 억제). pb-32는 추가 안 함(in-flow 컨트롤 마진이 그 공간 소유).
- **전이 라벨**: 두 브랜치가 같은 기능을 독립 진화시켰을 때의 머지는 '텍스트 충돌 해소'가 아니라 '어느 쪽 구조가 이겼는지'를
  먼저 정하고(여기선 UI/root의 수납-클램프), 그 위에 다른 쪽의 직교한 개선(in-flow 컨트롤·최신 토큰)을 재적용하는 것 — 축이 다른 결정은 서로 포팅 가능하다.

**게이트 전수 스윕 사이클(2026-07-10, HEAD df4c2bd): 잔존 버그 0, 관찰 2건 중 1건 수정**
- 머지 후 단방향 수납 게이트를 11항목 전수 점검 — **잔존 버그 0**. 관찰 2건:
  ① (수정 완료) snap tween(350ms) 구간 네이티브 스크롤 가드. df4c2bd의 리스너는 전부 passive라, tween의 animate
  루프가 프레임마다 scrollTop을 절대 재대입하는 동안 사용자 휠/터치가 프레임 사이에 끼어들면 실기기에서 미세 지터가
  생길 수 있었다(상태 무결성은 무관 — 순수 시각 품질). → `triggerRelease()`의 tween 시작 직전(reduced-motion 즉시
  경로 제외)에 `attachTweenGuard()`로 wheel·touchmove를 **non-passive**로 부착(핸들러는 preventDefault만), `finish()`와
  `disconnect()`에서 해제. 7차 전이 라벨("preventDefault 리스너는 필요한 구간에서만 존재") 그대로 — 상시가 아니라
  350ms 한정. 기존 passive 충전 리스너는 releaseRafId 체크로 이미 tween 중 조기 반환이라 무간섭.
  ② (백로그) giscus 활성화 시 iframe 높이 변화가 경계를 옮김 — container ResizeObserver → `ScrollGateObserver.sync()`
  와이어링 필요(각주 토글과 동일 패턴).
- **7차 미스터리 확정**: 그때 기록한 "wrapper의 정체불명 non-passive scroll 리스너"는 `Toc.tsx:48`의 scroll 리스너로 확정.
  scroll 이벤트는 cancelable이 아니라 non-passive여도 성능 무해 — 실질 무해, 조치 불필요.
- 검증: guard-test.mjs 10항목(tween 중 wheel defaultPrevented=true / 종료 후 해제·네이티브 스크롤 복원 / tween 중
  대량 휠에도 arrived@relTop 무결성 유지 / 모바일 390×844 터치 충전→snap 정상 = 가드가 터치 충전 안 깸 / reduced-motion
  경로 tween 없음·가드 미부착) 전부 통과. 기존 회귀 test-gate-4321.mjs 27/27 유지. tsc 신규 에러 0(기존 Toc.tsx 4건만).

### 리뷰 백로그 (2026-07-04 전체 코드베이스 Opus 리뷰 — 급하지 않으나 기록)
- TwistedGridMotion 121KB 인라인 SMIL + reduced-motion 탈출구 없음(SMIL은 CSS로 못 멈춤 → matchMedia + pauseAnimations() 필요).
- 히어로 인터랙티브 섹션(profile/칩)이 링크가 아님(cursor/hover만) — 라우팅 EDGE 채울 때 <a>로 해소(의도된 상태).
- convertToSummaryMapper의 유령 `| null`(실제 null 반환 없음) → 소비처마다 불필요한 타입가드. thumbnail 폴백 EDGE와 함께 결정.
- active-heading 구현 2개(headingObserver ↔ 미사용 useActiveHeadingObserver 훅), createHaadingObserver 오타 스텁 — 정리 필요.
- CSS 중복 3종(세로 레일 ×3, hover 링 복붙, 스케일 파생 3회 저작) → u-rail/u-hover-ring 추출 후보.
- article 타이포 !important·.article-tags 3중 소유 — 카드 태그 전용 클래스(.card-tag) 분리로 특이도 에스컬레이션 차단.
- 폰트 self-host/subset(Pretendard full CDN 블로킹), 사이드바 deep-link 진입 시 1회 슬라이드(관찰).

### 알려진 기술 부채 (이번 작업 범위 밖, 별도 정리)
- `astro build`/`sync`가 이 환경에서 "Vite module runner closed"로 실패(콘텐츠 로더). **`astro dev`는 정상.** clean HEAD에서도 재현 → 환경 이슈.
- 기존 tsc 에러 다수: Astro5 content-layer 마이그레이션(`utils/resolver.ts`의 `.slug`/`.render` 제거), `getCollection` 필터 콜백 반환 타입 오타(`postServicer.ts:38`), unist/rehype visitor 타이핑, strict-null(`Toc.tsx` 등), `sorter.ts` import 경로.
