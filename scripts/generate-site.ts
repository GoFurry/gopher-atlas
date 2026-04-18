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
  buildTagHref,
  BUTTON_GHOST_CLASS,
  BUTTON_PRIMARY_CLASS,
  escapeHtml,
  PAGE_SHELL_CLASS,
  PANEL_CLASS,
  renderArticleGrid,
  renderPagination,
  renderStat,
  renderTagLinks,
  SECTION_EYEBROW_CLASS,
  SUBTLE_PANEL_CLASS
} from '../src/lib/render'
import {
  GITHUB_URL,
  PAGE_SIZE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
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
    <button class="pointer-events-none fixed right-4 bottom-4 z-40 inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--panel)] px-4 text-sm text-[color:var(--text-soft)] opacity-0 shadow-[var(--shadow-soft)] transition duration-200 hover:border-[color:var(--line-strong)] hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] md:right-6 md:bottom-6" type="button" aria-label="&#x8FD4;&#x56DE;&#x9876;&#x90E8;" data-back-to-top>&#x8FD4;&#x56DE;&#x9876;&#x90E8;</button>
    <div class="pointer-events-none fixed right-4 bottom-20 z-40 max-w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] px-4 py-3 text-sm text-[color:var(--text)] opacity-0 shadow-[var(--shadow-soft)] transition duration-200 md:right-6 md:bottom-24" aria-live="polite" data-toast></div>`

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(meta.title)}</title>
    <meta name="description" content="${escapeHtml(meta.description)}" />
    <meta name="theme-color" content="#11161a" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:title" content="${escapeHtml(meta.title)}" />
    <meta property="og:description" content="${escapeHtml(meta.description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${SITE_URL}/logo.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(meta.title)}" />
    <meta name="twitter:description" content="${escapeHtml(meta.description)}" />
    <meta name="twitter:image" content="${SITE_URL}/logo.png" />
    <link rel="canonical" href="${canonical}" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <script>
      (() => {
        const key = 'gopheratlas-theme';
        const stored = localStorage.getItem(key);
        const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
        document.documentElement.dataset.theme = stored || (prefersLight ? 'light' : 'dark');
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
    { href: '/articles/', label: '\u5168\u90e8\u6587\u7ae0' },
    { href: '/topics/', label: '\u4e13\u9898' }
  ]

  const navLinks = links.map((link) => {
    const isActive = link.href === '/'
      ? pathname === '/'
      : pathname === link.href || pathname.startsWith(link.href)
    const stateClass = isActive
      ? 'text-[color:var(--text)] after:bg-[color:var(--accent-strong)]'
      : 'text-[color:var(--text-soft)] after:bg-transparent hover:text-[color:var(--text)] hover:after:bg-[color:var(--line-strong)]'

    return `<a class="relative inline-flex min-h-10 items-center py-2 text-sm transition duration-500 after:absolute after:right-0 after:bottom-0 after:left-0 after:hidden after:h-px after:transition-colors after:duration-500 after:content-[''] md:min-h-[72px] md:px-1 md:py-0 md:after:block ${stateClass}" href="${link.href}">${link.label}</a>`
  }).join('')

  return `
    <header class="shrink-0 border-b border-[color:var(--line)]">
      <div class="${PAGE_SHELL_CLASS} relative flex h-[72px] items-center justify-between gap-6">
        <a class="flex min-w-0 items-center gap-3" href="/">
          <img class="h-9 w-9 object-contain" src="${LOGO_SRC}" alt="GopherAtlas logo" />
          <span class="min-w-0">
            <strong class="block truncate text-[0.98rem] font-semibold tracking-[0.02em] text-[color:var(--text)]">${SITE_NAME}</strong>
            <small class="hidden truncate text-[0.74rem] tracking-[0.08em] text-[color:var(--text-muted)] md:block">\u9762\u5411 Go \u8bed\u8a00\u5f00\u53d1\u8005\u7684\u4f11\u95f2\u8bfb\u7269</small>
          </span>
        </a>
        <button class="inline-flex min-h-10 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-4 text-sm text-[color:var(--text-soft)] transition hover:border-[color:var(--line-strong)] hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--text)] md:hidden" type="button" aria-expanded="false" aria-controls="primary-navigation" data-menu-toggle>
          \u83dc\u5355
        </button>
        <nav class="hidden gap-3 ${PANEL_CLASS} absolute top-[calc(100%+0.75rem)] right-0 left-0 z-20 p-4 md:static md:flex md:items-center md:gap-6 md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none" id="primary-navigation" data-site-nav>
          ${navLinks}
          <a class="inline-flex h-11 w-11 items-center justify-center text-[color:var(--text-soft)] transition duration-500 hover:text-[color:var(--text)] hover:[filter:drop-shadow(0_0_16px_color-mix(in_srgb,var(--accent-glow)_42%,transparent))] md:ml-2" href="${GITHUB_URL}" target="_blank" rel="noreferrer" aria-label="GitHub">
            <img class="h-10 w-10 dark:hidden" src="${GITHUB_ICON_DARK_SRC}" alt="" />
            <img class="hidden h-10 w-10 dark:block" src="${GITHUB_ICON_LIGHT_SRC}" alt="" />
          </a>
          <button class="inline-flex h-11 w-11 items-center justify-center text-[color:var(--text-soft)] transition duration-500 hover:text-[color:var(--text)] hover:[filter:drop-shadow(0_0_14px_color-mix(in_srgb,var(--accent-glow)_34%,transparent))]" type="button" data-theme-toggle aria-label="\u5207\u6362\u4e3b\u9898" title="\u5207\u6362\u4e3b\u9898">
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
  return `
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      ${renderStat('已收录文章', articles.length)}
      ${renderStat('专题数量', topics.length)}
      ${renderStat('标签数量', tags.length)}
      ${renderStat('最后更新', formatDate(articles.map((article) => article.addedAt).sort().at(-1)))}
    </div>
  `
}

