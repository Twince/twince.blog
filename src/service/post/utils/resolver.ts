import type { CollectionEntry } from "astro:content";
import type { ImageMetadata } from "astro";
import type { ResolvedPost } from "../types/Resolver";

// EDGE-TODO(사용자): thumbnail 폴백 전략 결정 — 계약을 nullable로 바꿀지, 실제 폴백 이미지를 import할지.
// "*"는 <Image>에 닿는 순간 빌드가 깨지는 지뢰(현재는 전 포스트가 thumbnail 보유라 미발화).
const DEFAULT_THUMBNAIL = {
  src: "*" as unknown as ImageMetadata,
  alt: "Post Thumbnail",
};

// post collectoin 필드 평탄화 및 데이터 정합성 보장
export const resolvePost = (post: CollectionEntry<"posts">): ResolvedPost => {
  const { id, data } = post; // Astro5 content-layer: entry에 .slug/.render 없음
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
