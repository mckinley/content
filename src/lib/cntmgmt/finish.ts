// Vendored from mckinley/cntmgmt packages/astro @ 8645d298ebf2. Do not edit here.
// Turning a rendered page into a preview page (design 04 §4.1): links stay inside the preview,
// pending uploads show from cntmgmt, and the page gets noindex, the banner and the refresh script.

import { PREVIEW_SCRIPT, PREVIEW_STYLE } from './banner'
import { cmsOrigins, normalizeEndpoint, previewHeaders } from './headers'
import { decodeEntities, escapeAttribute, rewriteAttributes, type AttributeVisit } from './html'
import { normalizePrefix, previewHref } from './path'
import type { PreviewOverlay } from './protocol'

export interface FinishOptions {
  /** '/cntmgmt-preview' for the same deployment, '' for a separate preview deployment */
  prefix: string
  token: string
  overlay: PreviewOverlay
  /** The cntmgmt endpoint the site uses (for the refresh poll and frame-ancestors) */
  endpoint?: string | null
  /** Path prefixes that are files, never pages; default ['/_astro/'] */
  assets?: string[]
  /** A CSP nonce for the injected <style> and <script> */
  nonce?: string
  /** The response status; default 200 */
  status?: number
  /** Headers of the original response to keep (cookies, Vary…); the preview headers win */
  headers?: HeadersInit
  /** Inject the refresh script; default true */
  refresh?: boolean
}

/** The preview page for rendered HTML, with its headers. */
export function finishPreviewResponse(html: string, options: FinishOptions): Response {
  const endpoint = safeEndpoint(options.endpoint)
  const headers = new Headers(options.headers)
  for (const name of [
    'content-length',
    'content-encoding',
    'etag',
    'last-modified',
    'content-security-policy',
  ]) {
    headers.delete(name)
  }
  previewHeaders({ endpoint }).forEach((value, name) => headers.set(name, value))
  return new Response(finishPreviewHtml(html, options), { status: options.status ?? 200, headers })
}

