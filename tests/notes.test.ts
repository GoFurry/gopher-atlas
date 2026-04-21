import { describe, expect, it } from 'vitest'
import { loadNoteDocuments } from '../src/lib/content'

describe('notes content loader', () => {
  it('loads grouped markdown notes with ordering metadata', async () => {
    const notes = await loadNoteDocuments(process.cwd())
    const uniqueGroups = new Set(notes.map((note) => note.groupSlug))
    const [onlyNote] = notes

    expect(uniqueGroups.size).toBe(1)
    expect(notes).toHaveLength(1)
    expect(notes.every((note) => note.title && note.description && note.author)).toBe(true)
    expect(onlyNote.groupSlug).toBe('cybersecurity')
    expect(onlyNote.group).toBe('网络安全')
    expect(onlyNote.slug).toBe('crs')
    expect(onlyNote.order).toBe(1)
  })
})
