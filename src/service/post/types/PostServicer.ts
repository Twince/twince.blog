//imports
import type { CollectionEntry } from "astro:content";

// types
export type rawPost = CollectionEntry<'posts'>

export interface PostSummary {
  slug: string;
  title: string;
  description: string;
}

export type NeighborSummary = PostSummary;

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

