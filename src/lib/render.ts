import { getCategorySlug, stringifySearchState, type ArticleItem, type ArticleSearchState } from './articles'
import {
  DIFFICULTY_LABELS,
  LANGUAGE_LABELS,
  PAGE_SIZE,
  TOPIC_CATEGORY_SLUGS,
  formatDate,
  slugify
} from './site'

export function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function buildTopicHref(category: string): string {
  const slug = getCategorySlug(category)
  if (TOPIC_CATEGORY_SLUGS.includes(slug as never)) {
    return `/topics/${slug}/`
  }

  return `/articles/${stringifySearchState({
    q: '',
    category,
    tags: [],
    rating: [],
    sort: 'recommended',
    lang: '',
    page: 1
  })}`
}

export function buildTagHref(tag: string): string {
  return `/tags/${slugify(tag)}/`
}

export function renderArticleCard(article: ArticleItem): string {
  const authorLine = [article.author, article.source].filter(Boolean).join(' · ')
  const publishedLine = article.publishedAt ? `原文发布于 ${escapeHtml(formatDate(article.publishedAt))}` : '原文发布日期未注明'

  return `
    <article class="article-card glass-card">
      <div class="article-card__header">
        <div class="article-card__eyebrow">
          <a class="article-card__category" href="${buildTopicHref(article.category)}">${escapeHtml(article.category)}</a>
          <span class="rating-badge rating-badge--${article.rating.toLowerCase().replace('+', 'plus')}">${escapeHtml(article.rating)}</span>
        </div>
        <h3 class="article-card__title">
          <a href="${escapeHtml(article.url)}" target="_blank" rel="noreferrer">${escapeHtml(article.title)}</a>
        </h3>
        <p class="article-card__summary">${escapeHtml(article.summary)}</p>
      </div>
      <div class="article-card__meta">
        <span>${escapeHtml(authorLine || '作者/来源未注明')}</span>
        <span>${escapeHtml(publishedLine)}</span>
        <span>${escapeHtml(LANGUAGE_LABELS[article.language])} · ${escapeHtml(DIFFICULTY_LABELS[article.difficulty])}</span>
      </div>
      <p class="article-card__reason"><strong>收录理由：</strong>${escapeHtml(article.reason)}</p>
      <div class="tag-row">
        ${article.tags.map((tag) => `<a class="tag-pill" href="${buildTagHref(tag)}">${escapeHtml(tag)}</a>`).join('')}
      </div>
      <div class="article-card__actions">
        <a class="button button--primary" href="${escapeHtml(article.url)}" target="_blank" rel="noreferrer">阅读全文</a>
        <button class="button button--ghost" type="button" data-copy-text="${escapeHtml(article.url)}">复制原文链接</button>
      </div>
    </article>
  `
}

export function renderArticleGrid(items: ArticleItem[], emptyMessage: string): string {
  if (items.length === 0) {
    return `<div class="empty-state glass-card"><p>${escapeHtml(emptyMessage)}</p></div>`
  }

  return `<div class="article-grid">${items.map((item) => renderArticleCard(item)).join('')}</div>`
}

export function renderPagination(currentPage: number, totalPages: number, state: ArticleSearchState): string {
  if (totalPages <= 1) {
    return ''
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  return `
    <nav class="pagination" aria-label="文章分页">
      ${pages.map((page) => {
        const href = `/articles/${stringifySearchState({ ...state, page })}`
        return `<a class="pagination__item${page === currentPage ? ' is-active' : ''}" href="${href}" data-page-link="${page}">${page}</a>`
      }).join('')}
    </nav>
  `
}

export function renderStat(label: string, value: number | string): string {
  return `
    <div class="stat-card glass-card">
      <span class="stat-card__value">${escapeHtml(String(value))}</span>
      <span class="stat-card__label">${escapeHtml(label)}</span>
    </div>
  `
}

export function renderTagLinks(tags: Array<{ name: string; slug: string; count: number }>, limit = PAGE_SIZE): string {
  return `
    <div class="tag-cloud">
      ${tags.slice(0, limit).map((tag) => `<a class="tag-pill" href="/tags/${tag.slug}/">${escapeHtml(tag.name)} <span>${tag.count}</span></a>`).join('')}
    </div>
  `
}
