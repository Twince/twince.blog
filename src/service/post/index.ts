// module
import { resolvePost } from "./resolver";
import { sortPosts } from "./sorter";

// type
import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";
import type { ResolvedPost } from "./types/Resolver";


type rawPost = CollectionEntry<'posts'>

export const PostService = {
  async getPublsihedPosts(): Promise<ResolvedPost[]> {
    const rawPosts = await getCollection('posts', ({data}): rawPost => {
      return import.meta.env.PROD ? data.status === "published" : true;
    });
    const resolvedPosts = rawPosts.map((post: rawPost) => resolvePost(post));
    return sortPosts(resolvedPosts);
  }

  // getAllPosts
}