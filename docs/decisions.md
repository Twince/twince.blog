# 의사결정 기록 (Decision Log)

> ADR(Architecture Decision Record) 경량 형식: **맥락 → 대안 → 결정 → 근거**.
> "왜 이렇게 되어 있지?"에 답하는 아카이브. 최신이 아래. 구조 개요는 [overview.md](./overview.md).

---

## D1. 카드 view-model — 소비자별 타입 분리

- **맥락**: 카드·이웃·목록이 포스트 데이터를 서로 다른 폭으로 소비. 단일 거대 타입은 소비처마다 불필요한 필드와 유령 null을 강요.
- **대안**: ① 단일 Post 타입 공유 ② 소비자별 분리
- **결정**: ② — `PostSummary → PostCardSummary → PostCardWithThumbnail` 확장 계층 + `NeighborSummary`(의미용 별칭). resolve는 resolver가 담당(SRP), variant(row/col)는 데이터가 아니라 `PostGridLayout`의 discriminant.
- **근거**: 코어 필드에서 `| null` 제거 가능(데이터 흐름상 non-null), 각 소비자가 자기 계약만 알면 됨. 별칭은 독립 진화 여지.

## D2. 분류 체계 — topic(통제 참조) > tags(자유 라벨)

- **맥락**: category/tags 혼용, 대소문자 불일치.
- **결정**: `category`→`tags`로 통일(동작에 이름 맞춤). 위계: topic = 통제 어휘(topics.json, reference, 소문자 canonical) / tags = 포스트 소유 자유 문자열. 카드 INSIGHT 라벨 = `topics[0].id`(참조에 id가 있어 sync — 표시명 분기가 필요해지면 그때 `.title` resolve로 전환).
- **전이**: 통제 어휘와 자유 라벨은 다른 데이터 구조다 — 전자는 참조 무결성이, 후자는 소유가 본질.

## D3. 스케일 시스템 — 페이지 스케일 노브 × Figma raw

- **결정**: 페이지 루트에 `--{page}-scale` 하나를 두고 모든 치수를 `calc(figma원본px × scale)`로 파생. 파생 토큰은 **소비 지점에 선언**(:root에 두면 var()가 :root에서 치환돼 컨텍스트 override 무시 — 실제로 밟은 버그).
- **읽기 하한**: 스케일(비례)과 가독 floor(`max(13px, …)` — 2026-07-19에 12→13px 상향)는 **별개 축** — floor는 읽기 텍스트에만, 장식성 모노는 제외.
- **보류**: 뷰포트 연동 clamp 스케일(큰 모니터 문제)은 사이트 전체 동시 결정 사안으로 이연. knob 간접층 덕에 전환 비용은 값 교체 한 줄.
- **전이**: 고정 스케일 = 캔버스 충실도 레짐, 뷰포트 스케일 = 디바이스 인체공학 레짐. 레짐 경계는 페이지가 아니라 *컴포넌트 재사용 경계*를 따라야 크기 점프가 없다.

## D4. 스크롤 게이트 — 클램프 전쟁에서 수납 구조로

- **맥락**: 아티클 하단 게이트(충전식 관련 포스트 진입)에서 경계 바운스가 반복 재발. IO 판정 → scroll 산술 → 접근 마진 인터셉트(14차) → 사후 교정 매프레임 재주장(15차)까지 전부 "이미 시작된 컴포지터 스무스 스크롤을 JS가 되돌리는" 싸움이었고, CDP로 재현조차 불가능했다.
- **결정**(16차): 싸움의 대상을 제거 — 관련 포스트 섹션을 게이트 통과 전 `data-collapsed`(height 0) 수납. `scrollHeight-clientHeight == boundary`가 되어 **브라우저 네이티브 클램프**가 경계를 지킨다. 동시에 단방향 게이트로 단순화(복귀는 자유 스크롤), 리스너 전부 passive화.
- **근거/전이**: 플랫폼이 소유한 애니메이션과 매 프레임 싸우는 구조가 나오면, 이기려 하지 말고 *싸움의 대상(경계 너머 스크롤 영역)을 레이아웃에서 제거*하라. 네이티브 불변식(스크롤은 콘텐츠 끝을 못 넘음)이 공짜로 경계를 지킨다.
- **후속**: main과 UI/root가 게이트를 독립 진화시켜 의미 기반 머지 수행(수납 아키텍처 + in-flow 컨트롤 결합). 전수 스윕 결과 잔존 버그 0, snap tween 350ms 한정 non-passive 가드 추가.

## D5. 게이트 컨트롤 — fixed → in-flow

