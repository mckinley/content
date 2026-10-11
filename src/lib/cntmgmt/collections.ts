// Vendored from mckinley/cntmgmt packages/astro @ 8645d298ebf2. Do not edit here.
// The overlay's files as content collection changes (design 04 §4.1): per collection, entries
// to put (parsed exactly as Astro's loaders parse files) and ids to delete. The shape matches
// circlefly's DraftOverlay: { [collection]: { put: { [id]: data | { data, body } }, delete } }.

import yaml from 'js-yaml'
import type { PreviewOverlay } from './protocol'

export type ContentFormat = 'yaml' | 'json' | 'markdown'

export interface CollectionMapping {
  /** The collection's folder, repo-relative as in cntmgmt.config.json (e.g. "site/src/content/news") */
  dir: string
  /** yaml and json give the data; markdown (also .mdx) gives `{ data, body }` from frontmatter */
  format: ContentFormat
  /** File endings that are entries; default by format (yaml: .yaml .yml, json: .json, markdown: .md .markdown .mdx) */
  extensions?: string[]
  /**
   * The entry id for a file, given its path below `dir` (e.g. "2025-01-24-ripples.yaml"). The
   * default is Astro's glob loader's: the frontmatter/data `slug` if set, else the path without
   * its ending, each folder slugged, a trailing `/index` dropped. For plain names that is the
   * file name without its ending. Throw to refuse a file (it becomes a PreviewDataError).
   */
  id?: (file: string, data?: unknown) => string
}

export type CollectionMap = Record<string, CollectionMapping>

/** A markdown entry: frontmatter data plus the body after it (trimmed, as Astro stores it). */
export interface MarkdownEntry {
  data: Record<string, unknown>
  body: string
}

export interface CollectionChanges {
  put: Record<string, unknown>
  delete: string[]
}

export type PreviewCollections<M extends CollectionMap> = { [K in keyof M]?: CollectionChanges }

/** A draft file the site can't read (a YAML error, a file name the collection doesn't allow). */
export class PreviewDataError extends Error {
  /** The repo path of the file */
  readonly path: string
  constructor(path: string, message: string) {
    super(`${path}: ${message}`)
    this.name = 'PreviewDataError'
    this.path = path
  }
}

const DEFAULT_EXTENSIONS: Record<ContentFormat, string[]> = {
  yaml: ['.yaml', '.yml'],
  json: ['.json'],
  markdown: ['.md', '.markdown', '.mdx'],
}

const trimSlashes = (p: string) => p.replace(/^\/+|\/+$/g, '')

/**
 * Sort the overlay's files into the site's collections. Files outside every mapped folder, with
 * another ending, or marked as sidecars are left out (Astro wouldn't load them either). Blocked
 * entries never appear: the server leaves their files out, so the published version shows.
 */
export function toCollections<M extends CollectionMap>(
  overlay: PreviewOverlay,
  map: M
): PreviewCollections<M> {
  const out: PreviewCollections<M> = {}
  const mappings = (Object.entries(map) as [keyof M & string, CollectionMapping][])
    .map(([name, m]) => ({ name, m, dir: trimSlashes(m.dir) }))
    .sort((a, b) => b.dir.length - a.dir.length) // the deepest folder wins
  const seen = new Map<string, string>()
  for (const file of overlay.files) {
    if (file.role === 'sidecar') continue
    const path = trimSlashes(file.path)
    const hit = mappings.find(({ dir }) => !dir || path.startsWith(`${dir}/`))
    if (!hit) continue
    const relative = hit.dir ? path.slice(hit.dir.length + 1) : path
    const extensions = hit.m.extensions ?? DEFAULT_EXTENSIONS[hit.m.format]
    const ending = extensions.find((e) => relative.toLowerCase().endsWith(e.toLowerCase()))
    if (!ending) continue
    const changes = (out[hit.name] ??= { put: {}, delete: [] })
    if (file.op === 'delete') {
      const id = idOf(hit.m, relative, ending, undefined, path)
      if (!changes.delete.includes(id)) changes.delete.push(id)
      continue
    }
    const value = parseEntry(hit.m.format, file.text ?? '', path)
    const id = idOf(
      hit.m,
      relative,
      ending,
      hit.m.format === 'markdown' ? (value as MarkdownEntry).data : value,
      path
    )
    const where = `${hit.name}\n${id}`
    const other = seen.get(where)
    if (other && other !== path) {
      throw new PreviewDataError(path, `gives the same id "${id}" as ${other}`)
    }
    seen.set(where, path)
    changes.put[id] = value
  }
  return out
}

function idOf(
  m: CollectionMapping,
  relative: string,
  ending: string,
  data: unknown,
  path: string
): string {
  try {
    const id = m.id ? m.id(relative, data) : defaultId(relative, ending, data)
    if (typeof id !== 'string' || !id) throw new Error('no id')
    return id
  } catch (e) {
    throw new PreviewDataError(path, e instanceof Error ? e.message : String(e))
  }
}

/** Astro's glob-loader id (generateIdDefault): data.slug, else the slugged path without ending. */
export function defaultId(relative: string, ending: string, data?: unknown): string {
  const slug = data && typeof data === 'object' ? (data as Record<string, unknown>).slug : undefined
  if (typeof slug === 'string' && slug) return slug
  const stem = relative.slice(0, relative.length - ending.length)
  return stem
    .split('/')
    .map(githubSlug)
    .join('/')
    .replace(/\/index$/, '')
}

/** github-slugger's slug() for one segment: lower case, punctuation dropped, spaces to dashes. */
function githubSlug(segment: string): string {
  return segment
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, '')
    .replace(/ /g, '-')
}

/** Parse one file the way Astro's loaders do (js-yaml for YAML and frontmatter). */
export function parseEntry(format: ContentFormat, text: string, path = 'file'): unknown {
  try {
    if (format === 'yaml') return yaml.load(text, { filename: path })
    if (format === 'json') return JSON.parse(text)
    return parseFrontmatter(text)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    throw new PreviewDataError(path, message.split('\n')[0] || 'unreadable')
  }
}

// @astrojs/markdown-remark's frontmatter rule (parseFrontmatter): `---` YAML at the very start
// (after a BOM or blank lines). TOML (`+++`) frontmatter isn't supported here.
const FRONTMATTER = /(?:^\uFEFF?|^\s*\n)(?:---)([\s\S]*?\n)(?:---)/

/** Frontmatter and body of a Markdown file, as Astro's markdown entries have them. */
export function parseFrontmatter(text: string): MarkdownEntry {
  if (/(?:^\uFEFF?|^\s*\n)\+\+\+/.test(text)) {
    throw new Error('TOML frontmatter (+++) is not supported in the live preview')
  }
  const match = FRONTMATTER.exec(text)
  if (!match) return { data: {}, body: text.trim() }
  const raw = match[1]
  const parsed = yaml.load(raw)
  const data = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
  return { data, body: text.replace(`---${raw}---`, '').trim() }
}
