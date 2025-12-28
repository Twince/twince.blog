export type NeighborPosts = {
  next: {
    slug: string | null,
    title: string | null
    description: string | null,
  },
  previous: {
    slug: string | null;
    title: string | null;
    description: string | null;
  }
} | null;