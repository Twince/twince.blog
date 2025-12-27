import type { ResolvedPost } from "./types/Resolver";

export const sortPosts = (posts: ResolvedPost[]): ResolvedPost[] => {
  const copiedPosts = [...posts];
  return sortBylastest(copiedPosts);
}

// 날짜 내림차순
const sortBylastest = (posts:ResolvedPost[]) => {
  return posts.sort((a, b) => {
    return b.date.getTime() - a.date.getTime();
  })
}

// TODO: 조회수별, 시리즈별 sorting