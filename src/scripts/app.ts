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
  toastEl.classList.add('is-visible')
  window.setTimeout(() => {
    toastEl.classList.remove('is-visible')
  }, 1800)
}

function initThemeToggle() {
  const button = document.querySelector<HTMLButtonElement>('[data-theme-toggle]')
  if (!button) {
    return
  }

  const storage = window.localStorage
  let currentTheme: ThemeMode = resolveTheme(readStoredTheme(storage), window.matchMedia('(prefers-color-scheme: light)').matches)
  applyTheme(currentTheme)
  button.textContent = currentTheme === 'dark' ? '切换为亮色' : '切换为暗色'

  button.addEventListener('click', () => {
    currentTheme = toggleTheme(currentTheme)
    storeTheme(currentTheme, storage)
    applyTheme(currentTheme)
    button.textContent = currentTheme === 'dark' ? '切换为亮色' : '切换为暗色'
    showToast(currentTheme === 'dark' ? '已切换到暗色模式' : '已切换到亮色模式')
  })
}

function initMobileMenu() {
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]')
  const nav = document.querySelector<HTMLElement>('[data-site-nav]')
  if (!toggle || !nav) {
    return
  }

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true'
    toggle.setAttribute('aria-expanded', String(!expanded))
    nav.classList.toggle('is-open', !expanded)
  })
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
  if (!button) {
    return
  }

  const toggleVisibility = () => {
    button.classList.toggle('is-visible', window.scrollY > 400)
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