function renderTopicCards(topics: TopicViewModel[]): string {
  return `
    <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      ${topics.map((topic) => `
        <article class="${SUBTLE_PANEL_CLASS} flex h-full flex-col gap-4 px-6 py-6">
          <div class="flex items-center justify-between gap-4 text-[0.68rem] font-mono uppercase tracking-[0.22em] text-[color:var(--text-muted)]">
            <span>专题</span>
            <span>${topic.articles.length} 篇</span>
          </div>
          <div class="space-y-3">
            <h3 class="font-display text-[1.8rem] leading-[1.08] tracking-[-0.03em] text-[color:var(--text)]">
              <a class="transition hover:text-[color:var(--accent-strong)]" href="/topics/${topic.slug}/">${escapeHtml(topic.title)}</a>
            </h3>
            <p class="text-sm leading-7 text-[color:var(--text-soft)]">${escapeHtml(topic.summary)}</p>
          </div>
          <div class="mt-auto">
            <a class="${BUTTON_GHOST_CLASS}" href="/topics/${topic.slug}/">进入专题</a>
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

function renderFilterPanel(categories: string[], tags: Array<{ name: string; count: number }>) {
  const ratings: Rating[] = ['S+', 'S', 'A+', 'A', 'B+', 'B']
  const fieldClass = 'h-12 w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] px-4 text-sm text-[color:var(--text)] outline-none transition placeholder:text-[color:var(--text-muted)] focus:border-[color:var(--line-strong)] focus:bg-[color:var(--surface-strong)]'

  return `
    <section class="${PANEL_CLASS} px-6 py-6 md:px-8 md:py-8">
      <div class="flex flex-col gap-4 border-b border-[color:var(--line)] pb-6 md:flex-row md:items-end md:justify-between">
        <div class="space-y-3">
          <span class="${SECTION_EYEBROW_CLASS}">Search tools</span>
          <h2 class="font-display text-[clamp(1.8rem,3vw,2.6rem)] leading-[1.02] tracking-[-0.04em] text-[color:var(--text)]">搜索、筛选与排序</h2>
        </div>
        <button class="${BUTTON_GHOST_CLASS}" type="button" data-copy-current-link>复制当前筛选链接</button>
      </div>
      <form class="mt-6 space-y-6" action="/articles/" method="get" data-article-form>
        <div class="grid gap-4 xl:grid-cols-4">
          <label class="space-y-2">
            <span class="${SECTION_EYEBROW_CLASS}">关键词</span>
            <input class="${fieldClass}" type="search" name="q" placeholder="搜索标题、标签、作者或推荐理由" />
          </label>
          <label class="space-y-2">
            <span class="${SECTION_EYEBROW_CLASS}">分类</span>
            <select class="${fieldClass}" name="category">
              <option value="">全部分类</option>
              ${categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('')}
            </select>
          </label>
          <label class="space-y-2">
            <span class="${SECTION_EYEBROW_CLASS}">语言</span>
            <select class="${fieldClass}" name="lang">
              <option value="">全部语言</option>
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </label>
          <label class="space-y-2">
            <span class="${SECTION_EYEBROW_CLASS}">排序</span>
            <select class="${fieldClass}" name="sort">
              <option value="recommended">Recommended</option>
              <option value="rating">Rating</option>
              <option value="recently-added">Recently Added</option>
              <option value="published-date">Published Date</option>
              <option value="title-asc">Title A-Z</option>
            </select>
          </label>
        </div>
        <div class="grid gap-6 border-t border-[color:var(--line)] pt-6">
          <fieldset class="space-y-3">
            <legend class="${SECTION_EYEBROW_CLASS}">评级</legend>
            <div class="flex flex-wrap gap-2.5">
              ${ratings.map((rating) => `
                <label class="group relative cursor-pointer">
                  <input class="peer sr-only" type="checkbox" name="rating" value="${rating}" />
                  <span class="inline-flex min-h-10 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-4 text-sm text-[color:var(--text-soft)] transition peer-checked:border-[color:var(--line-strong)] peer-checked:bg-[color:var(--surface-strong)] peer-checked:text-[color:var(--text)] group-hover:border-[color:var(--line-strong)] group-hover:bg-[color:var(--surface-strong)]">${rating}</span>
                </label>
              `).join('')}
            </div>
          </fieldset>
          <fieldset class="space-y-3 border-t border-[color:var(--line)] pt-6">
            <legend class="${SECTION_EYEBROW_CLASS}">标签</legend>
            <div class="flex flex-wrap gap-2.5">
              ${tags.map((tag) => `
                <label class="group relative cursor-pointer">
                  <input class="peer sr-only" type="checkbox" name="tags" value="${escapeHtml(tag.name)}" />
                  <span class="inline-flex min-h-10 items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-4 text-sm text-[color:var(--text-soft)] transition peer-checked:border-[color:var(--line-strong)] peer-checked:bg-[color:var(--surface-strong)] peer-checked:text-[color:var(--text)] group-hover:border-[color:var(--line-strong)] group-hover:bg-[color:var(--surface-strong)]">
                    ${escapeHtml(tag.name)}
                    <small class="text-[color:var(--text-muted)]">${tag.count}</small>
                  </span>
                </label>
              `).join('')}
            </div>
          </fieldset>
        </div>
        <div class="flex flex-wrap gap-3">
          <button class="${BUTTON_PRIMARY_CLASS}" type="submit">应用筛选</button>
          <button class="${BUTTON_GHOST_CLASS}" type="button" data-reset-filters>重置条件</button>
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
              <p class="max-w-2xl text-[1rem] leading-8 text-[color:var(--text-soft)] md:text-[1.05rem] md:leading-9">\u9762\u5411Go\u8bed\u8a00\u5f00\u53d1\u8005\u7684\u6280\u672f\u56fe\u9274\uff0c\u6574\u7406\u4e86\u5f53\u4e0b\u6700\u503c\u5f97\u9605\u8bfb\u7684\u9ad8\u8d28\u91cf\u6280\u672f\u535a\u5ba2\u3002</p>
            </div>
            <div class="flex flex-wrap gap-3">
              <a class="${HOME_BUTTON_PRIMARY_CLASS} opacity-0 [animation:hero-rise_780ms_cubic-bezier(0.22,1,0.36,1)_forwards] [animation-delay:300ms]" href="/articles/">\u6d4f\u89c8\u5168\u90e8\u6587\u7ae0</a>
              <a class="${HOME_BUTTON_GHOST_CLASS} opacity-0 [animation:hero-rise_780ms_cubic-bezier(0.22,1,0.36,1)_forwards] [animation-delay:380ms]" href="/topics/">\u8fdb\u5165\u4e13\u9898\u603b\u89c8</a>
            </div>
          </div>
          <div class="hidden lg:flex lg:items-center lg:justify-end lg:pr-[clamp(1.75rem,4vw,4rem)]">
            <div class="home-hero__stage">
              <div class="home-hero__halo"></div>
              <div class="home-hero__contour"></div>
              <div class="home-hero__crosshair"></div>
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
      title: `专题总览 | ${SITE_NAME}`,
      description: '按问题空间浏览 GopherAtlas 专题，快速找到合适的 Go 阅读路径。',
      pageId: 'topics'
    },
    `
      <div class="${PAGE_SHELL_CLASS} space-y-10 md:space-y-14">
        ${renderPageHero(
          'Topics',
          '专题总览',
          '从问题空间开始浏览，而不是从散落链接开始。所有独立专题都集中在这里，适合先建立阅读顺序，再进入具体文章。',
          `<a class="${BUTTON_PRIMARY_CLASS}" href="/articles/">去文章页筛选</a>
           <a class="${BUTTON_GHOST_CLASS}" href="/contribute/">推荐新文章</a>`
        )}
        <section class="space-y-6">
          <div class="space-y-3">
            <span class="${SECTION_EYEBROW_CLASS}">Directory</span>
            <h2 class="font-display text-[clamp(1.9rem,3vw,3rem)] leading-[1.02] tracking-[-0.04em] text-[color:var(--text)]">${topics.length} 个主题，${articles.length} 篇精选文章</h2>
            <p class="max-w-3xl text-base leading-8 text-[color:var(--text-soft)]">每个专题都带有导读、推荐阅读顺序和相关文章，方便你按主题逐步深入。</p>
          </div>
          ${renderTopicCards(topics)}
        </section>
        <section class="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <article class="${PANEL_CLASS} space-y-4 px-6 py-6 md:px-8 md:py-8">
            <span class="${SECTION_EYEBROW_CLASS}">Next step</span>
            <h2 class="font-display text-[clamp(1.8rem,2.6vw,2.6rem)] leading-[1.05] tracking-[-0.04em] text-[color:var(--text)]">需要按标签、评级或语言继续筛选？</h2>
            <p class="max-w-2xl text-base leading-8 text-[color:var(--text-soft)]">专题页用来确定你先想理解的问题空间，更细的组合筛选则留给文章页完成。</p>
            <a class="${BUTTON_GHOST_CLASS}" href="/articles/">打开文章页</a>
          </article>
          <article class="${PANEL_CLASS} space-y-4 px-6 py-6 md:px-8 md:py-8">
            <span class="${SECTION_EYEBROW_CLASS}">Rating</span>
            <h2 class="font-display text-[clamp(1.8rem,2.6vw,2.5rem)] leading-[1.05] tracking-[-0.04em] text-[color:var(--text)]">评级表达推荐优先级，不是绝对分数</h2>
            <p class="text-base leading-8 text-[color:var(--text-soft)]">如果你想快速抓到基础且高价值的内容，可以先看 S+ 和 S 条目。</p>
            ${renderRatingLegend()}
          </article>
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
      title: `全部文章 | ${SITE_NAME}`,
      description: '搜索、筛选和排序所有已收录的 Go 高质量文章。',
      pageId: 'articles'
    },
    `
      <div class="${PAGE_SHELL_CLASS} space-y-8 md:space-y-10">
        ${renderPageHero(
          'Articles',
          '全部文章',
          '默认按推荐优先级排序。你可以按关键词、分类、标签、评级和语言组合筛选，也可以直接复制当前筛选状态分享给别人。',
          renderHeroStats(articles, [], groupTagsByCount(articles))
        )}
        ${renderFilterPanel(stats.categories, groupTagsByCount(articles))}
        <section class="space-y-6" data-results-section>
          <div class="flex flex-col gap-4 border-b border-[color:var(--line)] pb-5 md:flex-row md:items-end md:justify-between">
            <p class="text-base text-[color:var(--text-soft)]">当前共有 <strong class="font-semibold text-[color:var(--text)]" data-result-count>${sorted.length}</strong> 篇命中</p>
            <a class="${BUTTON_GHOST_CLASS}" href="/">返回首页</a>
          </div>
          <div data-article-results>
            ${renderArticleGrid(paginated.items, '暂无符合条件的文章。')}
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

function renderTopicPage(topic: TopicViewModel, allTopics: TopicViewModel[]) {
  const orderedArticles = [
    ...topic.readingOrder.map((id) => topic.articles.find((article) => article.id === id)).filter(Boolean),
    ...topic.articles.filter((article) => !topic.readingOrder.includes(article.id))
  ] as ArticleItem[]
  const relatedTopics = topic.relatedTopics.map((slug) => allTopics.find((item) => item.slug === slug)).filter(Boolean) as TopicViewModel[]

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
          `<a class="${BUTTON_PRIMARY_CLASS}" href="/articles/?category=${encodeURIComponent(topic.articles[0]?.category ?? topic.title)}">在文章页筛选</a>
           <button class="${BUTTON_GHOST_CLASS}" type="button" data-copy-current-link>复制专题链接</button>`
        )}
        <section class="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
          <article class="${PANEL_CLASS} markdown-body px-6 py-6 md:px-8 md:py-8">
            <span class="${SECTION_EYEBROW_CLASS}">专题导读</span>
            ${topic.body}
          </article>
          <aside class="${PANEL_CLASS} px-6 py-6 md:px-8 md:py-8">
            <span class="${SECTION_EYEBROW_CLASS}">推荐阅读顺序</span>
            <ol class="mt-5 space-y-3">
              ${orderedArticles.map((article) => `<li class="text-base leading-7 text-[color:var(--text-soft)]"><a class="transition hover:text-[color:var(--accent-strong)]" href="${article.url}" target="_blank" rel="noreferrer">${escapeHtml(article.title)}</a></li>`).join('')}
            </ol>
          </aside>
        </section>
        <section class="space-y-6">
          <div class="space-y-3">
            <span class="${SECTION_EYEBROW_CLASS}">专题文章</span>
            <h2 class="font-display text-[clamp(1.9rem,3vw,3rem)] leading-[1.04] tracking-[-0.04em] text-[color:var(--text)]">${topic.articles.length} 篇精选文章</h2>
          </div>
          ${renderArticleGrid(orderedArticles, '当前专题暂无文章。')}
        </section>
        <section class="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <article class="${PANEL_CLASS} space-y-4 px-6 py-6 md:px-8 md:py-8">
            <span class="${SECTION_EYEBROW_CLASS}">标签聚合</span>
            ${renderTagLinks(groupTagsByCount(topic.articles), 18)}
          </article>
          <article class="${PANEL_CLASS} space-y-4 px-6 py-6 md:px-8 md:py-8">
            <span class="${SECTION_EYEBROW_CLASS}">相关专题</span>
            <div class="grid gap-3 text-base text-[color:var(--text-soft)]">
              ${relatedTopics.map((item) => `<a class="transition hover:text-[color:var(--accent-strong)]" href="/topics/${item.slug}/">${escapeHtml(item.title)}</a>`).join('') || '<span>当前暂无相关专题。</span>'}
            </div>
          </article>
        </section>
      </div>
    `,
    `/topics/${topic.slug}/`
  )
}

