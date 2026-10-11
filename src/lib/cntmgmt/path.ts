// Vendored from mckinley/cntmgmt packages/astro @ 8645d298ebf2. Do not edit here.
// Preview URLs carry the token as a path segment (design 04 §4.1), so iframes, new tabs and
// bookmarks work without cookies:
//   same deployment      <site>/cntmgmt-preview/<token>/<site path>     prefix '/cntmgmt-preview'
//   separate deployment  <preview origin>/<token>/<site path>           prefix ''

/** The prefix of the same-deployment preview route (path 1). */
export const DEFAULT_PREFIX = '/cntmgmt-preview'

/** Every live-preview token starts with this (design 04 §3.2: `cpv_` + 32 random bytes). */
export const TOKEN_PREFIX = 'cpv_'

// base64url of 32 bytes is 43 characters; the range leaves room for the server to change length.
const TOKEN_RE = /^cpv_[A-Za-z0-9_-]{16,256}$/

/**
 * Is this a well-formed preview token? A malformed one can't be valid, so the helper answers it
 * as an unknown token (401) without asking the server.
 */
export function isPreviewToken(value: string): boolean {
  return TOKEN_RE.test(value)
}

/** `''` or `/a/b`: one leading slash, no trailing slash. */
export function normalizePrefix(prefix: string): string {
  const trimmed = prefix.trim().replace(/^\/+|\/+$/g, '')
  return trimmed ? `/${trimmed}` : ''
}

export interface PreviewPath {
  /** The token segment as it appears in the URL (check it with `isPreviewToken`) */
  token: string
  /** The site path to render, always starting with `/` (trailing slash as requested) */
  path: string
}

/**
 * Split `<prefix>/<token>/<rest>` into the token and the site path `/<rest>`. Returns null when
 * the URL isn't a preview URL. With a prefix, any segment after it is taken as the token (a
 * malformed one is then answered as an unknown link). Without a prefix (a separate preview
 * deployment), only a segment that starts with `cpv_` counts, so `/_astro/…` and other
 * non-preview paths pass through.
 */
export function parsePreviewPath(url: URL | string, prefix: string): PreviewPath | null {
  const pathname =
    typeof url === 'string' ? new URL(url, 'http://preview.invalid').pathname : url.pathname
  const base = normalizePrefix(prefix)
  if (base && !pathname.startsWith(`${base}/`)) return null
  const rest = pathname.slice(base.length + 1)
  const slash = rest.indexOf('/')
  const token = slash === -1 ? rest : rest.slice(0, slash)
  if (!token) return null
  if (!base && !token.startsWith(TOKEN_PREFIX)) return null
  return { token, path: slash === -1 ? '/' : rest.slice(slash) }
}

/** `/<prefix>/<token>` + a site path: the preview address of that page. */
export function previewHref(prefix: string, token: string, path: string): string {
  const site = path.startsWith('/') ? path : `/${path}`
  return `${normalizePrefix(prefix)}/${token}${site}`
}
