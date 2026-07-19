# 구현 노트 & 리뷰 백로그 (아카이브)

> 페이지별 구현 시 내린 세부 결정과 실측값. 구조 개요는 [overview.md](./overview.md),
> 의사결정 근거는 [decisions.md](./decisions.md).

---

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

### RowDirectionPost 현황 (이번에 퍼블리싱)
- 구현됨: 가로 레이아웃(썸네일 좌 + 우측 topic 라벨/title/description/tags). ColDirectionPost와 동일 토큰·클래스 컨벤션.
- CSS: `postGrid.css`의 `.row-post-card`(thumbnail/`.row-post-topic`). dev에서 `direction="row"` 렌더 검증 완료(이 세션엔 Figma MCP 없어 **픽셀 매칭은 미완** — Figma node 4200:759 기준 재조정 필요).
- **아직 `direction="row"`를 쓰는 라우트 없음** → root/topic/series 페이지에서 와이어링 필요.

### 리뷰 백로그 (2026-07-04 전체 코드베이스 Opus 리뷰 — 급하지 않으나 기록)
- TwistedGridMotion 121KB 인라인 SMIL + reduced-motion 탈출구 없음(SMIL은 CSS로 못 멈춤 → matchMedia + pauseAnimations() 필요).
- 히어로 인터랙티브 섹션(profile/칩)이 링크가 아님(cursor/hover만) — 라우팅 EDGE 채울 때 <a>로 해소(의도된 상태).
- convertToSummaryMapper의 유령 `| null`(실제 null 반환 없음) → 소비처마다 불필요한 타입가드. thumbnail 폴백 EDGE와 함께 결정.
- active-heading 구현 2개(headingObserver ↔ 미사용 useActiveHeadingObserver 훅), createHaadingObserver 오타 스텁 — 정리 필요.
- CSS 중복 3종(세로 레일 ×3, hover 링 복붙, 스케일 파생 3회 저작) → u-rail/u-hover-ring 추출 후보.
- article 타이포 !important·.article-tags 3중 소유 — 카드 태그 전용 클래스(.card-tag) 분리로 특이도 에스컬레이션 차단.
- 폰트 self-host/subset(Pretendard full CDN 블로킹), 사이드바 deep-link 진입 시 1회 슬라이드(관찰).


---

## 페이지 구현 내역 (2026-07-03 ~ 07)

**완료: root 페이지 Figma v2(3917:491) + mobile(4114:883) 픽셀 매칭 구현.** (2026-07-03)
사용자가 v1/v2 중 **v2(시리즈 위·토픽 아래)** 채택 — 근거: 구체(콘텐츠)→추상(분류) 순서,
밀도 교차 리듬(무거움-가벼움-무거움) 청킹, 칩=피드 진입 어포던스, 모바일 선형화 일관성.

