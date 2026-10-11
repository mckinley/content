import { parseFrontmatter } from './cntmgmt'

export interface KeystaticPost {
  slug: string
  entry: {
    title: string
    publishedDate?: string | Date
    description?: string
    author?: string
    featured?: boolean
    tags?: (string | null)[]
  }
}

// The Keystatic posts' frontmatter, bundled at build time: pages rendered on request (live
// previews) can't read files the way Keystatic's reader does. Sorted by file name, as listed.
const files = import.meta.glob<string>('/content/keystatic/posts/*.mdoc', {
  query: '?raw',
  import: 'default',
  eager: true,
})

export function keystaticPosts(): KeystaticPost[] {
  return Object.entries(files)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, text]) => ({
      slug: path.replace(/^.*\/|\.mdoc$/g, ''),
      entry: parseFrontmatter(text).data as KeystaticPost['entry'],
    }))
}