/** The rewritten and injected HTML alone. */
export function finishPreviewHtml(html: string, options: FinishOptions): string {
  const prefix = normalizePrefix(options.prefix)
  const assets = options.assets ?? ['/_astro/']
  const media = new Map<string, string>()
  for (const m of options.overlay.media) media.set(m.url, m.src)

  const scanned = rewriteAttributes(html, (attr) =>
    rewriteAttribute(attr, { prefix, token: options.token, assets, media })
  )
  let out = scanned.html

  const nonce = options.nonce ? ` nonce="${escapeAttribute(options.nonce)}"` : ''
  const head =
    '<meta name="robots" content="noindex">' +
    '<meta name="referrer" content="same-origin">' +
    `<style data-cntmgmt-preview${nonce}>${PREVIEW_STYLE}</style>`
  const at =
    scanned.headEnd !== -1
      ? scanned.headEnd
      : scanned.htmlEnd !== -1
        ? scanned.htmlEnd
        : doctypeEnd(out)
  out = out.slice(0, at) + head + out.slice(at)

  const endpoint = safeEndpoint(options.endpoint)
  const blocked = options.overlay.blocked
  const blockedNote = blocked.length
    ? `<span data-cntmgmt-blocked title="${escapeAttribute(blockedTitle(blocked))}">${
        blocked.length === 1
          ? "1 change can't be previewed yet"
          : `${blocked.length} changes can't be previewed yet`
      }</span>`
    : ''
  const bar =
    '<cntmgmt-preview-spacer aria-hidden="true"></cntmgmt-preview-spacer>' +
    '<cntmgmt-preview-bar role="status">' +
    `<span data-cntmgmt-state>Preview, not published yet</span>${blockedNote}` +
    '</cntmgmt-preview-bar>'
  const script =
    options.refresh === false || !endpoint
      ? ''
      : `<script data-cntmgmt-preview${nonce} data-version="${escapeAttribute(options.overlay.version)}"` +
        ` data-version-url="${escapeAttribute(`${endpoint}/api/preview/v1/version?token=${encodeURIComponent(options.token)}`)}"` +
        ` data-origins="${escapeAttribute(cmsOrigins(endpoint).join(' '))}">${PREVIEW_SCRIPT}</script>`
  const close = out.toLowerCase().lastIndexOf('</body')
  const tail = bar + script
  return close === -1 ? out + tail : out.slice(0, close) + tail + out.slice(close)
}

function blockedTitle(blocked: PreviewOverlay['blocked']): string {
  const names = blocked.map((b) => b.title || b.entryKey).join(', ')
  return `${names}: also changed on the live site. Open it in the CMS to settle it; until then the preview shows the published version.`
}

function doctypeEnd(html: string): number {
  const m = /^\s*<!doctype[^>]*>/i.exec(html)
  return m ? m[0].length : 0
}

function safeEndpoint(endpoint?: string | null): string | undefined {
  try {
    return normalizeEndpoint(endpoint)
  } catch {
    return undefined
  }
}

interface RewriteContext {
  prefix: string
  token: string
  assets: string[]
  media: Map<string, string>
}

const URL_ATTRIBUTES = new Set(['src', 'href', 'poster', 'data', 'data-src'])
const SRCSET_ATTRIBUTES = new Set(['srcset', 'data-srcset', 'imagesrcset'])
const LINK_TAGS = new Set(['a', 'area'])

function rewriteAttribute(attr: AttributeVisit, ctx: RewriteContext): string | undefined {
  const { tag, name, value } = attr
  if (ctx.media.size) {
    if (URL_ATTRIBUTES.has(name)) {
      const src = mediaFor(value, ctx.media)
      if (src !== undefined) return src
    } else if (SRCSET_ATTRIBUTES.has(name)) {
      const next = rewriteSrcset(value, ctx.media)
      if (next !== value) return next
    } else if (name === 'style' && value.includes('url(')) {
      const next = rewriteCssUrls(value, ctx.media)
      if (next !== value) return next
    }
  }
  if (name === 'href' && LINK_TAGS.has(tag)) return internalLink(value, ctx)
  return undefined
}

/** A pending upload's signed URL for a reference to it (the URL itself, or with ?query/#hash). */
function mediaFor(value: string, media: Map<string, string>): string | undefined {
  const exact = media.get(value)
  if (exact !== undefined) return exact
  const cut = value.search(/[?#]/)
  if (cut > 0) return media.get(value.slice(0, cut))
  return undefined
}

function rewriteSrcset(value: string, media: Map<string, string>): string {
  return value
    .split(',')
    .map((candidate) => {
      const m = /^(\s*)(\S+)(.*)$/s.exec(candidate)
      if (!m) return candidate
      const src = mediaFor(m[2], media)
      return src === undefined ? candidate : `${m[1]}${src}${m[3]}`
    })
    .join(',')
}

function rewriteCssUrls(value: string, media: Map<string, string>): string {
  return value.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (whole, quote: string, url: string) => {
    const src = mediaFor(decodeEntities(url.trim()), media)
    return src === undefined ? whole : `url(${quote || '"'}${src}${quote || '"'})`
  })
}

/** `/x/` → `<prefix>/<token>/x/`, for links to the site's own pages (not files, not assets). */
function internalLink(value: string, ctx: RewriteContext): string | undefined {
  if (!value.startsWith('/') || value.startsWith('//')) return undefined
  const own = `${ctx.prefix}/${ctx.token}`
  if (
    value === own ||
    value.startsWith(`${own}/`) ||
    value.startsWith(`${own}?`) ||
    value.startsWith(`${own}#`)
  ) {
    return undefined
  }
  if (ctx.assets.some((a) => value.startsWith(a))) return undefined
  const path = value.replace(/[?#].*$/, '')
  const last = path.slice(path.lastIndexOf('/') + 1)
  if (/\.[A-Za-z0-9]{1,8}$/.test(last)) return undefined // a file, not a page
  return previewHref(ctx.prefix, ctx.token, value)
}
