import { mkdir, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DEFAULT_SEARCH_STATE,
  filterArticles,
  getArticleStats,
  groupTagsByCount,
  paginateArticles,
  sortArticles,
  type ArticleItem
} from '../src/lib/articles'
import { loadArticles, loadStaticPageDocument, loadTopicDocuments, type TopicDocument } from '../src/lib/content'
import {
  BUTTON_RECT_GHOST_CLASS,
  BUTTON_RECT_PRIMARY_CLASS,
  buildTagHref,
  BUTTON_GHOST_CLASS,
  BUTTON_PRIMARY_CLASS,
  escapeHtml,
  PAGE_SHELL_CLASS,
  PANEL_CLASS,
  renderArticleGrid,
  renderPagination,
  renderStat,
  SECTION_EYEBROW_CLASS,
  SUBTLE_PANEL_CLASS
} from '../src/lib/render'
import {
  GITHUB_URL,
  PAGE_SIZE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  SORT_OPTION_LABELS,
  TOPIC_CATEGORY_SLUGS,
  formatDate,
  slugify,
  toCanonicalUrl,
  type Rating
} from '../src/lib/site'

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)))
const generatedTargets = ['index.html', 'articles', 'topics', 'tags', 'about', 'contribute'] as const

type Meta = {
  title: string
  description: string
  pageId: string
}

type TopicViewModel = TopicDocument & {
  articles: ArticleItem[]
}

const CURRENT_YEAR = new Date().getFullYear()
const LOGO_SRC = '/src/static/images/logo.png'
const LOGO_256_SRC = '/logo-256.png'
const GITHUB_ICON_DARK_SRC = '/src/static/svgs/logo-github-dark.svg'
const GITHUB_ICON_LIGHT_SRC = '/src/static/svgs/logo-github-light.svg'
const THEME_ICON_MOON_SRC = '/src/static/svgs/moon.svg'
const THEME_ICON_SUN_SRC = '/src/static/svgs/sun.svg'
const ICP_FILING_URL = 'https://beian.miit.gov.cn/'
const ICP_FILING_LABEL = 'ICP备案号待补充'
const HOME_BUTTON_PRIMARY_CLASS = BUTTON_PRIMARY_CLASS
  .replace('rounded-full', 'rounded-lg')
  .replace('duration-200', 'duration-500')
  .replace('hover:-translate-y-0.5', 'hover:-translate-y-px')
const HOME_BUTTON_GHOST_CLASS = BUTTON_GHOST_CLASS
  .replace('rounded-full', 'rounded-lg')
  .replace('duration-200', 'duration-500')
  .replace('hover:-translate-y-0.5', 'hover:-translate-y-px')
const FILTER_LABEL_CLASS = 'block text-[0.88rem] font-medium tracking-[0.08em] text-[color:var(--text-soft)]'
const FILTER_INPUT_CLASS = 'h-12 w-full rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] px-4 text-sm text-[color:var(--text)] outline-none transition duration-500 placeholder:text-[color:var(--text-muted)] focus:border-[color:var(--line-strong)] focus:bg-[color:var(--surface-strong)]'
const FILTER_SELECT_TRIGGER_CLASS = `${FILTER_INPUT_CLASS} inline-flex items-center justify-between gap-4 pr-3 text-left`
const FILTER_SELECT_MENU_CLASS = 'pointer-events-none absolute top-[calc(100%+0.55rem)] left-0 right-0 z-20 max-h-72 overflow-y-auto rounded-lg border border-[color:var(--line)] bg-[color:var(--panel)] p-2 opacity-0 shadow-[var(--shadow-soft)] transition duration-500 translate-y-2 data-[open=true]:pointer-events-auto data-[open=true]:translate-y-0 data-[open=true]:opacity-100'
const FILTER_CHIP_CLASS = 'inline-flex min-h-10 items-center justify-center rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] px-4 text-sm text-[color:var(--text-soft)] transition duration-500 group-hover:-translate-y-px group-hover:border-[color:var(--line-strong)] group-hover:bg-[color:var(--surface-strong)] peer-checked:border-[color:var(--accent)] peer-checked:bg-[color:color-mix(in_oklab,var(--accent)_18%,transparent)] peer-checked:text-[color:var(--text)] peer-checked:shadow-[0_0_0_1px_color-mix(in_oklab,var(--accent)_35%,transparent)]'

async function cleanGeneratedTargets() {
  await Promise.all(
    generatedTargets.map(async (target) => {
      const targetPath = join(rootDir, target)
      if (existsSync(targetPath)) {
        await rm(targetPath, { recursive: true, force: true })
      }
    })
  )
}

function serializePageData(data: unknown): string {
  return JSON.stringify(data).replaceAll('</script', '<\\/script')
}

