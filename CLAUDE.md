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

**다음 작업: `RowDirectionPost` Figma 픽셀 매칭 + `direction="row"` 라우트 와이어링.**
타입 계약 설계 → 카드 퍼블리싱까지 완료됨. 아래 "해결된 결정" 참고.

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