- **결정**: 컨트롤을 뷰포트 좌표(fixed + JS 지오메트리)에서 문서 흐름(in-flow, `margin: auto` 센터링)으로. setDock/updateControlX/재측정 타이머 전부 삭제.
- **전이**: 콘텐츠에 종속된 UI는 fixed가 아니라 in-flow에 두면 콘텐츠 변형(각주 토글 등)에 공짜로 추종한다. fixed는 '콘텐츠와 무관하게 화면에 붙어야 하는 것'에만.

## D6. non-passive 리스너 — "필요한 구간에서만 존재"

- **맥락**: 상시 부착된 non-passive wheel/touchmove가 컴포지터 스크롤을 죽여 본문 전체가 버벅였다. 비용은 핸들러 실행이 아니라 *리스너의 존재 자체*.
- **결정**: preventDefault가 필요한 리스너는 필요한 구간에서만 동적 부착/해제. 수납 전환 후엔 유일한 잔존 창구인 snap tween(350ms)에만 가드 부착.

## D7. 푸터 — 앱셸에서는 스크롤 컨테이너 내부에

- **맥락**: body가 스크롤하지 않는 앱셸이라 BaseLayout `<main>` 뒤의 푸터는 도달 불가.
- **결정**: 각 페이지 스크롤 컨테이너의 마지막 자식으로 렌더. 아티클은 게이트 불변식("경계 아래 콘텐츠 0") 보존을 위해 관련 포스트 섹션 **내부**에 두어 수납에 함께 접히게 한다.

## D8. 시리즈 에셋 — 도메인 디렉토리 + 콜로케이션

- **맥락**: 시리즈 대표 썸네일의 위치. 후보: ① content/blog/series/(+json 이동) ② 전역 assets 디렉토리 ③ seriesThumbnail 평면 디렉토리.
- **결정**: ① — `content/blog/series/` = 레지스트리(series.json) + 엔티티별 폴더(`<id>/thumbnail.png`).
- **근거**: 에셋은 소유 엔티티 옆에(수명 동기 — 삭제 시 고아 없음), `posts/<slug>/assets`와 프랙탈 일관성, `image()` 최적화가 콘텐츠 파일 기준 상대 경로를 요구. ②는 타입 그룹핑이라 수명 분리(전역 자리는 프레젠테이션 소유 에셋인 `src/ui/assets`가 이미 담당), ③은 엔티티가 형제 디렉토리로 분산.
- **포스트를 시리즈 폴더에 넣지 않는 이유**: 파일시스템 계층 = 합성(단일 부모, 수명 공유), 시리즈 멤버십 = 연관(선택적·가변). 스키마의 `series: reference[]`가 이미 정답.
- **전이**: 관계가 선택적이거나 가변이면 트리가 아니라 참조로 — DB 스키마, 컴포넌트 트리 vs 상태 참조 어디서나 동일.

## D9. thumbnail 스키마 — 공유 팩토리, 형태/정책 분리

- **맥락**: posts/series 썸네일이 "같아야 하는"(카드 계약 재사용 의도) 중복.
- **결정**: `const thumbnail = (image: SchemaContext['image']) => z.object({ src: image(), alt: z.string().optional() })` — `image()`는 컬렉션 컨텍스트 주입이라 값이 아닌 **팩토리**로만 공유 가능(받아서 인자로 다시 넘기는 DI 릴레이). `.optional()`은 팩토리가 아니라 **호출부**가 결정(형태 = 공유, 정책 = 사용처).
- **정책**: series는 optional + 폴백 = 기존 썸네일 덱 유지. 부재가 실재하므로 view-model은 명시적 `| null`(유령 null 아님).
- **전이**: DRY는 텍스트가 같을 때가 아니라 *변경 이유가 같을 때*. 프레임워크 컨텍스트는 전역으로 훔치지 않고 인자로 흘린다(DI).

## D10. 문서 체계 — CLAUDE.md(작동 메모리) / docs(아카이브) 분리

- **맥락**: CLAUDE.md가 매 세션 로드되는 인수인계 문서인데 작업 일지가 축적되어 역할 오염. 모든 토큰이 관련 여부와 무관하게 매 세션 과금됨.
- **결정**: CLAUDE.md = 프로토콜 + 현재 상태 + 다음 EDGE + 함정 목록("다음 세션이 모르면 사고 나는 것"). docs/ = 개요·도메인 구조·의사결정 기록("언젠가 왜?라고 물을 것"). 
- **전이**: 캐시 설계와 동일 — 항상 로드되는 hot path(작업 셋)는 작게, 나머지는 cold storage + 포인터.

## D11. root 썸네일 시각 정규화 — 윤곽 추출 + hover 컬러 해금