function renderShell(meta: Meta, content: string, pathname: string, pageData?: unknown): string {
  const canonical = toCanonicalUrl(pathname)
  const isHome = meta.pageId === 'home'
  const shellClass = isHome
    ? 'flex min-h-svh max-h-svh flex-col overflow-hidden'
    : 'flex min-h-svh flex-col'
  const mainClass = isHome
    ? 'flex flex-1 items-center overflow-hidden'
    : 'flex-1 py-8 md:py-12'
  const pageDataScript = pageData
    ? `<script id="page-data" type="application/json">${serializePageData(pageData)}</script>`
    : ''
  const floatingUi = isHome
    ? ''
    : `
    <button class="pointer-events-none fixed right-4 bottom-4 z-40 inline-flex min-h-11 items-center justify-center rounded-lg border border-[color:var(--line)] bg-[color:var(--panel)] px-4 text-sm text-[color:var(--text-soft)] opacity-0 shadow-[var(--shadow-soft)] transition duration-500 hover:border-[color:var(--line-strong)] hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] md:right-6 md:bottom-6" type="button" aria-label="&#x8FD4;&#x56DE;&#x9876;&#x90E8;" data-back-to-top>&#x8FD4;&#x56DE;&#x9876;&#x90E8;</button>
    <div class="pointer-events-none fixed top-3 left-1/2 z-40 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-[color:var(--line)] bg-[color:var(--panel)] px-4 py-3 text-center text-sm text-[color:var(--text)] opacity-0 shadow-[var(--shadow-soft)] transition duration-300 md:top-4" aria-live="polite" data-toast></div>`

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(meta.title)}</title>
    <meta name="description" content="${escapeHtml(meta.description)}" />
    <meta name="theme-color" content="#11161a" />
    <meta name="robots" content="index,follow,max-image-preview:large" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:title" content="${escapeHtml(meta.title)}" />
    <meta property="og:description" content="${escapeHtml(meta.description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${SITE_URL}/logo-256.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(meta.title)}" />
    <meta name="twitter:description" content="${escapeHtml(meta.description)}" />
    <meta name="twitter:image" content="${SITE_URL}/logo-256.png" />
    <link rel="canonical" href="${canonical}" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <script type="application/ld+json">
      {${JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}${LOGO_256_SRC}`,
        sameAs: [GITHUB_URL]
      }).slice(1, -1)}}
    </script>
    <script type="application/ld+json">
      {${JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL
      }).slice(1, -1)}}
    </script>
    <script>
      (() => {
        const key = 'gopheratlas-theme';
        const stored = localStorage.getItem(key);
        document.documentElement.dataset.theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
      })();
    </script>
    <link rel="stylesheet" href="/src/styles/main.css" />
  </head>
  <body data-page="${meta.pageId}" class="antialiased">
    <div class="${shellClass}">
      ${renderHeader(pathname)}
      <main class="${mainClass}">${content}</main>
      ${renderFooter(meta.pageId)}
    </div>
    ${floatingUi}
    ${pageDataScript}
    <script type="module" src="/src/scripts/app.ts"></script>
  </body>
</html>`
}

