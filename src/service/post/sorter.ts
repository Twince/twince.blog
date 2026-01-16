import type { ResolvedPost } from "./types/Resolver";

export const sortPosts = (posts: ResolvedPost[]): ResolvedPost[] => {
  const copiedPosts = [...posts];
  return sortBylastest(copiedPosts);
}

// 날짜 내림차순
const sortBylastest = (posts:ResolvedPost[]) => {
  return posts.sort((a, b) => {
    const timeDiff = b.date.getTime() - a.date.getTime();
    if(timeDiff == 0) return timeDiff;
    return a.title.localeCompare(b.title); // 게시 시간이 같다면 제목순으로 정렬
  })
}

// TODO: 조회수별, 시리즈별 sorting