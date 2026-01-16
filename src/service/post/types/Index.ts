//imports
import type { CollectionEntry } from "astro:content";

// types
export type rawPost = CollectionEntry<'posts'>

export interface PostSummaryBase {
    slug: string | null;
    title: string | null;
    description: string | null;
    categories: string[] | null;
};

export interface PostSummaryWithThumbnail extends PostSummaryBase {
  thumbnail: {
      src: string;
      alt: string;
  }
}