function renderHeader(pathname: string): string {
  const links = [
    { href: '/', label: '\u9996\u9875' },
    { href: '/articles/', label: '\u5168\u90e8\u6587\u7ae0', mobileLabel: '\u6587\u7ae0' },
    { href: '/topics/', label: '\u8bdd\u9898\u4e13\u533a', mobileLabel: '\u8bdd\u9898' }
  ]

  const navLinks = links.map((link) => {
    const isActive = link.href === '/'
      ? pathname === '/'
      : pathname === link.href || pathname.startsWith(link.href)
    const stateClass = isActive
      ? 'text-[color:var(--text)] after:bg-[color:var(--accent-strong)]'
      : 'text-[color:var(--text-soft)] after:bg-transparent hover:text-[color:var(--text)] hover:after:bg-[color:var(--line-strong)]'
    const mobileLabel = link.mobileLabel ?? link.label

    return `<a class="relative inline-flex min-h-10 shrink-0 items-center justify-center py-2 text-sm whitespace-nowrap transition duration-500 after:absolute after:right-0 after:bottom-0 after:left-0 after:h-px after:transition-colors after:duration-500 after:content-[''] md:min-h-[72px] md:px-1 md:py-0 ${stateClass}" href="${link.href}"><span class="md:hidden">${mobileLabel}</span><span class="hidden md:inline">${link.label}</span></a>`
  }).join('')

  const navIconClass = 'inline-flex h-11 w-11 shrink-0 items-center justify-center text-[color:var(--text-soft)] transition duration-500 hover:text-[color:var(--text)]'

  return `
    <header class="shrink-0 border-b border-[color:var(--line)]">
      <div class="${PAGE_SHELL_CLASS} relative flex h-[72px] items-center justify-between gap-6">
        <a class="flex min-w-0 items-center gap-3" href="/">
          <img class="h-9 w-9 object-contain" src="${LOGO_SRC}" alt="GopherAtlas logo" />
          <span class="min-w-0">
            <strong class="block truncate text-[0.98rem] font-semibold tracking-[0.02em] text-[color:var(--text)]">${SITE_NAME}</strong>
            <small class="hidden truncate text-[0.74rem] tracking-[0.08em] text-[color:var(--text-muted)] md:block">高质量 Go 技术文章精选导航</small>
          </span>
        </a>
        <button class="inline-flex min-h-10 items-center justify-center rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] px-4 text-sm text-[color:var(--text-soft)] transition duration-500 hover:-translate-y-px hover:border-[color:var(--line-strong)] hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--text)] md:hidden" type="button" aria-expanded="false" aria-controls="primary-navigation" data-menu-toggle>
          \u83dc\u5355
        </button>
        <nav class="hidden items-center justify-center gap-5 overflow-x-auto whitespace-nowrap ${PANEL_CLASS} absolute top-[calc(100%+0.75rem)] right-0 left-0 z-20 px-4 py-3 text-center md:static md:flex md:items-center md:gap-6 md:overflow-visible md:border-0 md:bg-transparent md:p-0 md:text-left md:shadow-none md:backdrop-blur-none" id="primary-navigation" data-site-nav>
          ${navLinks}
          <a class="${navIconClass} md:ml-2 md:hover:[filter:drop-shadow(0_0_16px_color-mix(in_srgb,var(--accent-glow)_42%,transparent))]" href="${GITHUB_URL}" target="_blank" rel="noreferrer" aria-label="GitHub">
            <img class="h-10 w-10 dark:hidden" src="${GITHUB_ICON_DARK_SRC}" alt="" />
            <img class="hidden h-10 w-10 dark:block" src="${GITHUB_ICON_LIGHT_SRC}" alt="" />
          </a>
          <button class="${navIconClass} md:hover:[filter:drop-shadow(0_0_14px_color-mix(in_srgb,var(--accent-glow)_34%,transparent))]" type="button" data-theme-toggle aria-label="\u5207\u6362\u4e3b\u9898" title="\u5207\u6362\u4e3b\u9898">
            <img class="h-5 w-5 dark:hidden" src="${THEME_ICON_MOON_SRC}" alt="" />
            <img class="hidden h-5 w-5 dark:block" src="${THEME_ICON_SUN_SRC}" alt="" />
          </button>
        </nav>
      </div>
    </header>
  `
}
function renderFooter(pageId: string): string {
  const wrapperClass = pageId === 'home'
    ? `${PAGE_SHELL_CLASS} flex flex-col gap-3 py-3 md:flex-row md:items-end md:justify-between md:py-4`
    : `${PAGE_SHELL_CLASS} flex flex-col gap-4 py-6 md:flex-row md:items-end md:justify-between md:py-8`

  const linkClass = 'text-sm text-[color:var(--text-soft)] transition duration-300 hover:text-[color:var(--accent-strong)]'

  return `
    <footer class="shrink-0 border-t border-[color:var(--line)]">
      <div class="${wrapperClass}">
        <div class="min-w-0 space-y-1.5">
          <p class="text-sm text-[color:var(--text)]">Copyright ${CURRENT_YEAR} GoFurry</p>
          <p class="text-sm text-[color:var(--text-muted)]">\u672c\u7f51\u7ad9\u5185\u5bb9\u91c7\u7528 CC-BY-NC 4.0 \u6388\u6743\u534f\u8bae</p>
        </div>
        <div class="space-y-1.5 text-left md:text-right">
          <a class="inline-flex text-sm text-[color:var(--text-muted)] transition duration-300 hover:text-[color:var(--accent-strong)]" href="${ICP_FILING_URL}" target="_blank" rel="noreferrer">${ICP_FILING_LABEL}</a>
          <div class="flex flex-wrap gap-x-5 gap-y-2 md:justify-end">
            <a class="${linkClass}" href="/contribute/">Contribute</a>
            <a class="${linkClass}" href="/about/">About</a>
            <a class="${linkClass}" href="${GITHUB_URL}" target="_blank" rel="noreferrer">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  `
}
function renderHeroStats(articles: ArticleItem[], topics: TopicViewModel[], tags: Array<{ name: string; count: number; slug: string }>) {
  const stats = [
    { label: '已收录文章', value: articles.length, delay: 120 },
    { label: '专题数量', value: topics.length, delay: 200 },
    { label: '标签数量', value: tags.length, delay: 280 },
    { label: '最后更新', value: formatDate(articles.map((article) => article.addedAt).sort().at(-1)), delay: 360 }
  ]

  return `
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      ${stats.map((stat) => `
        <div class="opacity-0 [animation:hero-rise_820ms_cubic-bezier(0.22,1,0.36,1)_forwards] motion-reduce:opacity-100 motion-reduce:[animation:none]" style="animation-delay:${stat.delay}ms">
          ${renderStat(stat.label, stat.value)}
        </div>
      `).join('')}
    </div>
  `
}

