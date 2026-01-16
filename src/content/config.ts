import { defineCollection, reference } from "astro:content";
import { glob, file } from 'astro/loaders'
import { z } from 'astro/zod';
import { tocGenerator } from "../service/post/observe/tocGenerator";
import type { TocNode } from "../service/post/types/TocGenrator";
import { markdownToHast } from "../plugins/markdownToAst";

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

const tocNode:z.ZodType<TocNode> = z.object({
  id: z.string(),
  text: z.string(),
  depth: z.number(),
  children: z.array(z.lazy(() => tocNode)),
});


//defineCollections
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
loader: {
  name: "custom-post-loader",
  load: async (context) => {
      const { glob } = await import('astro/loaders');
      const innerLoader = glob({ pattern: "**/*.md", base: "src/content/blog/posts" });

      // 기본 로더를 먼저 실행하여 파일을 Store 채우기
      await innerLoader.load(context);

      // Store에 담긴 모든 엔트리를 순회하며 데이터 변환(TOC 생성)을 수행
      const tasks = Array.from(context.store.entries()).map(async ([id, entry]) => {
        // HAST 및 TOC 생성
        const hast = await markdownToHast(entry.body ?? '');
        const toc = tocGenerator.getToc(hast);

        // 4. 기존 데이터를 유지하면서 새로운 데이터를 덮어씌움(Set).
        context.store.set({
          id,
          data: {
            ...entry.data,
            toc, // 주입된 데이터 schema 검증
          },
          body: entry.body,
          rendered: entry.rendered,
        });
      });

      await Promise.all(tasks);
    }
  },
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
    toc: tocNode.optional(),
  })
})

export const collections = {
  'posts': posts,
  'series': series,
  'topics': topics,
}