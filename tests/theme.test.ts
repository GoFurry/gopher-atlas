import { describe, expect, it } from 'vitest'
import { applyTheme, readStoredTheme, resolveTheme, storeTheme, toggleTheme } from '../src/scripts/theme'

describe('theme helpers', () => {
  it('uses stored theme first and otherwise falls back to system preference', () => {
    expect(resolveTheme('dark', true)).toBe('dark')
    expect(resolveTheme(null, true)).toBe('light')
    expect(resolveTheme(null, false)).toBe('dark')
  })

  it('persists and applies theme state', () => {
    const storage = new Map<string, string>()
    const storageShim = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value)
      }
    }

    storeTheme('light', storageShim)
    expect(readStoredTheme(storageShim)).toBe('light')
    expect(toggleTheme('light')).toBe('dark')

    applyTheme('light', document)
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
