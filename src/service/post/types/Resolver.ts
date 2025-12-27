import type { CollectionEntry } from "astro:content";
import { seo, topics, series } from "../../../content/config";
import { z } from 'astro/zod';

type seoSchema = z.infer<typeof seo>
type topicsSchema = z.infer<typeof topics.schema>
type seriesSchema = z.infer<typeof series.schema>

export type ResolvedPost = {
  id: string,
  slug: string,
  render: CollectionEntry<'posts'>['render'],
  title: string;
  description: string;
  date: Date;
  status: 'draft' | 'published';
  categories: string[];
  topics: string;
  series: string;
  readingTime: number;
  author: 'Twince';
  coAuthor?: string[];
  thumbnail: {
    src: string;
    alt?: string;
  }
  seo: seoSchema;
}