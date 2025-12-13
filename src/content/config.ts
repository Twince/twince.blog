import { defineCollection, z } from "astro:content";

const SeoSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const ThumbnailSchema = z.object({
  src: z.string(),
  alt: z.string().optional()
})

const PostSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  status: z.enum(['draft', 'published']),
  tags: z.array(z.string()).optional().default([]),
  topic: z.string().optional(),
  readingTime: z.number().optional(),
  author: z.string(),
  coAuthors: z.array(z.string()).optional().default([]),
  thumbnail: ThumbnailSchema.optional(),
  seo: SeoSchema.optional(),
})
