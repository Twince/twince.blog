import type { CollectionEntry } from "astro:content";

type PostData = CollectionEntry<'posts'>['data'];

export type ResolvedPost = {
  id: string,
  slug: string,
  title: PostData['title']
  description: PostData['description'],
  date: PostData['date'],
  status: PostData['status'],
  tags: PostData['tags'],
  topics: PostData['topics'],
  series?: PostData['series'],
  readingTime: PostData['readingTime'],
  author: PostData['author'], // 스키마가 string인데 리터럴로 좁히면 resolvePost 대입이 불가 — 좁히기는 스키마(z.literal) 쪽 결정
  coAuthors?: PostData['coAuthors'],
  thumbnail: {
    src: NonNullable<PostData['thumbnail']>['src']; // 스키마 image() = ImageMetadata (string 아님)
    alt: string;
  }
  seo: NonNullable<PostData['seo']>; // resolvePost가 항상 폴백으로 채움
}