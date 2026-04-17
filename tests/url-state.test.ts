import { describe, expect, it } from 'vitest'
import { parseSearchParams, stringifySearchState } from '../src/lib/articles'

describe('article URL state', () => {
  it('parses supported query parameters into a normalized state object', () => {
    const state = parseSearchParams(new URLSearchParams('q=gc&category=Runtime&tags=memory,gc&rating=S,A%2B&sort=rating&lang=en&page=3'))

    expect(state).toEqual({
      q: 'gc',
      category: 'Runtime',
      tags: ['memory', 'gc'],
      rating: ['S', 'A+'],
      sort: 'rating',
      lang: 'en',
      page: 3
    })
  })

  it('serializes state while omitting default values', () => {
    const query = stringifySearchState({
      q: 'pprof',
      category: '',
      tags: ['profiling'],
      rating: [],
      sort: 'recommended',
      lang: '',
      page: 1
    })

    expect(query).toBe('?q=pprof&tags=profiling')
  })
})
