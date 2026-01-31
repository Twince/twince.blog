// module imports
import { getCollection, getEntry } from "astro:content";
import { resolvePost } from "../utils/resolver";
import { sortPosts } from "../utils/sorter";

// type imports
import type {
  PostSummaryBase,
  PostSummaryWithThumbnail,
  rawPost,
} from "../types/PostServicer";
import type { ResolvedPost } from "../types/Resolver";
import { series } from "../../../content/config";

// type definition(about module domain)
type NullableSummary = PostSummaryWithThumbnail | null;

type Mapper<from, to> = (resolvedPosts: ResolvedPost) => NullableSummary;
type SummaryMapper = Mapper<ResolvedPost, NullableSummary>;

type CategorizedPosts = NullableSummary;
type SeriesMatchedPosts = NullableSummary;
type TopicMatchedPosts = NullableSummary;
type NeighborPosts = {
  next: PostSummaryBase;
  previous: PostSummaryBase;
} | null;

// logic
let cachedPosts: ResolvedPost[] | null = null;

export const PostService = {
  // status가 'publihed'인 Post만 fetch(프로덕트 빌드된 기준)
  async getPublishedPosts(): Promise<ResolvedPost[]> {
    if (cachedPosts) return cachedPosts;

    const rawPosts = await getCollection("posts", ({ data }): rawPost => {
      return import.meta.env.PROD ? data.status === "published" : true;
    });
    const resolvedPosts = rawPosts.map((post: rawPost) => resolvePost(post));
    return sortPosts(resolvedPosts);
  },

  convertToSummaryMapper(resolvedPosts: ResolvedPost): NullableSummary {
    return {
      slug: resolvedPosts.slug,
      title: resolvedPosts.title,
      description: resolvedPosts.description,
      categories: resolvedPosts.categories,
      thumbnail: resolvedPosts.thumbnail,
    };
  },

  // 특정 Post의 slug를 기준으로 이전 글과 다음 글 fetch
  async getPostWithNeighbors(slug: string): Promise<NeighborPosts> {
    const allPosts = await this.getPublishedPosts();
    const currentIndex = allPosts.findIndex((post) => post.slug === slug);

    if (currentIndex === -1) return null;

    const isFirstPost = 0 === currentIndex;
    const isLastPost = allPosts.length - 1 === currentIndex;

    //TODO: 포스트 존재 여부로 함수 리팩토링 하기(ex. !post ? return NeighborPosts : null)
    return {
      next: {
        slug: isFirstPost ? null : allPosts[currentIndex - 1].slug,
        title: isFirstPost ? null : allPosts[currentIndex - 1].title,
        description: isFirstPost
          ? null
          : allPosts[currentIndex - 1].description,
        categories: isFirstPost ? null : allPosts[currentIndex-1].categories
      },
      previous: {
        slug: isLastPost ? null : allPosts[currentIndex + 1].slug,
        title: isLastPost ? null : allPosts[currentIndex + 1].title,
        description: isLastPost ? null : allPosts[currentIndex + 1].description,
        categories: isLastPost ? null : allPosts[currentIndex + 1].categories
      },
    };
  },

  // minMatch n를 매개변수를 받을 시, 최소 n개 이상 카테고리가 겹칠때만 post fetch
  async getPostWithCategories(
    categories: string | string[],
    minMatch?: number
  ): Promise<CategorizedPosts[]> {
    const allPosts = await this.getPublishedPosts();
    const targetCategories = Array.isArray(categories)
      ? categories
      : [categories];

    const categorySet = new Set(targetCategories.map((c) => c.toUpperCase()));
    const filteredPosts = allPosts.filter((post) => {
      const postCategories = post.categories;

      if (minMatch) {
        const intersection = postCategories.filter((c) => categorySet.has(c));
        return intersection.length >= minMatch;
      }
      return postCategories.some((c) => categorySet.has(c));
    });
    return filteredPosts.map((post) => this.convertToSummaryMapper(post));
  },

  async getPostsWithSeries(seriesId: string): Promise<SeriesMatchedPosts[]> {
    const allPosts = await this.getPublishedPosts();

    const filteredPosts = allPosts.filter((post) => {
      if (post.series) {
        return post.series.some(
          (referenceObj) => referenceObj?.id === seriesId
        );
      } else return null;
    });
    return filteredPosts.map((post) => this.convertToSummaryMapper(post));
  },

  async getPostsWithTopic(topicId: string): Promise<TopicMatchedPosts[]> {
    const allPosts = await this.getPublishedPosts();
    const filteredPosts = allPosts.filter((post) => {
      return post.topics.some((referenceObj) => referenceObj.id === topicId);
    });
    return filteredPosts.map((post) => this.convertToSummaryMapper(post));
  },
};
