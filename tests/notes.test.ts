import { describe, expect, it } from 'vitest'
import { loadNoteDocuments } from '../src/lib/content'

describe('notes content loader', () => {
  it('loads grouped markdown notes with ordering metadata', async () => {
    const notes = await loadNoteDocuments(process.cwd())
    const runtimeNotes = notes.filter((note) => note.groupSlug === 'runtime-journal')
    const uniqueGroups = new Set(notes.map((note) => note.groupSlug))

    expect(uniqueGroups.size).toBe(5)
    expect(runtimeNotes).toHaveLength(7)
    expect(runtimeNotes.map((note) => note.order)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(notes.every((note) => note.title && note.description && note.author)).toBe(true)
  })
})
