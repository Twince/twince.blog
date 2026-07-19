# CLAUDE.md — twince-blog

새 Claude Code 세션이 시작될 때 자동 로드된다. **기기를 바꿔도 동일한 "학습 모드"로 이어가기 위한 작동 메모리.**

> **이 파일의 역할 (D10)**: 프로토콜 + 현재 EDGE + 함정만. 매 세션 전량 과금되는 hot path이므로
> 맥락·아카이브·완료된 작업 일지는 `docs/`에 두고 **링크만** 한다. 새 내용을 여기 추가하기 전에
> "다음 세션이 이걸 모르면 사고가 나는가?"를 먼저 물을 것 — 아니면 `docs/` 행이다.

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
5. **검증 없이 "완료"라고 말하지 않는다.** 실측(렌더·테스트)으로 확인하고, 못 한 건 "미검증"으로 남긴다.

---

## 📎 문서 지도 (맥락은 전부 여기)

| 문서 | 내용 | 언제 읽나 |
|---|---|---|
| [docs/overview.md](docs/overview.md) | 프로젝트 개요·레이어 구조·콘텐츠 도메인 모델·스타일 시스템 | 구조 파악, 어디에 뭐가 있는지 |
| [docs/decisions.md](docs/decisions.md) | 의사결정 기록 D1~D14 + **미결 백로그(사용자 결정 대기)** | "왜 이렇게 되어 있지?", 착수 전 미결 확인 |
| [docs/build-notes.md](docs/build-notes.md) | 페이지별 구현 세부·실측 타이포·리뷰 백로그 | root/카드 손볼 때 |
| [docs/gate-history.md](docs/gate-history.md) | 스크롤 게이트 16차 작업 일지(실패한 접근 포함) | 게이트 건드릴 때 |
| [docs/authoring-images.md](docs/authoring-images.md) | 포스트 이미지 저작 문법 | 콘텐츠 작성 |
| [docs/thumbnail-line-pipeline.md](docs/thumbnail-line-pipeline.md) | 라인 아트 썸네일 생성 파이프라인 | 시리즈 에셋 추가 |
| [docs/toc-pipeline-decision.md](docs/toc-pipeline-decision.md) | TOC 생성 파이프라인 | TOC 작업 |

**Figma 원본**: `twince-s-blog` (fileKey `5hJ4FG9uMItBkIBc4yOrHo`), 페이지 `Final`. Figma MCP로 접근.
알려진 오타(코드로 옮길 때 교정): `PHILOSPPY`→PHILOSOPHY, `Sereis`→Series, `horizental`→horizontal.

---

## 🎯 다음 작업 (사용자 EDGE — 학습 모드 결정 지점)

1. `SeriesCardSummary` 타입 설계 + `getSeriesCards()` 구현 (`service/post/types/SeriesServicer.ts` 힌트 참고)
   → `RootLayout.astro`의 `MOCK_SERIES` 교체. 핵심: postCount 역참조 집계(N+1 vs 1-pass 맵).
   ※ root MOCK_SERIES의 #2·#3 id는 아직 **dead route** — 이 EDGE 완료 시 해소.
2. 최근 포스트 개수 제한 — `PostGridLayout`에 limit prop vs RecentPosts 래퍼 (계약 결정).
3. 칩·시리즈 카드 라우팅(`/series/[id]`, 카테고리 페이지) — 현재 칩은 비링크.
4. 헤더 메뉴 라벨: 코드 POSTS/SERIES/SLIDES vs 시안 POST/SERIES/CATEGORIES — 불일치 해소.

그 외 미결 18건은 [decisions.md 미결 백로그](docs/decisions.md) 참고.

---

## ⚠️ 함정 (모르면 또 밟는다)

**CSS 캐스케이드** — 상세 [D14](docs/decisions.md)
- **`:is()` 특이도 전염**: `:is(a, b c)`의 특이도는 **인자 중 최고값**. `u-rail` 공통화가 `.art-rail`(0,1,0)을
  `.series-hero .hero-rail`(0,2,0)과 묶어놔서 미디어쿼리의 bare `.art-rail{display:none}`이 조용히 졌다.
  같은 `:is()`에 `explore-rail`·`hero-rail`도 있으니 이들 오버라이드는 **0,2,0 이상**으로.
- **파생 토큰은 소비 지점에 선언**: `--card-row-*`를 `:root`에 두면 var()가 :root에서 치환돼
  컨텍스트 `--card-scale` override가 무시된다(실제로 밟은 버그).
- **`width:100%`가 안 먹으면 부모를 보라**: 부모가 content-sized면(`justify-items:center` 등) 순환 참조로 무력화.
- **하한(floor)은 미디어쿼리에서 덮지 말 것**: 토큰이 `max(13px, …)`인데 절대 px로 덮으면 하한이 무효화돼
  모바일이 데스크탑보다 작아진다(series에서 실제 발생). 계약 전문은 `semantic.css` 헤더, 배경은 [D13](docs/decisions.md).
- **`!important` 쓰기 전에 "누가 왜 이기는지"를 먼저 측정**: 대개 캐스케이드 구조를 잘못 안 것이다.

**검증**
- headless Chrome은 **최소 창폭 ~500px** → 모바일은 CDP `Emulation.setDeviceMetricsOverride` 또는 iframe 폭 사용.
- 인라인 `!important`조차 computed에 안 잡히면 CSS가 아니라 **렌더러 정지**를 의심(CDP 타임아웃으로 확진된 적 있음).
- `astro build`/`sync`는 이 환경에서 "Vite module runner closed"로 실패(clean HEAD에서도 재현 — 환경 이슈). **`astro dev`는 정상.**

**기타**
- topic id는 **소문자 canonical**(topics.json: dev/design/memoir/…), 표시는 title 또는 CSS uppercase.
- astro.config 변경(rehype 플러그인 등)은 **dev 재시작 필요**.
- Astro 삼항 분기 괄호 안에 JSX 주석+요소 병치 금지(단일 표현식이 깨진다).
