import type { ResolvedPost, Post, Thumbnail } from '../post/types/Resolver';

const DEFAULT_THUMBNAIL = {
  src: '*',
  alt: 'Post Thumbnail',
}

export const resorvedPost = (post: Post): ResolvedPost => {
  return {
    title: post.title,
    description: post.description,
    date: post.date,
    status: post.status,
    tags: post.tags,
    topic: post.topic,
    readingTime: post.readingTime,
    author: post.author,
    coAuthor: post.coAuthor ?? [],
    thumbnail: {
      src: post.thumbnail?.src ?? DEFAULT_THUMBNAIL.src,
      alt: post.thumbnail?.alt ?? DEFAULT_THUMBNAIL.alt,
    },
    seo: {
      title: post.seo?.title ?? post.title,
      description: post.seo?.description ?? post.description,
    }
  };
}