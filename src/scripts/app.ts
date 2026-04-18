import {
  DEFAULT_SEARCH_STATE,
  filterArticles,
  paginateArticles,
  parseSearchParams,
  sortArticles,
  stringifySearchState,
  type ArticleItem,
  type ArticleSearchState
} from '../lib/articles'
import { renderArticleGrid, renderPagination } from '../lib/render'
import { copyText } from './clipboard'
import { applyTheme, readStoredTheme, resolveTheme, storeTheme, toggleTheme, type ThemeMode } from './theme'

type ArticlesPageData = {
  articles: ArticleItem[]
  pageSize: number
}

const toastEl = document.querySelector<HTMLElement>('[data-toast]')

function showToast(message: string) {
  if (!toastEl) {
    return
  }

  toastEl.textContent = message
  toastEl.classList.remove('pointer-events-none', 'opacity-0', 'translate-y-2')
  toastEl.classList.add('opacity-100', 'translate-y-0')

  window.setTimeout(() => {
    toastEl.classList.add('pointer-events-none', 'opacity-0', 'translate-y-2')
    toastEl.classList.remove('opacity-100', 'translate-y-0')
  }, 1800)
}

function initThemeToggle() {
  const button = document.querySelector<HTMLButtonElement>('[data-theme-toggle]')
  if (!button) {
    return
  }

  const storage = window.localStorage
  let currentTheme: ThemeMode = resolveTheme(readStoredTheme(storage), window.matchMedia('(prefers-color-scheme: light)').matches)

  const syncButtonLabel = () => {
    const nextLabel = currentTheme === 'dark' ? '\u5207\u6362\u4eae\u8272' : '\u5207\u6362\u6697\u8272'
    button.setAttribute('aria-label', nextLabel)
    button.setAttribute('title', nextLabel)
  }

  applyTheme(currentTheme)
  syncButtonLabel()

  button.addEventListener('click', () => {
    currentTheme = toggleTheme(currentTheme)
    storeTheme(currentTheme, storage)
    applyTheme(currentTheme)
    syncButtonLabel()
    showToast(currentTheme === 'dark' ? '\u5df2\u5207\u6362\u5230\u6697\u8272\u6a21\u5f0f' : '\u5df2\u5207\u6362\u5230\u4eae\u8272\u6a21\u5f0f')
  })
}

function initMobileMenu() {
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]')
  const nav = document.querySelector<HTMLElement>('[data-site-nav]')
  if (!toggle || !nav) {
    return
  }

  const closeMenu = () => {
    toggle.setAttribute('aria-expanded', 'false')
    nav.classList.add('hidden')
  }

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true'
    toggle.setAttribute('aria-expanded', String(!expanded))
    nav.classList.toggle('hidden', expanded)
  })

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      nav.classList.remove('hidden')
      return
    }

    closeMenu()
  })

  document.addEventListener('click', (event) => {
    const target = event.target as Node | null
    if (!target || nav.contains(target) || toggle.contains(target)) {
      return
    }

    if (window.innerWidth < 768) {
      closeMenu()
    }
  })

  if (window.innerWidth >= 768) {
    nav.classList.remove('hidden')
  }
}

function initClipboardActions() {
  document.addEventListener('click', async (event) => {
    const target = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('[data-copy-text], [data-copy-current-link]') : null
    if (!target) {
      return
    }

    const text = target.dataset.copyText ?? window.location.href
    const success = await copyText(text)
    showToast(success ? '链接已复制' : '复制失败，请手动复制')
  })
}

function initBackToTop() {
  const button = document.querySelector<HTMLButtonElement>('[data-back-to-top]')
  if (!button || document.body.dataset.page === 'home') {
    return
  }

  const toggleVisibility = () => {
    const visible = window.scrollY > 400
    button.classList.toggle('pointer-events-none', !visible)
    button.classList.toggle('opacity-0', !visible)
    button.classList.toggle('translate-y-2', !visible)
    button.classList.toggle('opacity-100', visible)
    button.classList.toggle('translate-y-0', visible)
  }

  window.addEventListener('scroll', toggleVisibility, { passive: true })
  toggleVisibility()

  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })
}

function readArticlesPageData(): ArticlesPageData | null {
  const script = document.getElementById('page-data')
  if (!script?.textContent) {
    return null
  }

  return JSON.parse(script.textContent) as ArticlesPageData
}

