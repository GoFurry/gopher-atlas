import { describe, expect, it } from 'vitest'
import { parseSearchParams, stringifySearchState } from '../src/lib/articles'

describe('article URL state', () => {
  it('parses supported query parameters into a normalized state object', () => {
    const state = parseSearchParams(new URLSearchParams('q=gc&category=Go%20New%20Features&tags=gc,memory&rating=A%2B&sort=rating&lang=zh&page=3'))

    expect(state).toEqual({
      q: 'gc',
      category: 'Go New Features',
      tags: ['gc', 'memory'],
      rating: ['A+'],
      sort: 'rating',
      lang: 'zh',
      page: 3
    })
  })

  it('serializes state while omitting default values', () => {
    const query = stringifySearchState({
      q: 'pprof',
      category: '',
      tags: ['profiling'],
      rating: [],
      sort: 'published-date',
      lang: '',
      page: 1
    })

    expect(query).toBe('?q=pprof&tags=profiling')
  })
})