- **맥락**: 시리즈 카드 썸네일(고채도 색면 3장)이 root 첫 화면의 위계를 역전 — 모노크롬 + 희소 오렌지 액센트라는 페이지 문법을 깨뜨림. 썸네일은 통제 불가 입력이라 개별 이미지 교정으로는 해결 불가.
- **대안 탐색**(실렌더 비교): grayscale → 지면 duotone(SVG feComponentTransfer 램프) → 사선 블라인드(기각 — 패턴 자체가 노이즈) → 포스터라이즈 → **윤곽 추출(채택)**.
- **결정**: SVG 필터 체인(무채색화→블러→라플라시안→증폭→테마별 색 매핑)으로 썸네일을 라인 드로잉으로 변환 — TwistedGrid 와이어프레임과 동일 언어. hover 시 컬러 해금("도면→실물"). `url()` 필터는 CSS 보간 불가라 **같은 src 2레이어 스택 + opacity 크로스페이드**로 전환.
- **전이**: ① 자극 보정의 상급 해법은 볼륨 낮추기가 아니라 *페이지의 시각 언어로 번역* ② 보간 불가능한 상태 전환(url 필터·이미지·폰트)은 속성 애니메이션 대신 레이어 공존 + opacity 크로스페이드 ③ 콘텐츠가 공급하는 시각 자산은 시스템 레이어에서 톤을 정규화해야 일관성이 콘텐츠에 의존하지 않는다.
- **다음 단계(합의됨)**: 시리즈별 전용 라인 아트 에셋(SVG, currentColor)으로 업그레이드 — 시스템 필터는 에셋 없는 시리즈의 폴백으로 존속. 스키마 확장은 사용자 EDGE.

## D12. 라인 아트 에셋 파이프라인 — 컨벤션 배치 + 산출물 커밋

- **맥락**: D11의 라인 아트를 시리즈마다 반복 생성해야 하는데, 매번 수동 명령/에이전트 호출은 지속 불가능.
- **결정**: 컨벤션 기반 배치 — 소스를 `series/<id>/thumbnail-line.png`로 두면 `pnpm run thumbnail-trace`가
  전 시리즈를 스캔, **mtime 비교로 stale한 것만 재생성**(make 원리). 산출 SVG는 커밋(빌드/CI에 potrace·pillow
  의존성 미전파). series.json 참조는 자동 수정하지 않고 경고만 — 데이터 계약은 스키마(사용자) 소유.
- **잉크·배경 결정**: 선 색 = 보더↔텍스트 토큰 보간 22%(`color-mix` — 새 상수 없이 명도 사다리 위 위치로 정의),
  대기 존 배경 = `bg-hero + text-primary 1%`(끝점이 시맨틱 토큰이라 라이트=어두워짐/다크=밝아짐이 자동 —
  다크 UI elevation 관례 부합). 굵기 = 파이프라인 dilate 3(에셋 속성은 에셋 레이어가 소유).
- **전이**: ① 반복 생성물은 "소스 컨벤션 + stale 검사 배치"로 — 도구 호출을 사람이 기억하는 구조는 지속 불가
  ② 파생 산출물을 커밋할지는 소비처(CI)의 의존성 비용으로 결정 ③ 중간값은 토큰 간 보간으로, 방향성 분기는
  끝점을 시맨틱 토큰으로. 상세 워크플로는 [thumbnail-line-pipeline.md](./thumbnail-line-pipeline.md).

## D13. 타이포 계약 — 하한은 불변식, 공유 역할은 semantic