function setCheckboxGroup(form: HTMLFormElement, name: string, values: string[]) {
  for (const input of form.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)) {
    input.checked = values.includes(input.value)
  }
}

function syncForm(form: HTMLFormElement, state: ArticleSearchState) {
  const q = form.querySelector<HTMLInputElement>('input[name="q"]')
  const category = form.querySelector<HTMLSelectElement>('select[name="category"]')
  const lang = form.querySelector<HTMLSelectElement>('select[name="lang"]')
  const sort = form.querySelector<HTMLSelectElement>('select[name="sort"]')

  if (q) {
    q.value = state.q
  }
  if (category) {
    category.value = state.category
  }
  if (lang) {
    lang.value = state.lang
  }
  if (sort) {
    sort.value = state.sort
  }

  setCheckboxGroup(form, 'tags', state.tags)
  setCheckboxGroup(form, 'rating', state.rating)
}

function getCheckedValues(form: HTMLFormElement, name: string): string[] {
  return [...form.querySelectorAll<HTMLInputElement>(`input[name="${name}"]:checked`)].map((input) => input.value)
}

function readFormState(form: HTMLFormElement): ArticleSearchState {
  const q = form.querySelector<HTMLInputElement>('input[name="q"]')?.value.trim() ?? ''
  const category = form.querySelector<HTMLSelectElement>('select[name="category"]')?.value ?? ''
  const lang = form.querySelector<HTMLSelectElement>('select[name="lang"]')?.value ?? ''
  const sort = form.querySelector<HTMLSelectElement>('select[name="sort"]')?.value ?? DEFAULT_SEARCH_STATE.sort

  return {
    q,
    category,
    tags: getCheckedValues(form, 'tags'),
    rating: getCheckedValues(form, 'rating') as ArticleSearchState['rating'],
    sort: sort as ArticleSearchState['sort'],
    lang: lang === 'zh' || lang === 'en' ? lang : '',
    page: 1
  }
}

function initArticlesExplorer() {
  if (document.body.dataset.page !== 'articles') {
    return
  }

  const pageData = readArticlesPageData()
  const form = document.querySelector<HTMLFormElement>('[data-article-form]')
  const results = document.querySelector<HTMLElement>('[data-article-results]')
  const pagination = document.querySelector<HTMLElement>('[data-pagination]')
  const count = document.querySelector<HTMLElement>('[data-result-count]')
  const resetButton = document.querySelector<HTMLButtonElement>('[data-reset-filters]')

  if (!pageData || !form || !results || !pagination || !count) {
    return
  }

  let state = parseSearchParams(new URLSearchParams(window.location.search))
  syncForm(form, state)

  const render = () => {
    const filtered = filterArticles(pageData.articles, state)
    const sorted = sortArticles(filtered, state.sort)
    const paginated = paginateArticles(sorted, state.page, pageData.pageSize)

    state = { ...state, page: paginated.currentPage }
    count.textContent = String(filtered.length)
    results.innerHTML = renderArticleGrid(paginated.items, '没有找到符合条件的文章，试试减少标签或放宽关键词。')
    pagination.innerHTML = renderPagination(paginated.currentPage, paginated.totalPages, state)
    history.replaceState({}, '', `/articles/${stringifySearchState(state)}`)
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    state = readFormState(form)
    render()
  })

  form.addEventListener('change', () => {
    state = readFormState(form)
    render()
  })

  form.addEventListener('input', (event) => {
    const target = event.target as HTMLElement | null
    if (target?.getAttribute('name') !== 'q') {
      return
    }

    state = readFormState(form)
    render()
  })

  pagination.addEventListener('click', (event) => {
    const link = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('[data-page-link]') : null
    if (!link) {
      return
    }

    event.preventDefault()
    const nextPage = Number.parseInt(link.dataset.pageLink ?? '1', 10)
    state = {
      ...readFormState(form),
      page: Number.isNaN(nextPage) ? 1 : nextPage
    }
    render()
  })

  resetButton?.addEventListener('click', () => {
    form.reset()
    state = { ...DEFAULT_SEARCH_STATE }
    syncForm(form, state)
    render()
  })

  window.addEventListener('popstate', () => {
    state = parseSearchParams(new URLSearchParams(window.location.search))
    syncForm(form, state)
    render()
  })

  render()
}

initThemeToggle()
initMobileMenu()
initClipboardActions()
initBackToTop()
initArticlesExplorer()