function renderTopicCards(topics: TopicViewModel[]): string {
  return `
    <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      ${topics.map((topic, index) => `
        <article class="${SUBTLE_PANEL_CLASS} flex h-full flex-col gap-4 px-6 py-6 opacity-0 [animation:hero-rise_820ms_cubic-bezier(0.22,1,0.36,1)_forwards] motion-reduce:opacity-100 motion-reduce:[animation:none]" style="animation-delay:${140 + (index * 90)}ms">
          <div class="flex items-center justify-between gap-4 text-[0.82rem] font-medium tracking-[0.08em] text-[color:var(--text-soft)]">
            <span>\u4e13\u9898</span>
            <span>${topic.articles.length} \u7bc7</span>
          </div>
          <div class="space-y-3">
            <h3 class="font-display text-[1.8rem] leading-[1.08] tracking-[-0.03em] text-[color:var(--text)]">
              <a class="transition hover:text-[color:var(--accent-strong)]" href="/topics/${topic.slug}/">${escapeHtml(topic.title)}</a>
            </h3>
            <p class="text-sm leading-7 text-[color:var(--text-soft)]">${escapeHtml(topic.summary)}</p>
          </div>
          <div class="mt-auto">
            <a class="${BUTTON_RECT_GHOST_CLASS}" href="/topics/${topic.slug}/">\u8fdb\u5165\u4e13\u9898</a>
          </div>
        </article>
      `).join('')}
    </div>
  `
}

function renderRatingLegend(): string {
  const items: Array<{ rating: Rating; description: string }> = [
    { rating: 'S+', description: '长期价值极高，建议优先阅读。' },
    { rating: 'S', description: '高质量核心文章，适合深入阅读。' },
    { rating: 'A+', description: '值得读，适合作为专题延伸。' },
    { rating: 'A', description: '质量稳定，适合作为补充阅读。' }
  ]

  return `
    <div class="grid gap-3 sm:grid-cols-2">
      ${items.map((item) => `
        <article class="${SUBTLE_PANEL_CLASS} space-y-4 px-5 py-5">
          <span class="inline-flex min-w-11 items-center justify-center rounded-full border border-[color:var(--line-strong)] bg-[color:var(--surface)] px-3 py-1 text-[0.68rem] font-mono tracking-[0.18em] text-[color:var(--text)]">${item.rating}</span>
          <p class="text-sm leading-7 text-[color:var(--text-soft)]">${escapeHtml(item.description)}</p>
        </article>
      `).join('')}
    </div>
  `
}

function renderPageHero(label: string, title: string, description: string, actions?: string): string {
  const actionMarkup = actions ? `<div class="flex flex-wrap gap-3 lg:justify-end">${actions}</div>` : ''

  return `
    <section class="grid gap-6 border-b border-[color:var(--line)] pb-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-8 md:pb-8">
      <div class="space-y-4">
        <span class="${SECTION_EYEBROW_CLASS}">${label}</span>
        <h1 class="max-w-4xl font-display text-[clamp(2.5rem,5vw,4.8rem)] leading-[0.94] tracking-[-0.05em] text-[color:var(--text)]">${title}</h1>
        <p class="max-w-3xl text-base leading-8 text-[color:var(--text-soft)]">${description}</p>
      </div>
      ${actionMarkup}
    </section>
  `
}

function renderCustomSelect(
  name: string,
  label: string,
  placeholder: string,
  options: Array<{ value: string; label: string }>
): string {
  return `
    <label class="space-y-2">
      <span class="${FILTER_LABEL_CLASS}">${label}</span>
      <div class="relative" data-custom-select data-name="${name}">
        <input type="hidden" name="${name}" value="" data-custom-select-input />
        <button class="${FILTER_SELECT_TRIGGER_CLASS}" type="button" aria-expanded="false" aria-haspopup="listbox" data-custom-select-trigger data-placeholder="${escapeHtml(placeholder)}">
          <span class="truncate" data-custom-select-value>${escapeHtml(placeholder)}</span>
          <span class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-strong)] text-[color:var(--text-muted)] transition duration-500" data-custom-select-icon>
            <svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3.25 5.75 8 10.5l4.75-4.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
        </button>
        <div class="${FILTER_SELECT_MENU_CLASS}" role="listbox" aria-label="${escapeHtml(label)}" data-custom-select-menu data-open="false">
          ${options.map((option) => `
            <button class="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-[color:var(--text-soft)] transition duration-500 hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--text)] data-[selected=true]:bg-[color:color-mix(in_oklab,var(--accent)_18%,transparent)] data-[selected=true]:text-[color:var(--text)]" type="button" role="option" data-custom-select-option data-selected="false" data-value="${escapeHtml(option.value)}" data-label="${escapeHtml(option.label)}" aria-selected="false">
              <span>${escapeHtml(option.label)}</span>
              <span class="text-xs text-[color:var(--text-muted)] opacity-0 transition duration-500 data-[selected=true]:opacity-100">\u5df2\u9009</span>
            </button>
          `).join('')}
        </div>
      </div>
    </label>
  `
}

