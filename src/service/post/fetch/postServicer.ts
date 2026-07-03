// module imports
import { getCollection, getEntry } from "astro:content";
import { resolvePost } from "../utils/resolver";
import { sortPosts } from "../utils/sorter";

// type imports
import type {
  PostCardWithThumbnail,
  NeighborSummary,
  rawPost,
} from "../types/PostServicer";
import type { ResolvedPost } from "../types/Resolver";
import { series } from "../../../content/config";

// type definition(about module domain)
type NullableSummary = PostCardWithThumbnail | null;

type Mapper<from, to> = (resolvedPosts: ResolvedPost) => NullableSummary;
type SummaryMapper = Mapper<ResolvedPost, NullableSummary>;

type TaggedPosts = NullableSummary;
type SeriesMatchedPosts = NullableSummary;
type TopicMatchedPosts = NullableSummary;
type NeighborPosts = {
  next: NeighborSummary | null;
  previous: NeighborSummary | null;
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
    // 모듈 스코프 캐시: 빌드는 프로세스당 1회라 안전, dev HMR에선 stale 허용(재시작으로 갱신)
    cachedPosts = sortPosts(resolvedPosts);
    return cachedPosts;
  },

  convertToSummaryMapper(resolvedPosts: ResolvedPost): NullableSummary {
    return {
      slug: resolvedPosts.slug,
      title: resolvedPosts.title,
      topic: resolvedPosts.topics[0]?.id ?? null,
      description: resolvedPosts.description,
      tags: resolvedPosts.tags,
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
      next: isFirstPost ? null :  {
        slug: allPosts[currentIndex - 1].slug,
        title: allPosts[currentIndex - 1].title,
        description: allPosts[currentIndex - 1].description,
      },
      previous: isLastPost ? null : {
        slug: allPosts[currentIndex + 1].slug,
        title: allPosts[currentIndex + 1].title,
        description: allPosts[currentIndex + 1].description,
      },
    };
  },

  // minMatch n를 매개변수를 받을 시, 최소 n개 이상 카테고리가 겹칠때만 post fetch
  async getPostWithTags(
    tags: string | string[],
    minMatch?: number
  ): Promise<TaggedPosts[]> {
    const allPosts = await this.getPublishedPosts();
    const targetTags = Array.isArray(tags)
      ? tags
      : [tags];

    const tagSet = new Set(targetTags.map((c) => c.toUpperCase()));
    const filteredPosts = allPosts.filter((post) => {
      const postTags = post.tags;

      if (minMatch) {
        const intersection = postTags.filter((c) => tagSet.has(c));
        return intersection.length >= minMatch;
      }
      return postTags.some((c) => tagSet.has(c));
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
