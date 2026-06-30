//imports
import type { CollectionEntry } from "astro:content";

// types
export type rawPost = CollectionEntry<'posts'>

// 코어: 포스트를 식별·라벨하는 최소 (이웃이 그대로 소비)
export interface PostSummary {
  slug: string;
  title: string;
  description: string;
}

// 의미용 별칭 — 오늘은 코어와 같지만 이웃 UI가 따로 진화할 여지를 둔다
export type NeighborSummary = PostSummary;

// 카드용: 코어 + INSIGHT 라벨/태그
export interface PostCardSummary extends PostSummary {
  /**
   * topics 배열의 첫 번째 항목(가장 높은 우선순위) topic의 id 값. INSIGHT 라벨로 표시.
   * topics 배열이 비어있으면 null.
   */
  topic: string | null;
  tags: string[];
}

// 카드 + 썸네일 (썸네일 없는 post list는 PostCardSummary를 직접 사용)
export interface PostCardWithThumbnail extends PostCardSummary {
  thumbnail: {
    src: string;
    alt: string;
  }
}

