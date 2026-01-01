import type { CollectionEntry } from "astro:content";
import { seo, topics, series } from "../../../content/config";
import { z } from 'astro/zod';

type SeoSchema = z.infer<typeof seo>
type PostData = CollectionEntry<'posts'>['data'];

export type ResolvedPost = {
  id: string,
  slug: string,
  title: PostData['title']
  description: PostData['description'],
  date: PostData['date'],
  status: PostData['status'],
  categories: PostData['categories'],
  topics: PostData['topics'],
  series?: PostData['series'],
  readingTime: PostData['readingTime'],
  author: 'Twince';
  coAuthor?: PostData['coAuthors'],
  thumbnail: {
    src: string;
    alt: string;
  }
  seo: PostData['seo'];
}