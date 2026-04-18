import { readFile, readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import matter from 'gray-matter'
import { marked } from 'marked'
import articlesJson from '../data/articles.json' with { type: 'json' }
import { validateArticles, type ArticleItem } from './articles'

export type TopicDocument = {
  title: string
  slug: string
  summary: string
  readingOrder: string[]
  body: string
}

export type StaticPageDocument = {
  title: string
  description: string
  body: string
}

marked.setOptions({
  gfm: true
})

export function loadArticles(): ArticleItem[] {
  return validateArticles(articlesJson)
}

export async function loadTopicDocuments(rootDir: string): Promise<TopicDocument[]> {
  const topicDir = join(rootDir, 'src', 'content', 'topics')
  const fileNames = await readdir(topicDir)
  const topics = await Promise.all(fileNames.filter((fileName) => fileName.endsWith('.md')).map(async (fileName) => {
    const source = await readFile(join(topicDir, fileName), 'utf8')
    const { data, content } = matter(source)

    return {
      title: String(data.title),
      slug: String(data.slug),
      summary: String(data.summary),
      readingOrder: Array.isArray(data.readingOrder) ? data.readingOrder.map(String) : [],
      body: await marked.parse(content)
    } satisfies TopicDocument
  }))

  return topics
}

export async function loadStaticPageDocument(rootDir: string, pageName: string): Promise<StaticPageDocument> {
  const pagePath = join(rootDir, 'src', 'content', 'pages', `${pageName}.md`)
  const source = await readFile(pagePath, 'utf8')
  const { data, content } = matter(source)

  return {
    title: String(data.title),
    description: String(data.description),
    body: await marked.parse(content)
  }
}

export function getRootDir(importMetaUrl: string): string {
  return dirname(dirname(dirname(new URL(importMetaUrl).pathname)))
}