- **맥락**: [D3](#d3-스케일-시스템--페이지-스케일-노브--figma-raw)의 스케일 노브는 *비례*만 다루고 **반응형 축을 안 다룬다**. 그래서 브레이크포인트마다 절대 px로 탈출했고(font-size 선언 96개 중 14개), 그 탈출구가 D3이 세운 가독 floor까지 함께 버렸다. 실제 피해 2건: ① `--series-item-desc`가 `max(12px, …)`인데 모바일 미디어쿼리가 `font-size: 11px`로 덮어 **모바일(11px)이 데스크탑(12px)보다 작은 역전** ② `about.css`가 `calc(25px * 1.1)`로 **series의 스케일 상수를 하드코딩**, 짝인 `.about-cert-title`은 27px로 0.5px 드리프트.
- **대안**: ① 전 토큰을 clamp() 유동으로 전환(미디어쿼리 자체를 소거) ② 노브는 유지하고 계약으로 탈출을 금지 ③ 현상 유지 + 개별 수정
- **결정**: ② — `semantic.css` 헤더에 타이포 계약 3조 명문화. (1) 하한은 불변식이므로 미디어쿼리 절대값으로 덮지 않는다, 크기 조정은 노브/토큰으로. (2) 여러 페이지가 공유하는 타이포 '역할'은 `--size-*`(semantic)에 두고 페이지 geometry 노브와 분리한다. (3) 페이지 전용·시안 고유 치수는 페이지 CSS의 raw × scale로 남긴다 — 전부 올리는 과잉 일반화도 부채.
- **적용**: 모바일 `font-size: 11px` 선언 **삭제**(값 교체가 아니라 선언 제거 → 토큰 상속이 자동 복원). `--size-page-section-title: 27.5px` 신설, 소비처 3곳(`.series-page-title` / `.about-exp-title` / `.about-cert-title`) 공유. 속성 테스트로 결합 해소 증명 — `--series-scale`를 2배로 흔들어도 page-title 불변(item-title은 정상 추종), 공유 토큰 변경 시 3곳 동시 이동.
- **근거**: 하한을 뚫는 사고는 *조용히* 일어난다(빌드도 타입체크도 안 잡음). 값을 고치는 대신 **선언을 지워 상속시키면** 이후 하한 변경이 전 브레이크포인트에 자동 전파돼 재발 자체가 불가능해진다.
- **전이**: 스케일(비례)과 하한(가독)은 별개 축인데, 노브를 우회하는 절대값 오버라이드는 **두 축을 동시에 버린다**. 시스템이 어떤 축(여기선 반응형)을 안 다루면 사용자는 그 시스템을 우회하고, 우회로는 시스템이 세운 불변식을 모른다 — 탈출구를 막기 전에 *왜 탈출했는지*를 먼저 시스템에 흡수시켜야 한다.
- **미결**: 타이포 축과 geometry 축이 아직 `--{ctx}-scale` 하나에 묶여 있다. 모바일 series 타이틀이 데스크탑 대비 전부 ≈0.74 비율인 걸로 보아 `--series-type-scale` 분리가 가능해 보이나, 같은 노브가 padding·min-height·gap도 구동해 파급이 크다 → D3의 보류 항목(뷰포트 연동 clamp 스케일)과 **함께** 결정할 것.

## D14. CSS 캐스케이드 함정 — 공통화의 특이도 비용, content-sized 부모

- **맥락**: 모바일 정리 작업에서 "분명히 썼는데 안 먹는" CSS 버그 2종을 밟았다. 둘 다 선언 자체는 옳고 *주변 구조*가 무력화한 경우.
- **① `:is()` 특이도 전염**: `:is()`의 특이도 = **인자 중 최고값**. 세 레일을 `u-rail`로 공통화하면서 `.art-rail`(0,1,0)이 `.series-hero .hero-rail`(0,2,0)과 한 묶음에 들어갔고, 그 결과 공통 규칙 전체가 0,2,0이 되어 미디어쿼리의 bare `.art-rail { display: none }`이 졌다. → `.profile-art > .art-rail`로 특이도를 맞춰 해소(소스 순서상 뒤라 승). 근본 해결은 `:where()`(특이도 항상 0)지만 다른 소비처의 오버라이드 특이도까지 재조정해야 해 보류.
- **② content-sized 부모의 `width: 100%`**: `justify-items: center`가 grid 아이템의 stretch를 막아 `li`가 트랙 폭 대신 fit-content로 줄었고, 그러면 카드의 `width: 100%`가 참조할 부모 폭이 **순환 참조**가 되어 shrink-to-fit으로 폴백 — 카드가 트랙보다 53px 좁았다. 다열 구간에서만 센터링이 의미 있으므로 모바일 1열에서 `stretch`로 복원.
- **전이**: ① 공통화(`:is()`, 유틸리티 묶음)로 줄인 코드의 대가는 **특이도 결합**이다 — 가장 특이한 인자가 모두를 끌어올린다. ② `width: 100%`가 "안 먹으면" 자신이 아니라 *부모가 어떻게 사이징되는지*를 보라(부모가 content-sized면 순환). ③ **특이도를 올리기 전에 누가 왜 이기고 있는지를 먼저 측정하라** — `!important`가 필요하다고 느껴지면 대개 "이겨야 한다"가 아니라 "캐스케이드 구조를 잘못 알고 있다"는 신호다. 우회 순서: 원인 규명 → `@layer`로 우선순위를 설계로 표현 → `:where()`로 특이도 0 → 최후에 소폭 상향(자식 결합자·스코프 클래스).
- **검증 하네스 교훈**: 인라인 `!important`조차 computed style에 반영되지 않으면 CSS가 아니라 **렌더러 정지**를 의심할 것(직후 CDP 타임아웃으로 확진). 캐스케이드를 파기 전에 하네스 생존 확인이 먼저.

---

# 미결 백로그 (사용자 결정 대기)

> 위 D1~D14는 *내려진* 결정. 아래는 *아직 안 내려진* 결정 — 2026-07-06 아키텍처 감사(5개 관점
> 멀티에이전트: 아키텍처/보안/TS/CSS·a11y/성능)에서 safe 22건은 적용하고 남긴 판단 지점들이다.
> 착수 전 이 목록을 확인할 것. 해결되면 항목을 D번호로 승격하고 여기서 제거한다.

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

