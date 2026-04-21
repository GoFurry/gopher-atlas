import { readFile, readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import matter from 'gray-matter'
import { marked, type Tokens } from 'marked'
import hljs from 'highlight.js/lib/common'
import articlesJson from '../data/articles.json' with { type: 'json' }
import { validateArticles, type ArticleItem } from './articles'
import { slugify } from './site'

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

export type NoteDocument = {
  title: string
  slug: string
  description: string
  author: string
  createdAt: string
  updatedAt: string
  group: string
  groupSlug: string
  groupDescription: string
  groupOrder: number
  order: number
  body: string
}

let codeBlockId = 0

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function formatCodeLanguage(language?: string): string {
  if (!language) {
    return 'Text'
  }

  const normalized = language.trim().toLowerCase()
  const aliases: Record<string, string> = {
    ts: 'TypeScript',
    js: 'JavaScript',
    sh: 'Shell',
    shell: 'Shell',
    bash: 'Bash',
    yml: 'YAML',
    md: 'Markdown',
    golang: 'Go'
  }

  if (aliases[normalized]) {
    return aliases[normalized]
  }

  return normalized
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

marked.setOptions({
  gfm: true
})

marked.use({
  renderer: {
    code(token: Tokens.Code) {
      const language = token.lang?.trim().toLowerCase()
      const highlighted = language && hljs.getLanguage(language)
        ? hljs.highlight(token.text, { language }).value
        : hljs.highlightAuto(token.text).value
      const displayLanguage = formatCodeLanguage(language)
      const textareaId = `markdown-code-${++codeBlockId}`

      return `
        <div class="markdown-code-block">
          <div class="markdown-code-block__toolbar">
            <span class="markdown-code-block__language">${escapeHtml(displayLanguage)}</span>
            <button class="markdown-code-block__copy" type="button" data-copy-code-target="${textareaId}">复制代码</button>
          </div>
          <pre><code class="hljs${language ? ` language-${escapeHtml(language)}` : ''}">${highlighted}</code></pre>
          <textarea class="hidden" id="${textareaId}" aria-hidden="true" tabindex="-1">${escapeHtml(token.text)}</textarea>
        </div>
      `
    }
  }
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

function humanizeSlug(input: string): string {
  return input
    .split('-')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

export async function loadNoteDocuments(rootDir: string): Promise<NoteDocument[]> {
  const notesDir = join(rootDir, 'src', 'content', 'notes')
  const groupEntries = await readdir(notesDir, { withFileTypes: true })
  const groups = groupEntries.filter((entry) => entry.isDirectory())

  const notes = await Promise.all(groups.flatMap(async (groupEntry) => {
    const groupSlug = groupEntry.name
    const groupDir = join(notesDir, groupSlug)
    const fileNames = await readdir(groupDir)

    return Promise.all(fileNames.filter((fileName) => fileName.endsWith('.md')).map(async (fileName) => {
      const filePath = join(groupDir, fileName)
      const source = await readFile(filePath, 'utf8')
      const { data, content } = matter(source)
      const slug = typeof data.slug === 'string' && data.slug.trim().length > 0
        ? slugify(data.slug)
        : fileName.replace(/\.md$/, '')

      return {
        title: String(data.title),
        slug,
        description: String(data.description),
        author: String(data.author),
        createdAt: String(data.createdAt),
        updatedAt: String(data.updatedAt),
        group: typeof data.group === 'string' && data.group.trim().length > 0
          ? String(data.group)
          : humanizeSlug(groupSlug),
        groupSlug,
        groupDescription: typeof data.groupDescription === 'string' ? String(data.groupDescription) : '',
        groupOrder: typeof data.groupOrder === 'number' ? data.groupOrder : Number(data.groupOrder ?? 999),
        order: typeof data.order === 'number' ? data.order : Number(data.order ?? 999),
        body: await marked.parse(content)
      } satisfies NoteDocument
    }))
  }))

  return notes
    .flat()
    .sort((left, right) => {
      if (left.groupOrder !== right.groupOrder) {
        return left.groupOrder - right.groupOrder
      }

      if (left.groupSlug !== right.groupSlug) {
        return left.groupSlug.localeCompare(right.groupSlug)
      }

      if (left.order !== right.order) {
        return left.order - right.order
      }

      return left.createdAt.localeCompare(right.createdAt)
    })
}

export function getRootDir(importMetaUrl: string): string {
  return dirname(dirname(dirname(new URL(importMetaUrl).pathname)))
}
