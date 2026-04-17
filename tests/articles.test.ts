import { describe, expect, it } from 'vitest'
import { filterArticles, getArticleStats, paginateArticles, sortArticles } from '../src/lib/articles'
import { loadArticles } from '../src/lib/content'

describe('articles data and list helpers', () => {
  const articles = loadArticles()

  it('validates seed articles and derives categories/tags', () => {
    const stats = getArticleStats(articles)

    expect(articles.length).toBeGreaterThanOrEqual(12)
    expect(stats.categories).toContain('Concurrency')
    expect(stats.tags).toContain('gc')
  })

  it('applies default recommended order with featured and must-read first', () => {
    const sorted = sortArticles(articles, 'recommended')

    expect(sorted[0]?.featured).toBe(true)
    expect(sorted[0]?.mustRead).toBe(true)
    expect(sorted[0]?.rating).toBe('S+')
  })

  it('filters by keyword, category, tags, rating, and language together', () => {
    const filtered = filterArticles(articles, {
      q: 'context',
      category: 'Concurrency',
      tags: ['context'],
      rating: ['S+'],
      sort: 'recommended',
      lang: 'en',
      page: 1
    })

    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.id).toBe('go-context')
  })

  it('keeps pagination bounded when requested page exceeds result count', () => {
    const sorted = sortArticles(articles, 'recommended')
    const page = paginateArticles(sorted, 99, 12)

    expect(page.totalPages).toBeGreaterThan(1)
    expect(page.currentPage).toBe(page.totalPages)
    expect(page.items.length).toBeGreaterThan(0)
  })
})
