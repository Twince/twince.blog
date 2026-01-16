import { defineCollection, reference } from "astro:content";
import { glob, file } from 'astro/loaders'
import { z } from 'astro/zod';

export const seo = z.object({
  title: z.string(),
  description: z.string(),
});

const thumbnail = z.object({
  src: z.string(),
  alt: z.string().optional()
})

const readingTime = z.union([
  z.number().positive(),
  z.tuple([z.number().positive(), z.number().positive()])
  // .transform((val: number) => {
  //   if(Array.isArray(val)) return val;
  //   return [val, val]
  // }) -> 해당 로직은 resolver에서 처리하는 것이 맞다고 판단. 보류(`25.12.25)
])

const categories = z.array(z.string()).optional().default([])

export const series = defineCollection({
  loader: file("src/content/blog/series.json"),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
  })
})

export const topics = defineCollection({
  loader: file("src/content/blog/topics.json"),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
  })
})

const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "src/content/blog/posts" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    status: z.enum(['draft', 'published']),
    categories: categories,
    topics: z.array(reference('topics')),
    series: z.array(reference('series').optional()),
    readingTime: readingTime, // length가 1이면 읽는 시간이 index[0] ~ index[1] 만큼 소요
    author: z.string(),
    coAuthors: z.array(z.string()).optional().default([]),
    thumbnail: thumbnail.optional(),
    seo: seo.optional(),
  })
})

export const collections = {
  'posts': posts,
  'series': series,
  'topics': topics,
}