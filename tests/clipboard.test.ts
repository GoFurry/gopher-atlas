import { describe, expect, it, vi } from 'vitest'
import { copyText } from '../src/scripts/clipboard'

describe('clipboard helper', () => {
  it('uses navigator.clipboard when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: { writeText }
    })

    const result = await copyText('https://gopheratlas.com')

    expect(result).toBe(true)
    expect(writeText).toHaveBeenCalledWith('https://gopheratlas.com')
  })
})
