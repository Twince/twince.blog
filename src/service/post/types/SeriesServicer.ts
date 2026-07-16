// ═══ EDGE(사용자 핵심 로직) — 여기 채워보세요 ═══════════════════════
// root 히어로의 시리즈 쇼케이스(SeriesLayouts.astro)가 소비할 view-model과
// 그것을 만드는 서비스의 '계약'을 설계하는 자리입니다.
//
// 결정 지점:
//  1) 카드가 실제로 소비하는 필드는 무엇인가?
//     — 마크업이 렌더하는 것: 순번 라벨(시리즈 #N), 제목, 설명, 포스트 개수, (링크용) id.
//     — 순번 N은 데이터인가 표시 순서(index)인가? 타입에 넣을까, 렌더 시점에 셀까?
//  2) postCount는 어디서 오는가? series.json에는 없다.
//     — 힌트: 각 post의 data.series가 reference('series')[]다.
//       PostService.getPostsWithSeries(id)를 시리즈마다 부르면 어떤 비용이 생기나(N+1)?
//       전체 포스트 1회 순회로 seriesId→count 맵을 만드는 방법과 트레이드오프 비교.
//  3) PostSummary 계층(안2: 소비자별 분리)처럼 시리즈도 계층이 필요한가?
//     — 지금 소비자는 카드 하나뿐이다. YAGNI vs 대칭성.
//
// 전이: "컬렉션 A + 역참조 카운트(B에서 A를 참조)" 패턴은 태그 카운트,
//        카테고리별 글 수 등 모든 taxonomy 집계에 일반화된다.
// ════════════════════════════════════════════════════════════════════

export interface SeriesCardSummary {
  id: string;
  title: string;
  count: number;
  description: string;
}

// TODO(사용자): 구현 후 RootLayout.astro의 MOCK_SERIES를 이 함수 호출로 교체하세요.
// (구현 위치 제안: service/post/fetch/seriesServicer.ts — postServicer와 대칭)
//
// export async function getSeriesCards(): Promise<SeriesCardSummary[]> { ... }
