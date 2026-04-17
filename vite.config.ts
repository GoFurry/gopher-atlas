import { resolve } from 'node:path'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { defineConfig } from 'vite'

function collectHtmlEntries(rootDir: string): Record<string, string> {
  const entries: Record<string, string> = {}
  const pending = ['.']

  while (pending.length > 0) {
    const relativeDir = pending.pop()!
    const absoluteDir = resolve(rootDir, relativeDir)

    for (const entry of readdirSync(absoluteDir)) {
      if (entry === 'dist' || entry === 'node_modules' || entry === '.git' || entry === 'src' || entry === 'scripts' || entry === 'public' || entry === 'tests') {
        continue
      }

      const relativePath = relativeDir === '.' ? entry : `${relativeDir}/${entry}`
      const absolutePath = resolve(rootDir, relativePath)
      const stats = statSync(absolutePath)

      if (stats.isDirectory()) {
        pending.push(relativePath)
        continue
      }

      if (entry.endsWith('.html')) {
        const name = relativePath.replace(/\.html$/, '').replace(/[\\/]/g, '-')
        entries[name] = absolutePath
      }
    }
  }

  return entries
}

export default defineConfig(() => {
  const rootDir = process.cwd()
  const htmlInputs = existsSync(resolve(rootDir, 'index.html')) ? collectHtmlEntries(rootDir) : {}

  return {
    build: {
      rollupOptions: {
        input: htmlInputs
      }
    },
    test: {
      environment: 'jsdom'
    }
  }
})
