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
  type ArticleItem,
  type ArticleSearchState
} from '../src/lib/articles'
import { loadArticles, loadStaticPageDocument, loadTopicDocuments, type TopicDocument } from '../src/lib/content'
import { buildTagHref, escapeHtml, renderArticleGrid, renderPagination, renderStat, renderTagLinks } from '../src/lib/render'
import {
  CATEGORY_ORDER,
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
  path: string
  pageId: string
}

type TopicViewModel = TopicDocument & {
  articles: ArticleItem[]
}

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
  const pageDataScript = pageData
    ? `<script id="page-data" type="application/json">${serializePageData(pageData)}</script>`
    : ''

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(meta.title)}</title>
    <meta name="description" content="${escapeHtml(meta.description)}" />
    <meta name="theme-color" content="#08111f" />
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
  <body data-page="${meta.pageId}">
    <div class="site-shell">
      ${renderHeader(pathname)}
      <main class="site-main">${content}</main>
      ${renderFooter()}
    </div>
    <button class="back-to-top" type="button" aria-label="返回顶部" data-back-to-top>回到顶部</button>
    <div class="toast" aria-live="polite" data-toast></div>
    ${pageDataScript}
    <script type="module" src="/src/scripts/app.ts"></script>
  </body>
</html>`
}

function renderHeader(pathname: string): string {
  const links = [
    { href: '/', label: '首页' },
    { href: '/articles/', label: '全部文章' },
    { href: '/about/', label: '关于' },
    { href: '/contribute/', label: '参与贡献' }
  ]

  return `
    <header class="site-header">
      <div class="site-header__inner">
        <a class="brand-mark" href="/">
          <img src="/logo.png" alt="GopherAtlas logo" />
          <span>
            <strong>${SITE_NAME}</strong>
            <small>A curated atlas of high-quality Go articles</small>
          </span>
        </a>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-navigation" data-menu-toggle>
          菜单
        </button>
        <nav class="site-nav" id="primary-navigation" data-site-nav>
          ${links.map((link) => `<a class="${pathname === link.href ? 'is-active' : ''}" href="${link.href}">${link.label}</a>`).join('')}
          <a href="${GITHUB_URL}" target="_blank" rel="noreferrer">GitHub</a>
          <button class="theme-toggle" type="button" data-theme-toggle>切换主题</button>
        </nav>
      </div>
    </header>
  `
}

function renderFooter(): string {
  return `
    <footer class="site-footer">
      <div class="site-footer__inner">
        <div>
          <strong>${SITE_NAME}</strong>
          <p>${SITE_DESCRIPTION}</p>
        </div>
        <div class="site-footer__links">
          <a href="${GITHUB_URL}" target="_blank" rel="noreferrer">GitHub 仓库</a>
          <a href="/articles/">浏览全部文章</a>
          <a href="/contribute/">推荐文章</a>
        </div>
      </div>
    </footer>
  `
}

function renderHeroStats(articles: ArticleItem[], topics: TopicViewModel[], tags: Array<{ name: string; count: number; slug: string }>) {
  return `
    <div class="stats-grid">
      ${renderStat('已收录文章', articles.length)}
      ${renderStat('首发专题', topics.length)}
      ${renderStat('标签数量', tags.length)}
      ${renderStat('最后更新', formatDate(articles.map((article) => article.addedAt).sort().at(-1)))}
    </div>
  `
}

function renderTopicCards(topics: TopicViewModel[]): string {
  return `
    <div class="topic-grid">
      ${topics.map((topic) => `
        <article class="topic-card glass-card">
          <div class="topic-card__meta">
            <span>专题</span>
            <span>${topic.articles.length} 篇</span>
          </div>
          <h3><a href="/topics/${topic.slug}/">${escapeHtml(topic.title)}</a></h3>
          <p>${escapeHtml(topic.summary)}</p>
          <a class="button button--ghost" href="/topics/${topic.slug}/">进入专题</a>
        </article>
      `).join('')}
    </div>
  `
}

function renderRatingLegend(): string {
  const items: Array<{ rating: Rating; description: string }> = [
    { rating: 'S+', description: '长期价值极高，建议优先阅读。' },
    { rating: 'S', description: '高质量核心文章，适合深读。' },
    { rating: 'A+', description: '值得读，适合作为专题延伸。' },
    { rating: 'A', description: '质量稳定，适合作为补充阅读。' }
  ]

  return `
    <div class="legend-grid">
      ${items.map((item) => `
        <article class="legend-card glass-card">
          <span class="rating-badge rating-badge--${item.rating.toLowerCase().replace('+', 'plus')}">${item.rating}</span>
          <p>${escapeHtml(item.description)}</p>
        </article>
      `).join('')}
    </div>
  `
}

function renderHomePage(articles: ArticleItem[], topics: TopicViewModel[], tags: Array<{ name: string; count: number; slug: string }>): string {
  const featured = sortArticles(articles.filter((article) => article.featured), 'recommended').slice(0, 6)
  const mustRead = sortArticles(articles.filter((article) => article.mustRead), 'recommended').slice(0, 4)
  const latest = sortArticles(articles, 'recently-added').slice(0, 6)

  return renderShell(
    {
      title: `${SITE_NAME} | 高质量 Go 技术文章精选导航`,
      description: SITE_DESCRIPTION,
      path: '/',
      pageId: 'home'
    },
    `
      <section class="hero-section">
        <div class="hero-card glass-card">
          <div class="hero-copy">
            <span class="hero-kicker">High-signal Go reading</span>
            <h1>${SITE_NAME}</h1>
            <p>面向 Go 开发者的高质量文章地图。按专题、标签与评级整理，让值得读的内容更快被找到。</p>
            <form class="hero-search" action="/articles/" method="get">
              <label class="sr-only" for="home-search">搜索文章</label>
              <input id="home-search" name="q" type="search" placeholder="搜索标题、标签、作者或推荐理由" />
              <button class="button button--primary" type="submit">搜索文章</button>
            </form>
            <div class="button-row">
              <a class="button button--primary" href="/articles/">浏览全部文章</a>
              <a class="button button--ghost" href="#topics">探索专题</a>
              <a class="button button--ghost" href="${GITHUB_URL}" target="_blank" rel="noreferrer">查看 GitHub</a>
            </div>
          </div>
          <div class="hero-visual">
            <img src="/logo.png" alt="GopherAtlas" />
          </div>
        </div>
        ${renderHeroStats(articles, topics, tags)}
      </section>

      <section class="section-block" id="topics">
        <div class="section-heading">
          <div>
            <span class="section-eyebrow">热门专题</span>
            <h2>从问题空间开始，而不是从链接堆开始</h2>
          </div>
          <a class="button button--ghost" href="/articles/">去文章页筛选</a>
        </div>
        ${renderTopicCards(topics)}
      </section>

      <section class="section-block">
        <div class="section-heading">
          <div>
            <span class="section-eyebrow">精选推荐</span>
            <h2>首版最值得先读的文章</h2>
          </div>
        </div>
        ${renderArticleGrid(featured, '暂无精选文章。')}
      </section>

      <section class="section-block">
        <div class="section-heading">
          <div>
            <span class="section-eyebrow">Must Read</span>
            <h2>适合作为 Go 阅读地图起点的必读条目</h2>
          </div>
        </div>
        ${renderArticleGrid(mustRead, '暂无必读文章。')}
      </section>

      <section class="section-block">
        <div class="section-heading">
          <div>
            <span class="section-eyebrow">最新收录</span>
            <h2>最近整理进站的内容</h2>
          </div>
        </div>
        ${renderArticleGrid(latest, '暂无最近收录内容。')}
      </section>

      <section class="section-block">
        <div class="section-heading">
          <div>
            <span class="section-eyebrow">评级说明</span>
            <h2>评级表达推荐优先级，不是绝对分数</h2>
          </div>
        </div>
        ${renderRatingLegend()}
      </section>

      <section class="section-block">
        <div class="section-heading">
          <div>
            <span class="section-eyebrow">标签速览</span>
            <h2>从高频话题切入，快速找到相关内容</h2>
          </div>
        </div>
        ${renderTagLinks(tags, 18)}
      </section>

      <section class="section-block cta-grid">
        <article class="glass-card prose-card">
          <span class="section-eyebrow">About</span>
          <h2>了解这张 Go 阅读地图是怎么构建的</h2>
          <p>收录标准、评级逻辑、技术栈和维护原则都写在这里。</p>
          <a class="button button--ghost" href="/about/">查看 About</a>
        </article>
        <article class="glass-card prose-card">
          <span class="section-eyebrow">Contribute</span>
          <h2>推荐一篇你认为值得长期阅读的 Go 文章</h2>
          <p>如果你有好内容想补进地图，这里有统一的推荐格式和提交流程。</p>
          <a class="button button--ghost" href="/contribute/">查看贡献说明</a>
        </article>
      </section>
    `,
    '/'
  )
}

function renderFilterPanel(categories: string[], tags: Array<{ name: string; count: number }>) {
  const ratings: Rating[] = ['S+', 'S', 'A+', 'A', 'B+', 'B']

  return `
    <section class="filter-panel glass-card">
      <div class="filter-panel__heading">
        <div>
          <span class="section-eyebrow">检索工具</span>
          <h2>搜索、筛选与排序</h2>
        </div>
        <button class="button button--ghost" type="button" data-copy-current-link>复制当前筛选链接</button>
      </div>
      <form class="filter-form" action="/articles/" method="get" data-article-form>
        <div class="field-grid">
          <label class="field">
            <span>关键词</span>
            <input type="search" name="q" placeholder="搜索标题、标签、作者或推荐理由" />
          </label>
          <label class="field">
            <span>分类</span>
            <select name="category">
              <option value="">全部分类</option>
              ${categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('')}
            </select>
          </label>
          <label class="field">
            <span>语言</span>
            <select name="lang">
              <option value="">全部语言</option>
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </label>
          <label class="field">
            <span>排序</span>
            <select name="sort">
              <option value="recommended">Recommended</option>
              <option value="rating">Rating</option>
              <option value="recently-added">Recently Added</option>
              <option value="published-date">Published Date</option>
              <option value="title-asc">Title A-Z</option>
            </select>
          </label>
        </div>
        <div class="filter-stack">
          <fieldset class="chip-fieldset">
            <legend>评级</legend>
            <div class="chip-list">
              ${ratings.map((rating) => `
                <label class="chip-toggle">
                  <input type="checkbox" name="rating" value="${rating}" />
                  <span>${rating}</span>
                </label>
              `).join('')}
            </div>
          </fieldset>
          <fieldset class="chip-fieldset">
            <legend>标签</legend>
            <div class="chip-list">
              ${tags.map((tag) => `
                <label class="chip-toggle">
                  <input type="checkbox" name="tags" value="${escapeHtml(tag.name)}" />
                  <span>${escapeHtml(tag.name)} <small>${tag.count}</small></span>
                </label>
              `).join('')}
            </div>
          </fieldset>
        </div>
        <div class="button-row">
          <button class="button button--primary" type="submit">应用筛选</button>
          <button class="button button--ghost" type="button" data-reset-filters>重置条件</button>
        </div>
      </form>
    </section>
  `
}

function renderArticlesPage(articles: ArticleItem[]) {
  const stats = getArticleStats(articles)
  const sorted = sortArticles(filterArticles(articles, DEFAULT_SEARCH_STATE), 'recommended')
  const paginated = paginateArticles(sorted, 1)

  return renderShell(
    {
      title: `全部文章 | ${SITE_NAME}`,
      description: '搜索、筛选和排序所有已收录的 Go 高质量文章。',
      path: '/articles/',
      pageId: 'articles'
    },
    `
      <section class="page-hero glass-card">
        <div>
          <span class="section-eyebrow">Articles</span>
          <h1>全部文章</h1>
          <p>默认按推荐优先级排序。你可以按关键词、分类、标签、评级和语言组合筛选，并把当前状态直接复制给别人。</p>
        </div>
        ${renderHeroStats(articles, [], groupTagsByCount(articles))}
      </section>
      ${renderFilterPanel(stats.categories, groupTagsByCount(articles))}
      <section class="section-block" data-results-section>
        <div class="results-toolbar">
          <p>当前共 <strong data-result-count>${sorted.length}</strong> 篇命中</p>
          <a class="button button--ghost" href="/">返回首页</a>
        </div>
        <div data-article-results>
          ${renderArticleGrid(paginated.items, '暂无符合条件的文章。')}
        </div>
        <div data-pagination>
          ${renderPagination(paginated.currentPage, paginated.totalPages, DEFAULT_SEARCH_STATE)}
        </div>
      </section>
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
      path: `/topics/${topic.slug}/`,
      pageId: 'topic'
    },
    `
      <section class="page-hero glass-card">
        <div>
          <span class="section-eyebrow">Topic</span>
          <h1>${escapeHtml(topic.title)}</h1>
          <p>${escapeHtml(topic.summary)}</p>
        </div>
        <div class="button-row">
          <a class="button button--primary" href="/articles/?category=${encodeURIComponent(topic.articles[0]?.category ?? topic.title)}">在文章页中筛选</a>
          <button class="button button--ghost" type="button" data-copy-current-link>复制专题链接</button>
        </div>
      </section>

      <section class="section-block two-column-layout">
        <article class="glass-card prose-card">
          <span class="section-eyebrow">专题导读</span>
          ${topic.body}
        </article>
        <aside class="glass-card prose-card">
          <span class="section-eyebrow">推荐阅读顺序</span>
          <ol class="reading-order">
            ${orderedArticles.map((article) => `<li><a href="${article.url}" target="_blank" rel="noreferrer">${escapeHtml(article.title)}</a></li>`).join('')}
          </ol>
        </aside>
      </section>

      <section class="section-block">
        <div class="section-heading">
          <div>
            <span class="section-eyebrow">专题文章</span>
            <h2>${topic.articles.length} 篇精选文章</h2>
          </div>
        </div>
        ${renderArticleGrid(orderedArticles, '当前专题暂无文章。')}
      </section>

      <section class="section-block two-column-layout">
        <article class="glass-card prose-card">
          <span class="section-eyebrow">标签聚合</span>
          ${renderTagLinks(groupTagsByCount(topic.articles), 18)}
        </article>
        <article class="glass-card prose-card">
          <span class="section-eyebrow">相关专题</span>
          <div class="link-list">
            ${relatedTopics.map((item) => `<a href="/topics/${item.slug}/">${escapeHtml(item.title)}</a>`).join('') || '<span>当前暂无相关专题。</span>'}
          </div>
        </article>
      </section>
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
      path: buildTagHref(tagName),
      pageId: 'tag'
    },
    `
      <section class="page-hero glass-card">
        <div>
          <span class="section-eyebrow">Tag</span>
          <h1>${escapeHtml(tagName)}</h1>
          <p>当前标签下共收录 ${articles.length} 篇文章，适合从一个具体问题切入继续延展阅读。</p>
        </div>
        <div class="button-row">
          <a class="button button--primary" href="/articles/?tags=${encodeURIComponent(tagName)}">在文章页中筛选</a>
          <button class="button button--ghost" type="button" data-copy-current-link>复制标签页链接</button>
        </div>
      </section>
      <section class="section-block two-column-layout">
        <article class="glass-card prose-card">
          <span class="section-eyebrow">关联分类</span>
          <div class="tag-cloud">
            ${relatedCategories.map((category) => `<a class="tag-pill" href="/articles/?category=${encodeURIComponent(category)}">${escapeHtml(category)}</a>`).join('')}
          </div>
        </article>
        <article class="glass-card prose-card">
          <span class="section-eyebrow">继续探索</span>
          <p>如果你想叠加更多条件，建议切换到文章页继续组合关键词、评级、语言与多个标签。</p>
          <a class="button button--ghost" href="/articles/?tags=${encodeURIComponent(tagName)}">打开高级筛选</a>
        </article>
      </section>
      <section class="section-block">
        ${renderArticleGrid(sortArticles(articles, 'recommended'), '当前标签暂无文章。')}
      </section>
    `,
    buildTagHref(tagName)
  )
}

function renderMarkdownPage(title: string, description: string, body: string, pathname: string, pageId: string): string {
  return renderShell(
    {
      title: `${title} | ${SITE_NAME}`,
      description,
      path: pathname,
      pageId
    },
    `
      <section class="page-hero glass-card">
        <div>
          <span class="section-eyebrow">${pageId === 'about' ? 'About' : 'Contribute'}</span>
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(description)}</p>
        </div>
      </section>
      <section class="section-block">
        <article class="glass-card prose-card markdown-body">
          ${body}
        </article>
      </section>
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

  const allRoutes = ['/', '/articles/', '/about/', '/contribute/']

  await writePage('index.html', renderHomePage(articles, topicPages, tagGroups))
  await writePage('articles/index.html', renderArticlesPage(articles))
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
