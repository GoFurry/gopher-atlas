import { z } from 'zod'
import {
  CATEGORY_ORDER,
  CATEGORY_SLUG_MAP,
  PAGE_SIZE,
  RATING_ORDER,
  SORT_OPTIONS,
  slugify,
  type Difficulty,
  type Language,
  type Rating,
  type SortOption
} from './site'

export const articleLinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url()
})

export const articleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  originalUrl: z.string().url().optional(),
  links: z.array(articleLinkSchema).min(1).optional(),
  author: z.string().min(1).optional(),
  source: z.string().min(1).optional(),
  publishedAt: z.string().optional(),
  addedAt: z.string(),
  category: z.string().min(1),
  tags: z.array(z.string().min(1)).min(1),
  rating: z.enum(RATING_ORDER),
  language: z.enum(['zh', 'en']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  summary: z.string().min(1),
  reason: z.string().min(1),
  featured: z.boolean().optional(),
  mustRead: z.boolean().optional()
})

export type ArticleItem = z.infer<typeof articleSchema>
export type ArticleLink = z.infer<typeof articleLinkSchema>

export type ArticleSearchState = {
  q: string
  category: string
  tags: string[]
  rating: Rating[]
  sort: SortOption
  lang: Language | ''
  page: number
}

export const DEFAULT_SEARCH_STATE: ArticleSearchState = {
  q: '',
  category: '',
  tags: [],
  rating: [],
  sort: 'recommended',
  lang: '',
  page: 1
}

export function validateArticles(input: unknown): ArticleItem[] {
  return z.array(articleSchema).parse(input)
}

function toTime(value?: string): number {
  if (!value) {
    return 0
  }

  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function compareByRating(left: Rating, right: Rating): number {
  return RATING_ORDER.indexOf(left) - RATING_ORDER.indexOf(right)
}

export function sortArticles(items: ArticleItem[], sort: SortOption): ArticleItem[] {
  const list = [...items]

  if (sort === 'rating') {
    return list.sort((left, right) => compareByRating(left.rating, right.rating) || right.title.localeCompare(left.title))
  }

  if (sort === 'recently-added') {
    return list.sort((left, right) => toTime(right.addedAt) - toTime(left.addedAt))
  }

  if (sort === 'published-date') {
    return list.sort((left, right) => toTime(right.publishedAt) - toTime(left.publishedAt) || toTime(right.addedAt) - toTime(left.addedAt))
  }

  if (sort === 'title-asc') {
    return list.sort((left, right) => left.title.localeCompare(right.title))
  }

  return list.sort((left, right) => {
    if (Boolean(left.featured) !== Boolean(right.featured)) {
      return left.featured ? -1 : 1
    }

    if (Boolean(left.mustRead) !== Boolean(right.mustRead)) {
      return left.mustRead ? -1 : 1
    }

    const ratingDelta = compareByRating(left.rating, right.rating)
    if (ratingDelta !== 0) {
      return ratingDelta
    }

    return toTime(right.addedAt) - toTime(left.addedAt)
  })
}

export function filterArticles(items: ArticleItem[], state: ArticleSearchState): ArticleItem[] {
  const query = state.q.trim().toLowerCase()

  return items.filter((article) => {
    if (state.category && article.category !== state.category) {
      return false
    }

    if (state.lang && article.language !== state.lang) {
      return false
    }

    if (state.rating.length > 0 && !state.rating.includes(article.rating)) {
      return false
    }

    if (state.tags.length > 0 && !state.tags.every((tag) => article.tags.includes(tag))) {
      return false
    }

    if (!query) {
      return true
    }

    const haystack = [
      article.title,
      article.author,
      article.source,
      article.summary,
      article.reason,
      article.tags.join(' ')
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })
}

export function paginateArticles(items: ArticleItem[], page: number, pageSize = PAGE_SIZE): {
  items: ArticleItem[]
  totalPages: number
  currentPage: number
} {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const currentPage = Math.min(Math.max(page, 1), totalPages)
  const start = (currentPage - 1) * pageSize

  return {
    items: items.slice(start, start + pageSize),
    totalPages,
    currentPage
  }
}

export function parseSearchParams(input: URLSearchParams): ArticleSearchState {
  const sort = input.get('sort')
  const lang = input.get('lang')
  const page = Number.parseInt(input.get('page') ?? '1', 10)
  const categories = new Set(CATEGORY_ORDER)

  return {
    q: input.get('q')?.trim() ?? '',
    category: categories.has(input.get('category') as never) ? input.get('category') ?? '' : '',
    tags: toUniqueList(input.get('tags')),
    rating: toUniqueList(input.get('rating')).filter(isRating),
    sort: SORT_OPTIONS.includes(sort as SortOption) ? (sort as SortOption) : DEFAULT_SEARCH_STATE.sort,
    lang: lang === 'zh' || lang === 'en' ? (lang as Language) : '',
    page: Number.isFinite(page) && page > 0 ? page : 1
  }
}

export function stringifySearchState(state: ArticleSearchState): string {
  const params = new URLSearchParams()

  if (state.q) {
    params.set('q', state.q)
  }
  if (state.category) {
    params.set('category', state.category)
  }
  if (state.tags.length > 0) {
    params.set('tags', state.tags.join(','))
  }
  if (state.rating.length > 0) {
    params.set('rating', state.rating.join(','))
  }
  if (state.sort !== DEFAULT_SEARCH_STATE.sort) {
    params.set('sort', state.sort)
  }
  if (state.lang) {
    params.set('lang', state.lang)
  }
  if (state.page > 1) {
    params.set('page', String(state.page))
  }

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export function getArticleStats(items: ArticleItem[]) {
  const categories = [...new Set(items.map((item) => item.category))].sort(sortCategories)
  const tags = [...new Set(items.flatMap((item) => item.tags))].sort((left, right) => left.localeCompare(right))
  const sources = [...new Set(items.map((item) => item.source).filter(Boolean))] as string[]

  return {
    categories,
    tags,
    sources,
    featured: items.filter((item) => item.featured),
    mustRead: items.filter((item) => item.mustRead),
    latest: [...items].sort((left, right) => toTime(right.addedAt) - toTime(left.addedAt))
  }
}

export function getCategorySlug(category: string): string {
  return CATEGORY_SLUG_MAP[category as keyof typeof CATEGORY_SLUG_MAP] ?? slugify(category)
}

export function toUniqueList(value: string | null): string[] {
  if (!value) {
    return []
  }

  return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))]
}

export function isRating(value: string): value is Rating {
  return RATING_ORDER.includes(value as Rating)
}

export function sortCategories(left: string, right: string): number {
  const leftIndex = CATEGORY_ORDER.indexOf(left as never)
  const rightIndex = CATEGORY_ORDER.indexOf(right as never)

  if (leftIndex === -1 || rightIndex === -1) {
    return left.localeCompare(right)
  }

  return leftIndex - rightIndex
}

export function groupTagsByCount(items: ArticleItem[]) {
  const tagMap = new Map<string, number>()

  for (const article of items) {
    for (const tag of article.tags) {
      tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1)
    }
  }

  return [...tagMap.entries()]
    .map(([name, count]) => ({ name, count, slug: slugify(name) }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
}

export function buildArticleSearchIndex(article: ArticleItem): string {
  return [
    article.title,
    article.author,
    article.source,
    article.summary,
    article.reason,
    article.tags.join(' ')
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}
