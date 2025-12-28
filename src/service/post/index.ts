// module
import { getCollection } from "astro:content";
import { resolvePost } from "./resolver";
import { sortPosts } from "./sorter";

// type
import type { CollectionEntry } from "astro:content";
import type { ResolvedPost } from "./types/Resolver";
import type { PostSummary } from "./types/Index";
import type { NeighborPosts } from "./types/Index";


type rawPost = CollectionEntry<'posts'>

export const PostService = {
  // status가 'publihed'인 Post만 fetch(프로덕트 빌드된 기준)
  async getPublishedPosts(): Promise<ResolvedPost[]> {
    const rawPosts = await getCollection('posts', ({data}): rawPost => {
      return import.meta.env.PROD ? data.status === "published" : true;
    });
    const resolvedPosts = rawPosts.map((post: rawPost) => resolvePost(post));
    return sortPosts(resolvedPosts);
  },

  // 특정 Post의 slug를 기준으로 이전 글과 다음 글 fetch
  async getPostWithNeighbors(slug: string): Promise<NeighborPosts> {
    const allPosts = await this.getPublishedPosts();
    const currentIndex = allPosts.findIndex((post) => post.slug === slug);

    if(currentIndex === - 1) return null;

    const isFirstPost = 0 === currentIndex;
    const isLastPost = allPosts.length-1 === currentIndex;

    //TODO: 포스트 존재 여부로 함수 리팩토링 하기(ex. !post ? return NeighborPosts : null)
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
  },

  async getPostWithCategories(categories: string | string[]): Promise<PostSummary[]> {
    const allPosts = await this.getPublishedPosts();
    // 입력받은 카테고리를 uppercase된 string[] 형태로 정규화
    const targetCategories = Array.isArray(categories) ? categories.map((c) => c.toUpperCase()) : [categories.toUpperCase()];

    const categorySet = new Set(targetCategories);
    const filteredPosts = allPosts.filter((post) => {
      const postCategories = post.categories;
      return postCategories.some((c) => categorySet.has(c))
    })

    return filteredPosts.map((post) => {
      return {
        slug: post.slug,
        title: post.title,
        description: post.description,
        thumbnail: post.thumbnail,
      }
    })
  }
}