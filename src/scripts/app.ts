import * as Sentry from '@sentry/browser'
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

function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) {
    return
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1
  })
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

  const setMenuOpen = (open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open))
    nav.classList.toggle('hidden', !open)
    nav.classList.toggle('flex', open && window.innerWidth < 768)
  }

  const closeMenu = () => {
    setMenuOpen(false)
  }

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true'
    setMenuOpen(!expanded)
  })

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      toggle.setAttribute('aria-expanded', 'false')
      nav.classList.remove('hidden', 'flex')
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

  nav.addEventListener('click', (event) => {
    const target = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('a, button') : null
    if (!target || window.innerWidth >= 768) {
      return
    }

    closeMenu()
  })

  if (window.innerWidth >= 768) {
    nav.classList.remove('hidden', 'flex')
  }
}

function initClipboardActions() {
  document.addEventListener('click', async (event) => {
    const target = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('[data-copy-text], [data-copy-current-link], [data-copy-code-target]') : null
    if (!target) {
      return
    }

    const targetId = target.dataset.copyCodeTarget
    const codeSource = targetId ? document.getElementById(targetId) as HTMLTextAreaElement | null : null
    const text = codeSource?.value ?? target.dataset.copyText ?? window.location.href
    const success = await copyText(text)
    const successMessage = targetId ? '代码已复制' : '链接已复制'
    showToast(success ? successMessage : '复制失败，请手动复制')
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

function initPagedList(
  root: HTMLElement,
  {
    itemSelector,
    prevSelector,
    nextSelector,
    pageSelector
  }: {
    itemSelector: string
    prevSelector: string
    nextSelector: string
    pageSelector: string
  }
) {
  const items = [...root.querySelectorAll<HTMLElement>(itemSelector)]
  const prevButton = root.querySelector<HTMLButtonElement>(prevSelector)
  const nextButton = root.querySelector<HTMLButtonElement>(nextSelector)
  const pageLabel = root.querySelector<HTMLElement>(pageSelector)
  const pageSize = Number.parseInt(root.dataset.pageSize ?? '4', 10)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  let currentPage = 1

  if (items.length === 0) {
    return
  }

  const renderPage = () => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize

    items.forEach((item, index) => {
      item.hidden = index < start || index >= end
    })

    if (pageLabel) {
      pageLabel.textContent = `${currentPage} / ${totalPages}`
    }
    if (prevButton) {
      prevButton.disabled = currentPage === 1
    }
    if (nextButton) {
      nextButton.disabled = currentPage === totalPages
    }
  }

  prevButton?.addEventListener('click', () => {
    currentPage = Math.max(1, currentPage - 1)
    renderPage()
  })

  nextButton?.addEventListener('click', () => {
    currentPage = Math.min(totalPages, currentPage + 1)
    renderPage()
  })

  renderPage()
}

function initTopicReadingOrder() {
  const root = document.querySelector<HTMLElement>('[data-reading-order]')
  if (!root) {
    return
  }

  initPagedList(root, {
    itemSelector: '[data-reading-order-item]',
    prevSelector: '[data-reading-order-prev]',
    nextSelector: '[data-reading-order-next]',
    pageSelector: '[data-reading-order-page]'
  })
}

function initNoteGroupCards() {
  const roots = [...document.querySelectorAll<HTMLElement>('[data-note-group-card]')]
  if (roots.length === 0) {
    return
  }

  roots.forEach((root) => {
    initPagedList(root, {
      itemSelector: '[data-note-group-item]',
      prevSelector: '[data-note-group-prev]',
      nextSelector: '[data-note-group-next]',
      pageSelector: '[data-note-group-page]'
    })
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

function getFieldValue(form: HTMLFormElement, name: string): string {
  return form.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${name}"]`)?.value ?? ''
}

function setFieldValue(form: HTMLFormElement, name: string, value: string) {
  const field = form.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${name}"]`)
  if (field) {
    field.value = value
  }
}

function syncCustomSelect(root: HTMLElement) {
  const input = root.querySelector<HTMLInputElement>('[data-custom-select-input]')
  const valueLabel = root.querySelector<HTMLElement>('[data-custom-select-value]')
  const trigger = root.querySelector<HTMLButtonElement>('[data-custom-select-trigger]')
  const options = [...root.querySelectorAll<HTMLElement>('[data-custom-select-option]')]
  if (!input || !valueLabel || !trigger) {
    return
  }

  const selected = options.find((option) => option.dataset.value === input.value) ?? options[0]
  const label = selected?.dataset.label ?? trigger.dataset.placeholder ?? ''

  valueLabel.textContent = label
  options.forEach((option) => {
    const isSelected = option === selected
    option.dataset.selected = String(isSelected)
    option.setAttribute('aria-selected', String(isSelected))
  })
}

function closeCustomSelect(root: HTMLElement) {
  const trigger = root.querySelector<HTMLButtonElement>('[data-custom-select-trigger]')
  const menu = root.querySelector<HTMLElement>('[data-custom-select-menu]')
  const icon = root.querySelector<HTMLElement>('[data-custom-select-icon]')
  if (!trigger || !menu || !icon) {
    return
  }

  trigger.setAttribute('aria-expanded', 'false')
  menu.dataset.open = 'false'
  menu.classList.remove('pointer-events-auto', 'translate-y-0', 'opacity-100')
  menu.classList.add('pointer-events-none', 'translate-y-2', 'opacity-0')
  icon.classList.remove('rotate-180')
}

function openCustomSelect(root: HTMLElement, all: HTMLElement[]) {
  const trigger = root.querySelector<HTMLButtonElement>('[data-custom-select-trigger]')
  const menu = root.querySelector<HTMLElement>('[data-custom-select-menu]')
  const icon = root.querySelector<HTMLElement>('[data-custom-select-icon]')
  if (!trigger || !menu || !icon) {
    return
  }

  all.forEach((selectRoot) => {
    if (selectRoot !== root) {
      closeCustomSelect(selectRoot)
    }
  })

  trigger.setAttribute('aria-expanded', 'true')
  menu.dataset.open = 'true'
  menu.classList.remove('pointer-events-none', 'translate-y-2', 'opacity-0')
  menu.classList.add('pointer-events-auto', 'translate-y-0', 'opacity-100')
  icon.classList.add('rotate-180')
}

function syncAllCustomSelects(form: HTMLFormElement) {
  form.querySelectorAll<HTMLElement>('[data-custom-select]').forEach((root) => {
    syncCustomSelect(root)
    closeCustomSelect(root)
  })
}

function initCustomSelects(form: HTMLFormElement) {
  const roots = [...form.querySelectorAll<HTMLElement>('[data-custom-select]')]
  if (roots.length === 0) {
    return
  }

  roots.forEach((root) => syncCustomSelect(root))

  roots.forEach((root) => {
    const trigger = root.querySelector<HTMLButtonElement>('[data-custom-select-trigger]')
    const input = root.querySelector<HTMLInputElement>('[data-custom-select-input]')
    const options = [...root.querySelectorAll<HTMLButtonElement>('[data-custom-select-option]')]
    if (!trigger || !input) {
      return
    }

    trigger.addEventListener('click', () => {
      const expanded = trigger.getAttribute('aria-expanded') === 'true'
      if (expanded) {
        closeCustomSelect(root)
        return
      }

      openCustomSelect(root, roots)
    })

    options.forEach((option) => {
      option.addEventListener('click', () => {
        input.value = option.dataset.value ?? ''
        syncCustomSelect(root)
        closeCustomSelect(root)
        input.dispatchEvent(new Event('change', { bubbles: true }))
        trigger.focus()
      })
    })
  })

  document.addEventListener('click', (event) => {
    const target = event.target as Node | null
    if (!target) {
      return
    }

    roots.forEach((root) => {
      if (!root.contains(target)) {
        closeCustomSelect(root)
      }
    })
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      roots.forEach((root) => closeCustomSelect(root))
    }
  })
}

function initTagLoadMore(form: HTMLFormElement) {
  const list = form.querySelector<HTMLElement>('[data-tag-list]')
  const button = form.querySelector<HTMLButtonElement>('[data-load-more-tags]')
  const completeHint = form.querySelector<HTMLElement>('[data-tag-list-complete]')
  if (!list || !button) {
    return {
      reset() {}
    }
  }

  const items = [...list.querySelectorAll<HTMLElement>('[data-tag-item]')]
  const initialVisible = Number.parseInt(list.dataset.initialVisible ?? '30', 10)
  const step = Number.parseInt(list.dataset.step ?? '10', 10)
  let visibleCount = initialVisible

  const sync = () => {
    const checkedIndexes = items
      .filter((item) => item.querySelector<HTMLInputElement>('input[name="tags"]')?.checked)
      .map((item) => Number.parseInt(item.dataset.tagIndex ?? '-1', 10))
      .filter((index) => !Number.isNaN(index))
    const minimumVisible = checkedIndexes.length > 0 ? Math.max(...checkedIndexes) + 1 : 0
    const nextVisible = Math.max(visibleCount, minimumVisible)

    items.forEach((item, index) => {
      item.classList.toggle('hidden', index >= nextVisible)
    })
    const isComplete = nextVisible >= items.length
    button.classList.toggle('hidden', isComplete)
    button.style.display = isComplete ? 'none' : ''
    completeHint?.classList.toggle('hidden', !isComplete)
    if (completeHint) {
      completeHint.style.display = isComplete ? '' : 'none'
    }
  }

  button.addEventListener('click', () => {
    visibleCount = Math.min(items.length, visibleCount + step)
    sync()
  })

  form.addEventListener('change', (event) => {
    const target = event.target as HTMLInputElement | null
    if (target?.name === 'tags') {
      sync()
    }
  })

  sync()

  return {
    reset() {
      visibleCount = initialVisible
      sync()
    }
  }
}

function syncForm(form: HTMLFormElement, state: ArticleSearchState) {
  const q = form.querySelector<HTMLInputElement>('input[name="q"]')

  if (q) {
    q.value = state.q
  }
  setFieldValue(form, 'category', state.category)
  setFieldValue(form, 'lang', state.lang)
  setFieldValue(form, 'sort', state.sort)

  setCheckboxGroup(form, 'tags', state.tags)
  setCheckboxGroup(form, 'rating', state.rating)
  syncAllCustomSelects(form)
}

function getCheckedValues(form: HTMLFormElement, name: string): string[] {
  return [...form.querySelectorAll<HTMLInputElement>(`input[name="${name}"]:checked`)].map((input) => input.value)
}

function readFormState(form: HTMLFormElement): ArticleSearchState {
  const q = form.querySelector<HTMLInputElement>('input[name="q"]')?.value.trim() ?? ''
  const category = getFieldValue(form, 'category')
  const lang = getFieldValue(form, 'lang')
  const sort = getFieldValue(form, 'sort') || DEFAULT_SEARCH_STATE.sort

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

  initCustomSelects(form)
  const tagLoadController = initTagLoadMore(form)
  let state = parseSearchParams(new URLSearchParams(window.location.search))
  syncForm(form, state)
  tagLoadController.reset()

  const render = () => {
    const filtered = filterArticles(pageData.articles, state)
    const sorted = sortArticles(filtered, state.sort)
    const paginated = paginateArticles(sorted, state.page, pageData.pageSize)

    state = { ...state, page: paginated.currentPage }
    count.textContent = String(filtered.length)
    results.innerHTML = renderArticleGrid(paginated.items, '\u6ca1\u6709\u627e\u5230\u7b26\u5408\u6761\u4ef6\u7684\u6587\u7ae0\uff0c\u8bd5\u8bd5\u51cf\u5c11\u6807\u7b7e\u6216\u653e\u5bbd\u5173\u952e\u8bcd\u3002')
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
    tagLoadController.reset()
    render()
  })

  window.addEventListener('popstate', () => {
    state = parseSearchParams(new URLSearchParams(window.location.search))
    syncForm(form, state)
    tagLoadController.reset()
    render()
  })

  render()
}

initSentry()
initThemeToggle()
initMobileMenu()
initClipboardActions()
initBackToTop()
initTopicReadingOrder()
initNoteGroupCards()
initArticlesExplorer()
