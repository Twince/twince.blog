export type Post = {
  slug: string;
  meta: PostMeta;
  content: string;
}

export type PostMeta = {
  title: string;
  description: string;
  date: Date
  tags: string[]
  topic: string[]
  author: string
}