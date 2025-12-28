// module
import { resolvePost } from "./resolver";
import { sortPosts } from "./sorter";

// type
import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";
import type { ResolvedPost } from "./types/Resolver";
import type { NeighborPosts } from "./types/Index";


type rawPost = CollectionEntry<'posts'>

export const PostService = {
  async getPublsihedPosts(): Promise<ResolvedPost[]> {
    const rawPosts = await getCollection('posts', ({data}): rawPost => {
      return import.meta.env.PROD ? data.status === "published" : true;
    });
    const resolvedPosts = rawPosts.map((post: rawPost) => resolvePost(post));
    return sortPosts(resolvedPosts);
  },

  async getPostWidthNeighbors(slug: string): Promise<NeighborPosts> {
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