function renderFilterPanel(categories: string[], tags: Array<{ name: string; count: number }>) {
  const ratings: Rating[] = ['S+', 'S', 'A+', 'A', 'B+', 'B', 'C+', 'C']
  const sortOptions = Object.entries(SORT_OPTION_LABELS).map(([value, label]) => ({ value, label }))
  const categoryOptions = [{ value: '', label: '\u5168\u90e8\u5206\u7c7b' }, ...categories.map((category) => ({ value: category, label: category }))]
  const languageOptions = [
    { value: '', label: '\u5168\u90e8\u8bed\u8a00' },
    { value: 'zh', label: '\u4e2d\u6587' },
    { value: 'en', label: 'English' }
  ]

  return `
    <section class="${PANEL_CLASS} px-6 py-6 md:px-8 md:py-8">
      <div class="flex items-start justify-between gap-3 border-b border-[color:var(--line)] pb-6">
        <div class="min-w-0 space-y-3">
          <span class="${SECTION_EYEBROW_CLASS}">Search tools</span>
          <h2 class="font-display text-[clamp(1.55rem,2.5vw,2.2rem)] leading-[1.02] tracking-[-0.04em] text-[color:var(--text)]">\u6587\u7ae0\u7b5b\u9009</h2>
        </div>
        <button class="${BUTTON_RECT_GHOST_CLASS} shrink-0 px-4" type="button" data-copy-current-link>\u590d\u5236\u94fe\u63a5</button>
      </div>
      <form class="mt-6 space-y-6" action="/articles/" method="get" data-article-form>
        <div class="grid gap-4 xl:grid-cols-4">
          <label class="space-y-2">
            <span class="${FILTER_LABEL_CLASS}">\u5173\u952e\u8bcd</span>
            <input class="${FILTER_INPUT_CLASS}" type="search" name="q" placeholder="\u641c\u7d22\u6807\u9898\u3001\u6807\u7b7e\u3001\u4f5c\u8005\u6216\u63a8\u8350\u7406\u7531" />
          </label>
          ${renderCustomSelect('category', '\u5206\u7c7b', '\u5168\u90e8\u5206\u7c7b', categoryOptions)}
          ${renderCustomSelect('lang', '\u8bed\u8a00', '\u5168\u90e8\u8bed\u8a00', languageOptions)}
          ${renderCustomSelect('sort', '\u6392\u5e8f', SORT_OPTION_LABELS.recommended, sortOptions)}
        </div>
        <div class="grid gap-6 border-t border-[color:var(--line)] pt-6">
          <fieldset class="space-y-3">
            <legend class="${FILTER_LABEL_CLASS}">\u8bc4\u7ea7</legend>
            <div class="flex flex-wrap gap-2.5">
              ${ratings.map((rating) => `
                <label class="group relative cursor-pointer">
                  <input class="peer sr-only" type="checkbox" name="rating" value="${rating}" />
                  <span class="${FILTER_CHIP_CLASS}">${rating}</span>
                </label>
              `).join('')}
            </div>
          </fieldset>
          <fieldset class="space-y-3 border-t border-[color:var(--line)] pt-6">
            <legend class="${FILTER_LABEL_CLASS}">\u6807\u7b7e</legend>
            <div class="flex flex-wrap gap-2.5" data-tag-list data-initial-visible="30" data-step="10">
              ${tags.map((tag, index) => `
                <label class="group relative cursor-pointer" data-tag-item data-tag-index="${index}">
                  <input class="peer sr-only" type="checkbox" name="tags" value="${escapeHtml(tag.name)}" />
                  <span class="${FILTER_CHIP_CLASS} gap-2">
                    ${escapeHtml(tag.name)}
                    <small class="text-[color:var(--text-muted)]">${tag.count}</small>
                  </span>
                </label>
              `).join('')}
            </div>
            ${tags.length > 30 ? `<div class="mt-2 flex flex-col items-center gap-2"><button class="${BUTTON_RECT_GHOST_CLASS} px-4" type="button" data-load-more-tags>\u52a0\u8f7d\u66f4\u591a</button><p class="hidden text-sm text-[color:var(--text-muted)]" data-tag-list-complete>\u5df2\u5c55\u793a\u5168\u90e8\u6807\u7b7e</p></div>` : ''}
          </fieldset>
        </div>
        <div class="flex flex-wrap gap-3">
          <button class="${BUTTON_RECT_PRIMARY_CLASS}" type="submit">\u5e94\u7528\u7b5b\u9009</button>
          <button class="${BUTTON_RECT_GHOST_CLASS}" type="button" data-reset-filters>\u91cd\u7f6e\u6761\u4ef6</button>
        </div>
      </form>
    </section>
  `
}

