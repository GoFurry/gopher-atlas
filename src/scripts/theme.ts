export const THEME_STORAGE_KEY = 'gopheratlas-theme'

export type ThemeMode = 'light' | 'dark'

export function resolveTheme(storedTheme: string | null, prefersLight: boolean): ThemeMode {
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme
  }

  return prefersLight ? 'light' : 'dark'
}

export function applyTheme(theme: ThemeMode, documentRef: Document = document): void {
  documentRef.documentElement.dataset.theme = theme
}

export function toggleTheme(theme: ThemeMode): ThemeMode {
  return theme === 'dark' ? 'light' : 'dark'
}

export function readStoredTheme(storage: Pick<Storage, 'getItem'> | null): string | null {
  return storage?.getItem(THEME_STORAGE_KEY) ?? null
}

export function storeTheme(theme: ThemeMode, storage: Pick<Storage, 'setItem'> | null): void {
  storage?.setItem(THEME_STORAGE_KEY, theme)
}
