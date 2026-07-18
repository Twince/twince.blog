# twince.blog — 프로젝트 개요 & 도메인 구조

> 이 문서는 아카이브(cold storage)다. 매 세션 로드되는 CLAUDE.md(작동 메모리)와 달리,
> "이 프로젝트가 무엇이고 왜 이런 모양인가"를 필요할 때 찾아보는 용도.
> 의사결정의 상세 근거는 [decisions.md](./decisions.md) 참고.

## 프로젝트

Astro 기반 개인 블로그. Figma 시안(`twince-s-blog`, 페이지 `Final`)을 원본으로 픽셀 매칭 구현.
**학습 모드 협업**으로 개발한다: 사용자가 핵심 로직(타입·데이터 모델·계약 결정)을 소유하고,
Claude가 퍼블리싱(마크업·CSS·반복 작업)을 담당한다. 협업 규칙은 CLAUDE.md가 소유.

- 배포 계획: GitHub Pages(github.io) + Cloudflare DNS(자체 도메인 twince.me), 게시글은 `post` 브랜치 CI/CD (설계 단계)
- 댓글: giscus 스캐폴딩됨(Discussions 활성화 대기)
- 로깅: Cloudflare 프록시 + Web Analytics → 자체 이벤트 파이프라인(Workers) 확장 구상 (설계 단계)

## 레이어 구조

```
src/
├── content/            ← 데이터 진실 소스
│   ├── config.ts       — content collection 스키마(zod). 데이터 형태의 모든 결정이 여기서 내려진다
│   └── blog/
│       ├── posts/<slug>/index.md + assets/   — 포스트(엔티티 폴더, 에셋 콜로케이션)
│       ├── series/series.json + <id>/…       — 시리즈 레지스트리 + 엔티티별 에셋
│       └── topics.json                        — 토픽 레지스트리(통제 어휘)
├── service/post/       ← 투영·가공 레이어 (content → view-model)
│   ├── fetch/          — postServicer, seriesServicer (getSeriesCards 등)
│   ├── types/          — 소비자별 view-model 타입 (PostServicer, SeriesServicer)
│   ├── utils/          — sorter, resolver
│   └── observe/        — 브라우저 옵서버 (scrollGateObserver, headingObserver, tocGenerator)
├── plugins/            ← 빌드타임 변환 (rehypeFootnotesToggle, markdownToAst)
├── ui/                 ← 프레젠테이션
│   ├── components/astro/  — 카드(Row/ColDirectionPost), SeriesListItem, RelatedPosts, 게이트 컨트롤 등
│   ├── components/react/  — Toc (client island)
│   ├── css/            — 토큰 시스템 + 페이지별 css (root/, series/, article/, about/)
│   ├── layouts/        — BaseLayout(앱셸) + 페이지 레이아웃 + Header/Footer
│   └── assets/         — 프레젠테이션 소유 공유 에셋 (아이콘, twisted_grid.svg)
└── pages/              ← 라우트 (Astro file-based)
```

레이어 규칙: **content는 형태를, service는 투영을, ui는 표현을 소유**한다.
ui가 content를 직접 뒤지지 않고 service의 view-model을 소비하는 것이 원칙
(예외적으로 페이지가 공개 API를 조합하는 곳이 있고, 이는 점진적으로 service로 흡수 중).

## 콘텐츠 도메인 모델

```
Topic (통제 어휘, topics.json)     ← 포스트가 reference로 참조. 위계상 상위 분류
Tag   (자유 라벨, 포스트별 문자열)  ← 포스트가 소유. 통제 없음
Series (레지스트리, series.json)   ← 포스트가 reference 배열로 참조(연관). 시리즈가 포스트를 소유하지 않는다
Post  (엔티티 폴더)                ← 본문 + frontmatter + 콜로케이션 에셋
```

- topic id는 소문자 canonical(dev/design/memoir/…), 표시는 title 또는 CSS uppercase
- 시리즈 멤버십은 폴더 계층이 아니라 **참조**로 표현한다 — 모든 포스트가 시리즈에 속하지 않고, 소속은 가변이기 때문 (결정 #8)
- 썸네일은 posts/series가 **동형 계약**(공유 스키마 팩토리) — 카드 컴포넌트 재사용을 위해 (결정 #9)

## 앱셸과 페이지

BaseLayout: `<Header /> + <main h=100dvh-var(--header-h)> + 페이지별 내부 스크롤 컨테이너`.
body는 스크롤하지 않는다 → **푸터는 각 페이지 스크롤 컨테이너의 마지막 자식**으로 렌더.

| 라우트 | 레이아웃 | 특징 |
|---|---|---|
| `/` | RootLayout | 히어로(프로필+TwistedGrid 배경아트) · 최근 포스트 · 시리즈 · 토픽 밴드 |
| `/posts` | post-grid | 카드 그리드 (col variant) |
| `/series`, `/series/[id]` | SeriesListItem / SeriesDetailLayout | 목록(썸네일 덱) + 상세(슬러그 레일 히어로) |
| `/about` | AboutLayout | 히어로 + EXPERIENCE 타임라인 |
| `/posts/[slug]` | ArticleLayout | 본문 + TOC 사이드바 + **스크롤 게이트** + 관련/이웃 포스트 |

## 스타일 시스템

- **토큰 2계층**: primitive(gray-75…) → semantic(--color-bg-hero, --color-bg-elevated…). 라이트/다크는 semantic에서 분기
- **스케일 노브 패턴**: 페이지 루트에 `--{page}-scale` × Figma raw(정수) 곱으로 전 치수 파생.
  파생 토큰은 반드시 소비 지점에 선언(컨텍스트 override가 작동하려면 — :root 선언 금지)
- 반응형: 미디어 레인지 문법 3단(<768 / 768≤w<1024 / ≥1024)

## 주요 인터랙션 시스템

- **스크롤 게이트**(아티클): 관련 포스트를 게이트 통과 전 height 0 수납 → 네이티브 클램프가 경계를 지킴.
  단방향 상태머신(hidden→ready↔charging→snapping-forward→arrived), 전부 passive 리스너,
  snap tween 350ms 동안만 non-passive 가드. 진화사는 결정 #5~#7
- **TOC**: 헤딩 IntersectionObserver + React island. 이중 생성 파이프라인 일원화는 미결(decision 버킷)
- **각주 토글**: rehype 플러그인이 details/summary로 변환, `::details-content` 높이 애니메이션,
  토글↔게이트 결합은 `ScrollGateObserver.sync()` 한 줄
