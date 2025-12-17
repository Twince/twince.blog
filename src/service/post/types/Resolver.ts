import { PostSchema, SeoSchema, ThumbnailSchema } from "../../../content/config";
import { z } from "astro:content";

export type Post = z.infer<typeof PostSchema>
export type Seo = z.infer<typeof SeoSchema>
export type Thumbnail = z.infer<typeof ThumbnailSchema>

export type ResolvedPost = {
  title: string;
  description: string;
  date: Date;
  status: 'draft' | 'publsihed';
  tags: string[];
  topic: string;
  readingTime: number;
  author: 'Twince';
  coAuthor?: string[];
  thumbnail: {
    src: string;
    alt?: string;
  }
  seo: Seo;
}