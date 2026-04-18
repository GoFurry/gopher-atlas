import { getCategorySlug, stringifySearchState, type ArticleItem, type ArticleSearchState } from './articles'
import {
  DIFFICULTY_LABELS,
  LANGUAGE_LABELS,
  PAGE_SIZE,
  TOPIC_CATEGORY_SLUGS,
  formatDate,
  slugify,
  type Rating
} from './site'

export const PAGE_SHELL_CLASS = 'mx-auto w-[min(1160px,calc(100vw-1.5rem))] md:w-[min(1440px,calc(100vw-3rem))]'
export const SECTION_EYEBROW_CLASS = 'inline-flex items-center gap-2 text-[0.68rem] font-mono uppercase tracking-[0.24em] text-[color:var(--text-muted)]'
export const BUTTON_BASE_CLASS = 'inline-flex min-h-11 items-center justify-center rounded-full border px-5 text-sm transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent'
export const BUTTON_PRIMARY_CLASS = `${BUTTON_BASE_CLASS} border-[color:var(--line-strong)] bg-[color:var(--button-strong)] text-[color:var(--button-strong-text)] hover:-translate-y-0.5 hover:border-[color:var(--line-strong)] hover:bg-[color:var(--button-strong-hover)]`
export const BUTTON_GHOST_CLASS = `${BUTTON_BASE_CLASS} border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--text-soft)] hover:-translate-y-0.5 hover:border-[color:var(--line-strong)] hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--text)]`
export const BUTTON_RECT_BASE_CLASS = 'inline-flex min-h-11 items-center justify-center rounded-lg border px-5 text-sm transition duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent'
export const BUTTON_RECT_PRIMARY_CLASS = `${BUTTON_RECT_BASE_CLASS} border-[color:var(--line-strong)] bg-[color:var(--button-strong)] text-[color:var(--button-strong-text)] hover:-translate-y-px hover:border-[color:var(--line-strong)] hover:bg-[color:var(--button-strong-hover)]`
export const BUTTON_RECT_GHOST_CLASS = `${BUTTON_RECT_BASE_CLASS} border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--text-soft)] hover:-translate-y-px hover:border-[color:var(--line-strong)] hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--text)]`
export const PANEL_CLASS = 'rounded-[22px] border border-[color:var(--line)] bg-[color:var(--panel)] shadow-[var(--shadow-soft)] backdrop-blur-xl'
export const SUBTLE_PANEL_CLASS = 'rounded-[18px] border border-[color:var(--line)] bg-[color:var(--panel-soft)] shadow-none backdrop-blur-xl'

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

function getRatingBadgeClass(rating: Rating): string {
  const base = 'inline-flex min-w-12 items-center justify-center rounded-lg border px-3.5 py-1.5 text-[0.72rem] font-mono tracking-[0.18em] text-white/90'

  switch (rating) {
    case 'S+':
      return `${base} border-emerald-300/30 bg-emerald-400/18 text-emerald-100`
    case 'S':
      return `${base} border-teal-300/28 bg-teal-400/15 text-teal-100`
    case 'A+':
      return `${base} border-sky-300/28 bg-sky-400/14 text-sky-100`
    case 'A':
      return `${base} border-stone-300/28 bg-stone-300/12 text-[color:var(--text)]`
    case 'B+':
      return `${base} border-amber-300/30 bg-amber-400/14 text-amber-100`
    case 'B':
      return `${base} border-zinc-300/22 bg-zinc-400/10 text-[color:var(--text-soft)]`
    case 'C+':
      return `${base} border-orange-300/24 bg-orange-400/11 text-orange-100`
    case 'C':
      return `${base} border-rose-300/22 bg-rose-400/10 text-rose-100`
    case 'D+':
      return `${base} border-fuchsia-300/20 bg-fuchsia-400/9 text-fuchsia-100`
    case 'D':
      return `${base} border-slate-300/18 bg-slate-400/8 text-slate-100`
    default:
      return `${base} border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--text-soft)]`
  }
}