function renderTagPage(tagName: string, articles: ArticleItem[]): string {
  const relatedCategories = [...new Set(articles.map((article) => article.category))]

  return renderShell(
    {
      title: `标签：${tagName} | ${SITE_NAME}`,
      description: `查看与 ${tagName} 相关的 Go 精选文章。`,
      pageId: 'tag'
    },
    `
      <div class="${PAGE_SHELL_CLASS} space-y-10 md:space-y-14">
        ${renderPageHero(
          'Tag',
          escapeHtml(tagName),
          `当前标签下共收录 ${articles.length} 篇文章，适合从一个具体问题切入继续延展阅读。`,
          `<a class="${BUTTON_PRIMARY_CLASS}" href="/articles/?tags=${encodeURIComponent(tagName)}">在文章页筛选</a>
           <button class="${BUTTON_GHOST_CLASS}" type="button" data-copy-current-link>复制标签链接</button>`
        )}
        <section class="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <article class="${PANEL_CLASS} space-y-4 px-6 py-6 md:px-8 md:py-8">
            <span class="${SECTION_EYEBROW_CLASS}">关联分类</span>
            <div class="flex flex-wrap gap-2.5">
              ${relatedCategories.map((category) => `<a class="${BUTTON_GHOST_CLASS}" href="/articles/?category=${encodeURIComponent(category)}">${escapeHtml(category)}</a>`).join('')}
            </div>
          </article>
          <article class="${PANEL_CLASS} space-y-4 px-6 py-6 md:px-8 md:py-8">
            <span class="${SECTION_EYEBROW_CLASS}">继续探索</span>
            <p class="text-base leading-8 text-[color:var(--text-soft)]">如果你想叠加更多条件，建议切换到文章页继续组合关键词、评级、语言与多个标签。</p>
            <a class="${BUTTON_GHOST_CLASS}" href="/articles/?tags=${encodeURIComponent(tagName)}">打开高级筛选</a>
          </article>
        </section>
        <section>
          ${renderArticleGrid(sortArticles(articles, 'recommended'), '当前标签暂无文章。')}
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
    await writePage(`topics/${topic.slug}/index.html`, renderTopicPage(topic, topicPages))
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