**시리즈 페이지 1차 구현 완료(2026-07-03)**: `/series` 목록(SeriesListItem, 썸네일 덱+tally) +
`/series/[id]` 상세(SeriesDetailLayout: 슬러그 세로 레일+히어로+row 카드 그리드) + `series.css`(--series-scale 패턴).
데이터는 기존 공개 API 조합(getCollection + getPostsWithSeries — N+1이지만 cachedPosts라 저비용).
[id]의 getStaticPaths는 최소 구현 + EDGE 주석(0포스트 시리즈 페이지 여부·시리즈 #N 결정 주체).
※ root MOCK_SERIES의 #2·#3 id는 아직 dead route — getSeriesCards() EDGE 완료 시 해소.

**시리즈 스케일 정합(2026-07-07, A+B 채택)**: `--series-scale` 1→**1.1**(root와 동일 축), `--card-scale` 1.05→**1.1**.
읽기 텍스트 3토큰(item-desc/item-meta/hero-desc)만 `max(12px, …)` 하한 ※당시 값. 2026-07-19에 13px로 상향 — 장식성 모노(슬러그 8.8/tally/레일)는 제외,
모바일 블록 절대값 불변. 검증 16항목 통과(1440×900 + 모바일 390×844 회귀). D안(뷰포트 연동 clamp 스케일)은 기각이 아니라
**사이트 전체(root·posts·series 동시) 결정으로 보류** — decision 버킷 ⑱로 등재. knob 간접층 덕에 전환 비용은 값 교체 한 줄.
**전이 라벨**: 고정 스케일=캔버스 충실도 레짐, 뷰포트 스케일=디바이스 인체공학 레짐 — 레짐 경계는 페이지가 아니라
*컴포넌트 재사용 경계*를 따라야 크기 점프가 없다. 스케일(비례)과 가독 하한(floor)은 별개 축의 결정.

---

## 모바일 정리 사이클 (2026-07-19)

결정·전이 라벨은 [D13](./decisions.md)(타이포 계약)·[D14](./decisions.md)(캐스케이드 함정). 여기는 적용 내역·실측값.

- **root 히어로**: 모바일 좌우 보더 제거(`.root-hero-inner{border-inline:none}`). 하단 밴드 보더는 유지.
- **토픽 밴드**: 모바일 `display:none`. 아래 칩 스트립 규칙(`.topics-grid` 가로 스크롤 등)은 dead지만
  되살리기 쉽도록 보존 — 복구는 display 선언 한 줄 삭제.
  ※ 모바일에서 칩을 통한 카테고리 진입 경로가 사라짐(헤더 메뉴가 대체) — 라우팅 EDGE와 함께 재검토 대상.
- **카드 폭**(390px 뷰포트, 가용 375 기준): `/posts` 271.3→**317px**(justify-items stretch + li px-1 회수),
  `/` 303.4→**329px**(거터 28→20 + li px-1 회수).
- **li `px-1` 회수**: hover 링 히트박스용 좌우 4px — 모바일엔 hover가 없어 순수 손실. `py-1`(세로)은 유지.
- **타이포**: 카드 16/12→**17/13px**, root 섹션 타이틀 17.6→**18.7px**(raw 16→17 × root-scale 1.1).
- **섹션 타이틀 정렬**: 데스크탑용 `margin-left:10px`은 그리드 `padding-inline:23px`과 짝인 값인데
  모바일은 그 패딩이 0이라 타이틀만 밀려났다 → 모바일 `margin-left:0`으로 카드와 시작선 일치(delta 0 검증).
- **series 하한 복원·상향**: 모바일 `font-size:11px` 선언 **삭제**(값 교체 아님) → 토큰 상속.
  이어서 하한 자체를 12→**13px**로 올림(posts 카드 모바일과 같은 기준). 실측 전 뷰포트 13px.
- **공유 역할 토큰 신설**: `--size-page-section-title: 27.5px`(semantic.css). 소비처 3곳 —
  `.series-page-title` / `.about-exp-title` / `.about-cert-title`(기존 27px 드리프트 해소).

---

## 과거 tsc 부채 (2026-07-06 감사에서 17건→0건 해소, 기록용)

- 기존 tsc 에러 다수: Astro5 content-layer 마이그레이션(`utils/resolver.ts`의 `.slug`/`.render` 제거), `getCollection` 필터 콜백 반환 타입 오타(`postServicer.ts:38`), unist/rehype visitor 타이핑, strict-null(`Toc.tsx` 등), `sorter.ts` import 경로.

---

## about 히어로 모바일 — 포스터 구도 (2026-07-20)

`<650px`에서만 적용. 데스크탑·태블릿은 실측으로 불변 확인(`transform:none` / `stroke:0` / `margin-bottom:0` / `align-self:auto` / 배지 표시 / 사진 `margin-top:0`).

### 로고와 사진 사이의 빈 공간은 CSS가 아니라 이미지 안에 있었다
`sunwoo_profile.png`는 위쪽 **51px(417 중 12.2%)이 완전 투명(alpha 0)**이다. 모바일 렌더 배율
0.7304(= 사진폭 252 ÷ 원본폭 345, `cover`가 폭 기준)를 곱하면 화면에서 **37px**. 박스는 이미 −7px
겹쳐 있었으므로(로고 하단 173 / 사진 상단 165) 보이던 간격은 전부 이 투명 띠였다.
→ `margin-top: -49px`(raw)로 그만큼 회수. 히어로 828 → 791px.
**사진을 교체하면 투명 높이를 다시 재서 이 값을 고쳐야 한다.**

겹쳐도 안전한 근거(실측): 겹치는 영역이 완전 투명이고, 머리 콘텐츠는 화면 x **233**까지만 뻗는데
`SUNWOO HA` 배지는 x **259**에서 시작해 26px 여유가 있었다. (지금은 배지를 숨기므로 무의미)

### 페인트 순서는 flex order가 이미 만들어줬다
사진(order 2)이 로고(order 1)보다 나중에 그려진다. 이미지가 누끼(전체 불투명 비율 **41.1%**,
모든 행의 좌우 끝 alpha 0)라 **인물 실루엣만 글자를 가리고 나머지는 글자가 비친다** — z-index 조작 불필요.

### 면은 transparent가 아니라 배경색
`color: transparent`로 두면 뒤 twisted-grid가 글자 속을 그대로 통과해 지저분해진다.
`color: var(--color-bg-hero)`로 채우면 겉보기엔 똑같이 획만 있는 것처럼 보이면서 그리드는 차단된다.
fill·stroke 모두 시맨틱 토큰이라 라이트/다크 분기 코드가 없다(fill == 히어로 배경, 양 테마에서 일치 확인).

### lift와 translateY는 한 노브로 묶었다
글자를 내리면 로고 박스 상단이 빈 채로 남아 히어로 상단 여백이 158px까지 벌어졌다. 음수 margin으로
회수하면 아래 인물도 같이 올라와 중앙 정렬이 깨지므로, `--about-logo-y: calc(170px - lift)`로 자동
추종하게 했다. `--about-logo-lift`만 만지면 여백과 정렬이 동시에 맞는다(60px → 상단 여백 98px).
**170px은 폰트 120px 기준으로 잰 인물 세로 중앙값** — 폰트를 바꾸면 다시 재야 한다.

### 좌우 대칭 재단은 align-self, translateX 아님
로고 폭 485px > 뷰포트(350~430)라 양옆이 잘린다. 고정 `translateX`는 한 폭에서만 대칭이지만,
`inner`가 세로 flex라 `align-self: center`가 가로축을 담당하고 좌우 패딩이 대칭이라
**모든 폭에서 대칭차 0**(350/390/430 실측).

### twisted-grid `--about-art-top`: -11%로 내렸다가 -15%(원본)로 복귀
사진을 37px 당긴 만큼 그리드도 내리는 게 맞다고 판단해 -11%로 바꿨으나, 그러면 그리드가 히어로
상단을 덜 덮어 **헤더 아래가 비어 보였다**. 원본 값이 옳았다.
- ❌ **실패한 대안 — 폭 확대**: `--about-art-width`를 340%로 키우면 아트가 확대되면서 우측의 조밀한
  funnel이 화면 밖으로 밀려나 **좌하단이 오히려 더 비어 보인다.** 같은 시도를 반복하지 말 것.
- 오진 정정: "아트가 히어로 하단 202px를 못 덮는다"고 봤으나 틀렸다. `blurb` 상단이 373인데 아트
  하단은 623이라 250px 더 덮고 있고, 그 아래는 패널이 자체 배경을 가진다.

### SVG viewBox는 버그가 아니라 프레이밍 — 건드리지 말 것
`twisted_grid.svg`는 `viewBox="40 90 720 420"`인데 내용 bbox 높이는 **585**라 아래쪽 약 28%가
SVG 안에서 잘린다. 이걸 "클리핑 부채"로 오해하기 쉬우나, 생성기가 만든 전체 hourglass에서 쓸
구간을 골라낸 **의도적 프레이밍**으로 보인다.

**넓히면 안 되는 이유(실측)**: `TwistedGridMotion`은 root(`ProfileArt.astro`)와 about(`AboutHero.astro`)이
공유하고 양쪽 다 `height: auto`를 쓴다. viewBox 높이를 420 → 620으로 넓히면 종횡비가 바뀌어
**두 페이지 4개 브레이크포인트의 SVG가 전부 커진다**:

| | 변경 전 | 변경 후 |
|---|---|---|
| about @390 | 793 | 1064 (+271) |
| about @1280 | 910 | 1331 (+421) |
| root @390 | 1558 | 1862 (+304) |
| root @1280 | 1897 | 2118 (+221) |

root는 특히 위험하다 — `.twisted-art`가 `height:1082px` 고정 + `align-items:center` + `clip-path:inset(...)`
+ `rotate(61deg)`이라 SVG가 커지면 중앙 정렬 기준과 클립 관계가 전부 어긋난다.
정말 필요해지면 소비처별 `width`·`top`·`clip-path`를 함께 재조정하는 별도 작업으로 다룰 것.