export function renderArticleCard(article: ArticleItem): string {
  const authorLine = [article.author, article.source].filter(Boolean).join(' · ')
  const publishedLine = article.publishedAt
    ? `\u539f\u6587\u53d1\u5e03\u4e8e ${escapeHtml(formatDate(article.publishedAt))}`
    : '\u539f\u6587\u53d1\u5e03\u65e5\u671f\u672a\u6ce8\u660e'

  return `
    <article class="border-t border-[color:var(--line)] pt-8 first:border-t-0 first:pt-0">
      <div class="space-y-5">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <a class="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] px-3.5 py-2 text-[0.76rem] font-medium tracking-[0.08em] text-[color:var(--accent)] transition duration-500 hover:-translate-y-px hover:border-[color:var(--line-strong)] hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--accent-strong)]" href="${buildTopicHref(article.category)}">${escapeHtml(article.category)}</a>
          <span class="${getRatingBadgeClass(article.rating)}">${escapeHtml(article.rating)}</span>
        </div>
        <div class="space-y-3">
          <h3 class="max-w-4xl font-display text-[clamp(1.7rem,2.5vw,2.25rem)] leading-[1.06] tracking-[-0.03em] text-[color:var(--text)]">
            <a class="transition hover:text-[color:var(--accent-strong)]" href="${escapeHtml(article.url)}" target="_blank" rel="noreferrer">${escapeHtml(article.title)}</a>
          </h3>
          <p class="max-w-3xl text-base leading-8 text-[color:var(--text-soft)]">${escapeHtml(article.summary)}</p>
        </div>
        <div class="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[color:var(--text-muted)]">
          <span>${escapeHtml(authorLine || '\u4f5c\u8005 / \u6765\u6e90\u672a\u6ce8\u660e')}</span>
          <span>${escapeHtml(publishedLine)}</span>
          <span>${escapeHtml(LANGUAGE_LABELS[article.language])} · ${escapeHtml(DIFFICULTY_LABELS[article.difficulty])}</span>
        </div>
        <p class="max-w-4xl text-base leading-8 text-[color:var(--text-soft)]"><strong class="font-semibold text-[color:var(--text)]">\u6536\u5f55\u7406\u7531\uff1a</strong>${escapeHtml(article.reason)}</p>
        <div class="flex flex-wrap gap-2.5">
          ${article.tags.map((tag) => `<a class="inline-flex items-center rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] px-3.5 py-2 text-sm text-[color:var(--text-soft)] transition duration-500 hover:-translate-y-px hover:border-[color:var(--line-strong)] hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--text)]" href="${buildTagHref(tag)}">${escapeHtml(tag)}</a>`).join('')}
        </div>
        <div class="flex flex-wrap gap-3">
          <a class="${BUTTON_RECT_PRIMARY_CLASS}" href="${escapeHtml(article.url)}" target="_blank" rel="noreferrer">\u9605\u8bfb\u5168\u6587</a>
          <button class="${BUTTON_RECT_GHOST_CLASS}" type="button" data-copy-text="${escapeHtml(article.url)}">\u590d\u5236\u539f\u6587\u94fe\u63a5</button>
        </div>
      </div>
    </article>
  `
}

export function renderArticleGrid(items: ArticleItem[], emptyMessage: string): string {
  if (items.length === 0) {
    return `<div class="${SUBTLE_PANEL_CLASS} px-6 py-8 text-base leading-8 text-[color:var(--text-soft)]"><p>${escapeHtml(emptyMessage)}</p></div>`
  }

  return `<div class="space-y-10">${items.map((item) => renderArticleCard(item)).join('')}</div>`
}

export function renderPagination(currentPage: number, totalPages: number, state: ArticleSearchState): string {
  if (totalPages <= 1) {
    return ''
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  return `
    <nav class="mt-10 flex flex-wrap justify-center gap-2" aria-label="\u6587\u7ae0\u5206\u9875">
      ${pages.map((page) => {
        const href = `/articles/${stringifySearchState({ ...state, page })}`
        const classes = page === currentPage
          ? 'border-[color:var(--line-strong)] bg-[color:var(--surface-strong)] text-[color:var(--text)]'
          : 'border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--text-soft)] hover:border-[color:var(--line-strong)] hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--text)]'

        return `<a class="inline-flex min-w-10 items-center justify-center rounded-lg border px-3 py-2 text-sm transition duration-500 ${classes}" href="${href}" data-page-link="${page}">${page}</a>`
      }).join('')}
    </nav>
  `
}

export function renderStat(label: string, value: number | string): string {
  return `
    <div class="rounded-lg border border-[color:var(--line)] bg-[color:var(--panel-soft)] px-5 py-5 shadow-none backdrop-blur-xl">
      <span class="block font-display text-2xl leading-none tracking-[-0.03em] text-[color:var(--text)]">${escapeHtml(String(value))}</span>
      <span class="mt-3 block text-[0.84rem] font-medium tracking-[0.08em] text-[color:var(--text-soft)]">${escapeHtml(label)}</span>
    </div>
  `
}

export function renderTagLinks(tags: Array<{ name: string; slug: string; count: number }>, limit = PAGE_SIZE): string {
  return `
    <div class="flex flex-wrap gap-2.5">
      ${tags.slice(0, limit).map((tag) => `<a class="inline-flex items-center gap-2 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] px-3.5 py-2 text-sm text-[color:var(--text-soft)] transition duration-500 hover:-translate-y-px hover:border-[color:var(--line-strong)] hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--text)]" href="/tags/${tag.slug}/">${escapeHtml(tag.name)} <span class="text-[color:var(--text-muted)]">${tag.count}</span></a>`).join('')}
    </div>
  `
}