function renderHomePage(): string {
  return renderShell(
    {
      title: `${SITE_NAME} | \u9ad8\u8d28\u91cf Go \u6280\u672f\u6587\u7ae0\u7cbe\u9009\u5bfc\u822a`,
      description: SITE_DESCRIPTION,
      pageId: 'home'
    },
    `
      <section class="${PAGE_SHELL_CLASS} py-6 md:py-8">
        <div class="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.68fr)] lg:gap-16 xl:gap-20">
          <div class="max-w-[44rem] space-y-8">
            <span class="inline-flex items-center gap-2 font-mono text-[0.9rem] tracking-[0.12em] text-[color:var(--text-muted)] opacity-0 [animation:hero-rise_780ms_cubic-bezier(0.22,1,0.36,1)_forwards] [animation-delay:80ms] md:text-[1rem]">Golang or go home?</span>
            <div class="space-y-6 opacity-0 [animation:hero-rise_780ms_cubic-bezier(0.22,1,0.36,1)_forwards] [animation-delay:180ms]">
              <h1 class="home-wordmark text-[clamp(3.3rem,8.5vw,8.05rem)] leading-[0.97] text-[color:var(--text)]">${SITE_NAME}</h1>
              <p class="max-w-2xl text-[1rem] leading-8 text-[color:var(--text-soft)] md:text-[1.05rem] md:leading-9">精选高质量 Go 技术文章，按专题、标签与评级整理，帮助开发者更快找到值得阅读的内容。</p>
            </div>
            <div class="flex flex-wrap gap-3">
              <a class="${HOME_BUTTON_PRIMARY_CLASS} opacity-0 [animation:hero-rise_780ms_cubic-bezier(0.22,1,0.36,1)_forwards] [animation-delay:300ms]" href="/articles/">\u6d4f\u89c8\u5168\u90e8\u6587\u7ae0</a>
              <a class="${HOME_BUTTON_GHOST_CLASS} opacity-0 [animation:hero-rise_780ms_cubic-bezier(0.22,1,0.36,1)_forwards] [animation-delay:380ms]" href="/topics/">\u8fdb\u5165\u4e13\u9898\u603b\u89c8</a>
            </div>
          </div>
          <div class="hidden lg:flex lg:items-center lg:justify-end lg:pr-[clamp(1.75rem,4vw,4rem)]">
            <div class="home-hero__stage">
              <div class="home-hero__halo"></div>
              <div class="home-hero__ornaments"></div>
              <img class="home-hero__logo" src="${LOGO_SRC}" alt="" />
            </div>
          </div>
        </div>
      </section>
    `,
    '/'
  )
}
function renderTopicsIndexPage(topics: TopicViewModel[], articles: ArticleItem[]): string {
  return renderShell(
    {
      title: `\u8bdd\u9898\u4e13\u533a | ${SITE_NAME}`,
      description: '\u4e0d\u77e5\u9053\u60f3\u8bfb\u4e9b\u4ec0\u4e48\u6587\u7ae0\uff1f\u4e0d\u59a8\u4ece\u4e13\u9898\u5206\u533a\u5165\u624b\u3002',
      pageId: 'topics'
    },
    `
      <div class="${PAGE_SHELL_CLASS} space-y-10 md:space-y-14">
        ${renderPageHero(
          'Topics',
          '\u8bdd\u9898\u4e13\u533a',
          '\u4e0d\u77e5\u9053\u60f3\u8bfb\u4e9b\u4ec0\u4e48\u6587\u7ae0\uff1f\u4e0d\u59a8\u4ece\u4e13\u9898\u5206\u533a\u5165\u624b\u3002',
          `<a class="${BUTTON_RECT_PRIMARY_CLASS}" href="/articles/">\u5728\u6587\u7ae0\u9875\u7b5b\u9009</a>
           <button class="${BUTTON_RECT_GHOST_CLASS}" type="button" data-copy-current-link>\u590d\u5236\u94fe\u63a5</button>`
        )}
        <section class="space-y-6">
          <div class="space-y-3">
            <span class="${SECTION_EYEBROW_CLASS}">Directory</span>
            <h2 class="font-display text-[clamp(1.9rem,3vw,3rem)] leading-[1.02] tracking-[-0.04em] text-[color:var(--text)]">${topics.length} \u4e2a\u8bdd\u9898 - ${articles.length} \u7bc7\u7cbe\u9009\u6587\u7ae0</h2>
            <p class="max-w-3xl text-base leading-8 text-[color:var(--text-soft)]">\u6bcf\u4e2a\u8bdd\u9898\u90fd\u5e26\u6709\u5bfc\u8bfb\uff0c\u65b9\u4fbf\u4f60\u5feb\u901f\u878d\u5165\u8bdd\u9898\u3002</p>
          </div>
          ${renderTopicCards(topics)}
        </section>
      </div>
    `,
    '/topics/'
  )
}

