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


const readingTime = z.union([
  z.array(z.number().positive()),
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
      const baseDir = "src/content/blog/posts";
      const innerLoader = glob({ 
        pattern: "**/*.md", 
        base: "src/content/blog/posts", 
        generateId: ({ entry }) => entry.replace(/\/index\.md$/, '').replace(/\.md$/, '')
       });

      // 기본 로더를 먼저 실행하여 파일을 Store 채우기
      await innerLoader.load(context);

      // Store에 담긴 모든 엔트리를 순회하며 데이터 변환(TOC 생성)을 수행
      const tasks = Array.from(context.store.entries()).map(async ([id, entry]) => {
        const updatedData = { ...entry.data } as any;
        
        // HAST 및 TOC 생성
        const hast = await markdownToHast(entry.body ?? '');
        const toc = tocGenerator.getToc(hast);

        updatedData.toc = toc;

        const newDigest = entry.digest ? `${entry.digest}-modified` : JSON.stringify(updatedData);

        context.store.set({
          ...entry,
          data: updatedData,
          digest: newDigest,
        });
      });
      await Promise.all(tasks);
    }
  },
  schema: ({ image }) =>  z.object({
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
    thumbnail: z.object({
      src: image(),
      alt: z.string().optional()
    }).optional(),
    toc: tocNode.optional(),
    seo: seo.optional(),
  })
})

export const collections = {
  'posts': posts,
  'series': series,
  'topics': topics,
}