import { getCollection } from "astro:content";
import type { SeriesCardSummary } from "../types/SeriesServicer";
import { PostService } from "./postServicer";

export const SeriesService = {
  async getSeriesCount(): Promise<Map<string, number>> {
    // publishedPosts 받기
    const publishedPosts = await PostService.getPublishedPosts();
    const counts = new Map<string, number>();

    publishedPosts.map(post => {
      post.series?.forEach(ref => {
        if(!ref) return;
        counts.set(ref.id, (counts.get(ref.id) ?? 0) + 1);
      })
    })
    // map으로 반환
    return counts;
  },
  async getSeriesCards(): Promise<SeriesCardSummary[]> {
    const seriesObjs = await getCollection("series");
    const seriesCounts = await this.getSeriesCount();

    return seriesObjs.map(entry => ({
      id: entry.id,
      title: entry.data.title,
      count: seriesCounts.get(entry.id) ?? 0,
      description: entry.data.description,
      thumbnail: entry.data.thumbnail ?? null, // undefined → null 명시 (유령 undefined 제거)
    }))
  }
}