function renderArticlesPage(articles: ArticleItem[]) {
  const stats = getArticleStats(articles)
  const sorted = sortArticles(filterArticles(articles, DEFAULT_SEARCH_STATE), 'recommended')
  const paginated = paginateArticles(sorted, 1)

  return renderShell(
    {
      title: `\u5168\u90e8\u6587\u7ae0 | ${SITE_NAME}`,
      description: '\u641c\u7d22\u3001\u7b5b\u9009\u548c\u6392\u5e8f\u6240\u6709\u5df2\u6536\u5f55\u7684 Go \u9ad8\u8d28\u91cf\u6587\u7ae0\u3002',
      pageId: 'articles'
    },
    `
      <div class="${PAGE_SHELL_CLASS} space-y-8 md:space-y-10">
        ${renderPageHero(
          'Articles',
          '\u5168\u90e8\u6587\u7ae0',
          '\u8fd9\u91cc\u6536\u5f55\u4e86\u5927\u91cf\u7684\u4f18\u8d28\u6587\u7ae0\uff0c\u4f60\u53ef\u4ee5\u5728\u9605\u8bfb\u4e2d\u501f\u9274\u4ed6\u4eba\u7684\u601d\u8def\u3001\u63d0\u5347\u81ea\u5df1\u7684\u4ee3\u7801\u54c1\u5473\u6216\u6293\u4f4f\u7075\u611f\u7684\u706b\u82b1\u3002',
          renderHeroStats(articles, [], groupTagsByCount(articles))
        )}
        ${renderFilterPanel(stats.categories, groupTagsByCount(articles))}
        <section class="space-y-6" data-results-section>
          <div class="flex flex-col gap-4 border-b border-[color:var(--line)] pb-5 md:flex-row md:items-end md:justify-between">
            <p class="text-base text-[color:var(--text-soft)]">\u5df2\u627e\u5230 <strong class="font-semibold text-[color:var(--text)]" data-result-count>${sorted.length}</strong> \u7bc7\u6587\u7ae0</p>
            <a class="${BUTTON_RECT_GHOST_CLASS}" href="/">\u8fd4\u56de\u9996\u9875</a>
          </div>
          <div data-article-results>
            ${renderArticleGrid(paginated.items, '\u6682\u65e0\u7b26\u5408\u6761\u4ef6\u7684\u6587\u7ae0\u3002')}
          </div>
          <div data-pagination>
            ${renderPagination(paginated.currentPage, paginated.totalPages, DEFAULT_SEARCH_STATE)}
          </div>
        </section>
      </div>
    `,
    '/articles/',
    {
      articles,
      pageSize: PAGE_SIZE
    }
  )
}

function renderTopicPage(topic: TopicViewModel) {
  const sortedTopicArticles = sortArticles(topic.articles, 'recommended')

  return renderShell(
    {
      title: `${topic.title} | ${SITE_NAME}`,
      description: topic.summary,
      pageId: 'topic'
    },
    `
      <div class="${PAGE_SHELL_CLASS} space-y-10 md:space-y-14">
        ${renderPageHero(
          'Topic',
          escapeHtml(topic.title),
          escapeHtml(topic.summary),
          `<a class="${BUTTON_RECT_PRIMARY_CLASS}" href="/articles/?category=${encodeURIComponent(topic.articles[0]?.category ?? topic.title)}">\u5728\u6587\u7ae0\u9875\u7b5b\u9009</a>
           <button class="${BUTTON_RECT_GHOST_CLASS}" type="button" data-copy-current-link>\u590d\u5236\u4e13\u9898\u94fe\u63a5</button>`
        )}
        <section>
          <article class="${PANEL_CLASS} markdown-body px-6 py-6 md:px-8 md:py-8">
            <span class="block text-[0.92rem] font-medium tracking-[0.08em] text-[color:var(--text-soft)]">\u4e13\u9898\u5bfc\u8bfb</span>
            <div class="mt-5">
              ${topic.body}
            </div>
          </article>
        </section>
        <section class="space-y-6">
          <div class="space-y-3">
            <span class="block text-[0.92rem] font-medium tracking-[0.08em] text-[color:var(--text-soft)]">\u4e13\u9898\u6587\u7ae0</span>
            <h2 class="font-display text-[clamp(1.9rem,3vw,3rem)] leading-[1.04] tracking-[-0.04em] text-[color:var(--text)]">${topic.articles.length} \u7bc7\u7cbe\u9009\u6587\u7ae0</h2>
          </div>
          ${renderArticleGrid(sortedTopicArticles, '\u5f53\u524d\u4e13\u9898\u6682\u65e0\u6587\u7ae0\u3002')}
        </section>
      </div>
    `,
    `/topics/${topic.slug}/`
  )
}

