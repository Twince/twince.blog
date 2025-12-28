// module
import { getCollection } from "astro:content";
import { resolvePost } from "./resolver";
import { sortPosts } from "./sorter";

// type
import type { CollectionEntry } from "astro:content";
import type { ResolvedPost } from "./types/Resolver";
import type { NeighborPosts } from "./types/Index";


type rawPost = CollectionEntry<'posts'>

export const PostService = {
  // status가 'publihed'인 Post만 fetch(프로덕트 빌드된 기준)
  async getPublsihedPosts(): Promise<ResolvedPost[]> {
    const rawPosts = await getCollection('posts', ({data}): rawPost => {
      return import.meta.env.PROD ? data.status === "published" : true;
    });
    const resolvedPosts = rawPosts.map((post: rawPost) => resolvePost(post));
    return sortPosts(resolvedPosts);
  },

  // 특정 Post의 slug를 기준으로 이전 글과 다음 글 fetch
  async getPostWithNeighbors(slug: string): Promise<NeighborPosts> {
    const allPosts = await this.getPublsihedPosts();
    const currentIndex = allPosts.findIndex((post) => post.slug === slug);

    if(currentIndex === - 1) return null;

    const isFirstPost = 0 === currentIndex;
    const isLastPost = allPosts.length-1 === currentIndex;

    return {
      next: {
        slug: isFirstPost ? null : allPosts[currentIndex-1].slug,
        title: isFirstPost ? null : allPosts[currentIndex-1].title,
        description: isFirstPost ? null : allPosts[currentIndex-1].description
      },
      previous: {
         slug: isLastPost ? null : allPosts[currentIndex+1].slug,
        title: isLastPost ? null : allPosts[currentIndex+1].title,
        description: isLastPost ? null : allPosts[currentIndex+1].description
      }
    }
  }
}