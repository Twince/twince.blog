// module
import { getCollection } from "astro:content";
import { resolvePost } from "./resolver";
import { sortPosts } from "./sorter";

// type
import type { CollectionEntry } from "astro:content";
import type { ResolvedPost } from "./types/Resolver";
import type { PostSummary } from "./types/Index";
import type { NeighborPosts } from "./types/Index";
import { series } from "../../content/config";


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
  
  // minMatch n를 매개변수를 받을 시, 최소 n개 이상 카테고리가 겹칠때만 post fetch
  async getPostWithCategories(categories: string | string[], minMatch?: number): Promise<PostSummary[]> {
    const allPosts = await this.getPublishedPosts();
    const targetCategories = Array.isArray(categories) ? categories : [categories];

    const categorySet = new Set(targetCategories.map(c => c.toUpperCase()));
    const filteredPosts = allPosts.filter((post) => {
      const postCategories = post.categories;

      if(minMatch) {
        const intersection = postCategories.filter(c => categorySet.has(c))
        return intersection.length >= minMatch;
      }
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
  },

  async getPostsWithSeries(seriesId: string): Promise<PostSummary[]> {
    const allPosts = await this.getPublishedPosts();
    
    const filteredPosts =  allPosts.filter((post) => {
      if(post.series) { // 해당 post가 series 속성을 가지고 있다면
        const postSeriesArr = post.series.map((referenceObj) => referenceObj?.id) // 불러온 series 데이터는 series.json 객체의 참조를 return({id, collection })
        const postSeriesSet = new Set(postSeriesArr);
        return postSeriesSet.has(seriesId);
      } else return null;
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