function renderTagPage(tagName: string, articles: ArticleItem[]): string {
  return renderShell(
    {
      title: `\u6807\u7b7e\uff1a${tagName} | ${SITE_NAME}`,
      description: `\u67e5\u770b\u4e0e ${tagName} \u76f8\u5173\u7684 Go \u7cbe\u9009\u6587\u7ae0\u3002`,
      pageId: 'tag'
    },
    `
      <div class="${PAGE_SHELL_CLASS} space-y-10 md:space-y-14">
        ${renderPageHero(
          'Tag',
          escapeHtml(tagName),
          `\u5f53\u524d\u6807\u7b7e\u4e0b\u5171\u6536\u5f55 ${articles.length} \u7bc7\u6587\u7ae0`,
          `<a class="${BUTTON_RECT_PRIMARY_CLASS}" href="/articles/?tags=${encodeURIComponent(tagName)}">\u5728\u6587\u7ae0\u9875\u7b5b\u9009</a>
           <button class="${BUTTON_RECT_GHOST_CLASS}" type="button" data-copy-current-link>\u590d\u5236\u6807\u7b7e\u94fe\u63a5</button>`
        )}
        <section>
          ${renderArticleGrid(sortArticles(articles, 'recommended'), '\u5f53\u524d\u6807\u7b7e\u6682\u65e0\u6587\u7ae0\u3002')}
        </section>
      </div>
    `,
    buildTagHref(tagName)
  )
}

function renderMarkdownPage(title: string, description: string, body: string, pathname: string, pageId: string): string {
  return renderShell(
    {
      title: `${title} | ${SITE_NAME}`,
      description,
      pageId
    },
    `
      <div class="${PAGE_SHELL_CLASS} space-y-10 md:space-y-14">
        ${renderPageHero(pageId === 'about' ? 'About' : 'Contribute', escapeHtml(title), escapeHtml(description))}
        <section>
          <article class="${PANEL_CLASS} markdown-body px-6 py-6 md:px-8 md:py-8">
            ${body}
          </article>
        </section>
      </div>
    `,
    pathname
  )
}

async function writePage(relativePath: string, html: string) {
  const targetPath = join(rootDir, relativePath)
  await mkdir(dirname(targetPath), { recursive: true })
  await writeFile(targetPath, html, 'utf8')
}

async function writeSitemap(paths: string[]) {
  const uniquePaths = [...new Set(paths)]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniquePaths.map((pathname) => `  <url><loc>${toCanonicalUrl(pathname)}</loc></url>`).join('\n')}
</urlset>
`

  await mkdir(join(rootDir, 'public'), { recursive: true })
  await writeFile(join(rootDir, 'public', 'sitemap.xml'), xml, 'utf8')
}

async function main() {
  await cleanGeneratedTargets()

  const articles = loadArticles()
  const topicDocuments = await loadTopicDocuments(rootDir)
  const aboutPage = await loadStaticPageDocument(rootDir, 'about')
  const contributePage = await loadStaticPageDocument(rootDir, 'contribute')
  const tagGroups = groupTagsByCount(articles)
  const topicMap = new Map(topicDocuments.map((topic) => [topic.slug, topic]))

  const topicPages: TopicViewModel[] = TOPIC_CATEGORY_SLUGS.map((slug) => {
    const topic = topicMap.get(slug)
    if (!topic) {
      throw new Error(`Missing topic document for slug: ${slug}`)
    }

    const topicArticles = articles.filter((article) => slugify(article.category) === slug)
    return {
      ...topic,
      articles: sortArticles(topicArticles, 'recommended')
    }
  })

  const allRoutes = ['/', '/articles/', '/topics/', '/about/', '/contribute/']

  await writePage('index.html', renderHomePage())
  await writePage('articles/index.html', renderArticlesPage(articles))
  await writePage('topics/index.html', renderTopicsIndexPage(topicPages, articles))
  await writePage('about/index.html', renderMarkdownPage(aboutPage.title, aboutPage.description, aboutPage.body, '/about/', 'about'))
  await writePage('contribute/index.html', renderMarkdownPage(contributePage.title, contributePage.description, contributePage.body, '/contribute/', 'contribute'))

  for (const topic of topicPages) {
    allRoutes.push(`/topics/${topic.slug}/`)
    await writePage(`topics/${topic.slug}/index.html`, renderTopicPage(topic))
  }

  for (const tag of tagGroups) {
    const relatedArticles = articles.filter((article) => article.tags.includes(tag.name))
    const route = `/tags/${tag.slug}/`
    allRoutes.push(route)
    await writePage(`tags/${tag.slug}/index.html`, renderTagPage(tag.name, relatedArticles))
  }

  await writeSitemap(allRoutes)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
