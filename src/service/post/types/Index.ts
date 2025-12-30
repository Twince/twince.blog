export type PostSummary = {
    slug: string | null;
    title: string | null;
    description: string | null;
    thumbanil?: {
      src: string;
      alt: string;
    }
} | null;

export type NeighborPosts = {
  next: PostSummary;
  previous: PostSummary;
} | null;