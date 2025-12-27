import type { CollectionEntry } from "astro:content";
import type { ResolvedPost } from "./types/Resolver";

const DEFAULT_THUMBNAIL = {
  src: "*",
  alt: "Post Thumbnail",
};

// post collectoin 필드 평탄화 및 데이터 정합성 보장
export const resolvePost = (post: CollectionEntry<"posts">): ResolvedPost => {
  const { id, slug, render, data } = post;
  return {
    id,
    slug: id,
    ...data,
    thumbnail: {
      src: data.thumbnail?.src ?? DEFAULT_THUMBNAIL.src,
      alt: data.thumbnail?.alt ?? DEFAULT_THUMBNAIL.alt,
    },
    seo: {
      title: data.seo?.title ?? data.title,
      description: data.seo?.description ?? data.description,
    },
  };
};
