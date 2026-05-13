export const SITE_NAME = 'GopherAtlas'
export const SITE_URL = 'https://gopheratlas.com'
export const SITE_DESCRIPTION = '高质量 Go 技术文章精选导航，按专题、标签与评级整理的阅读地图。'
export const GITHUB_URL = 'https://github.com/gofurry/gopher-atlas'
export const PAGE_SIZE = 12

export const CATEGORY_ORDER = [
  'Go New Features',
  'Benchmarking & Comparisons',
  'Performance Optimization',
  'Daily Library',
  'Web Development'
] as const

export const TOPIC_CATEGORY_SLUGS = [
  'go-new-features',
  'benchmarking-and-comparisons',
  'performance-optimization',
  'daily-library',
  'web-development'
] as const

export const CATEGORY_SLUG_MAP = {
  'Go New Features': 'go-new-features',
  'Benchmarking & Comparisons': 'benchmarking-and-comparisons',
  'Performance Optimization': 'performance-optimization',
  'Daily Library': 'daily-library',
  'Web Development': 'web-development'
} as const

export const RATING_ORDER = ['S+', 'S', 'A+', 'A', 'B+', 'B', 'C+', 'C'] as const
export const SORT_OPTIONS = [
  'recommended',
  'rating',
  'recently-added',
  'published-date',
  'title-asc'
] as const
export const SORT_OPTION_LABELS = {
  recommended: '推荐优先',
  rating: '按评级',
  'recently-added': '最近收录',
  'published-date': '原文日期',
  'title-asc': '标题字母序'
} satisfies Record<(typeof SORT_OPTIONS)[number], string>

export const LANGUAGE_LABELS = {
  zh: '中文',
  en: 'English'
} as const

export const DIFFICULTY_LABELS = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '高级'
} as const

export type Rating = (typeof RATING_ORDER)[number]
export type SortOption = (typeof SORT_OPTIONS)[number]
export type Language = keyof typeof LANGUAGE_LABELS
export type Difficulty = keyof typeof DIFFICULTY_LABELS

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatDate(dateString?: string): string {
  if (!dateString) {
    return '日期未注明'
  }

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

export function toCanonicalUrl(pathname: string): string {
  if (pathname === '/') {
    return SITE_URL
  }

  return `${SITE_URL}${pathname.endsWith('/') ? pathname.slice(0, -1) : pathname}`
}
