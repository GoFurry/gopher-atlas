import { describe, expect, it } from 'vitest'
import { filterArticles, getArticleStats, getCategorySlug, paginateArticles, sortArticles } from '../src/lib/articles'
import { loadArticles } from '../src/lib/content'

describe('articles data and list helpers', () => {
  const articles = loadArticles()

  it('validates seed articles and derives categories/tags', () => {
    const stats = getArticleStats(articles)

    expect(articles.length).toBeGreaterThanOrEqual(3)
    expect(stats.categories).toContain('Go New Features')
    expect(stats.categories).toContain('Benchmarking & Comparisons')
    expect(stats.tags).toContain('gc')
    expect(stats.tags).toContain('benchmark')
  })

  it('maps category names to topic slugs consistently', () => {
    expect(getCategorySlug('Go New Features')).toBe('go-new-features')
    expect(getCategorySlug('Benchmarking & Comparisons')).toBe('benchmarking-and-comparisons')
  })

  it('applies default recommended order with featured and must-read first', () => {
    const sorted = sortArticles(articles, 'recommended')

    expect(sorted[0]?.featured).toBe(true)
    expect(sorted[0]?.mustRead).toBe(true)
    expect(sorted[0]?.id).toBe('green-tea-gc')
    expect(sorted[0]?.rating).toBe('A+')
  })

  it('filters by keyword, category, tags, rating, and language together', () => {
    const filtered = filterArticles(articles, {
      q: 'gc',
      category: 'Go New Features',
      tags: ['gc'],
      rating: ['A+'],
      sort: 'recommended',
      lang: 'zh',
      page: 1
    })

    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.id).toBe('green-tea-gc')
  })

  it('keeps pagination bounded when requested page exceeds result count', () => {
    const sorted = sortArticles(articles, 'recommended')
    const page = paginateArticles(sorted, 99, 1)

    expect(page.totalPages).toBeGreaterThan(1)
    expect(page.currentPage).toBe(page.totalPages)
    expect(page.items.length).toBeGreaterThan(0)
  })
})
