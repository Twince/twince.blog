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
    slug,
    render,
    title: data.title,
    description: data.description,
    date: data.date,
    status: data.status,
    categories: data.categories,
    topics: data.topics,
    series: data.series,
    readingTime: data.readingTime,
    author: data.author,
    coAuthor: data.coAuthor ?? [],
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
