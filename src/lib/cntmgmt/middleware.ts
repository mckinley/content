// Vendored from mckinley/cntmgmt packages/astro @ 8645d298ebf2. Do not edit here.
// Astro middleware for previews (design 04 §4.1). It is typed structurally, so this file needs no
// Astro import and works with any Astro version that has middleware rewrites (4.13+).
//
//   Separate preview deployment (path 2), output: 'server':
//     export const onRequest = previewMiddleware()
//     /<token>/<path> loads the overlay into locals.cntmgmtPreview and renders <path>; pages read
//     the overlay from locals.
//   Same deployment (path 1):
//     export const onRequest = previewMiddleware({ prefix: '/cntmgmt-preview', rewrite: false })
//     /cntmgmt-preview/<token>/<path> reaches the site's catch-all preview route, which reads the
//     overlay from locals. (A page can't post-process its own HTML, so the middleware does.)
//
// Either way the response becomes a preview page: links rewritten, pending media from cntmgmt,
// noindex, the banner and the refresh script. A bad or expired link gets the plain 401 page.

import { finishPreviewResponse } from './finish'
import { previewHeaders } from './headers'
import { loadPreview, previewErrorResponse } from './load'
import { normalizePrefix, parsePreviewPath, previewHref } from './path'
import type { PreviewOverlay } from './protocol'

/** What the middleware puts in `locals.cntmgmtPreview` for a preview request. */
export interface PreviewContext {
  token: string
  /** The site path being previewed, e.g. "/news/2026-10-11-hello/" */
  path: string
  overlay: PreviewOverlay
  /** '' or '/cntmgmt-preview' */
  prefix: string
  /** The endpoint the overlay came from */
  endpoint: string | undefined
}

export const PREVIEW_LOCALS_KEY = 'cntmgmtPreview'

/** The subset of Astro's APIContext the middleware uses. */
export interface MiddlewareContextLike {
  request: Request
  url: URL
  locals: object
  isPrerendered?: boolean
}
export type MiddlewareNextLike = (rewritePayload?: string | URL | Request) => Promise<Response>

export interface PreviewMiddlewareOptions {
  /** '' (default) for a separate preview deployment, '/cntmgmt-preview' for the same deployment */
  prefix?: string
  /** The cntmgmt endpoint, or a function of the request that returns it (e.g. from env) */
  endpoint?:
    | string
    | null
    | ((
        context: MiddlewareContextLike
      ) => string | null | undefined | Promise<string | null | undefined>)
  /** The fetch for the overlay (a service binding's, a test stub) */
  fetch?: (input: Request) => Promise<Response>
  /** Render the plain path instead of the requested one; default true when prefix is '' */
  rewrite?: boolean
  /** Path prefixes that are files, never pages; default ['/_astro/'] */
  assets?: string[]
}

/** The preview context a page runs in, or undefined outside a preview. */
export function getPreview(locals: object | undefined): PreviewContext | undefined {
  return (locals as Record<string, PreviewContext | undefined> | undefined)?.[PREVIEW_LOCALS_KEY]
}

export function previewMiddleware(options: PreviewMiddlewareOptions = {}) {
  const prefix = normalizePrefix(options.prefix ?? '')
  const rewrite = options.rewrite ?? prefix === ''
  return async (context: MiddlewareContextLike, next: MiddlewareNextLike): Promise<Response> => {
    if (context.isPrerendered) return next()
    const parsed = parsePreviewPath(context.url, prefix)
    if (!parsed) {
      if (prefix) return next()
      // A separate preview deployment answers non-preview paths as usual, but never indexed.
      return noindex(await next())
    }
    const endpoint =
      typeof options.endpoint === 'function'
        ? ((await options.endpoint(context)) ?? undefined)
        : (options.endpoint ?? undefined)
    const load = await loadPreview(parsed.token, {
      endpoint,
      fetch: options.fetch,
      request: context.request,
    })
    if (!load.ok) return previewErrorResponse(load.error, { endpoint })
    const preview: PreviewContext = {
      token: parsed.token,
      path: parsed.path,
      overlay: load.overlay,
      prefix,
      endpoint,
    }
    ;(context.locals as Record<string, unknown>)[PREVIEW_LOCALS_KEY] = preview
    const response = rewrite ? await next(`${parsed.path}${context.url.search}`) : await next()
    return finishResponse(response, preview, options.assets)
  }
}

/** Make any response from a preview request a preview response. */
export async function finishResponse(
  response: Response,
  preview: PreviewContext,
  assets?: string[]
): Promise<Response> {
  const type = response.headers.get('content-type') ?? ''
  if (response.status >= 300 && response.status < 400) {
    const headers = new Headers(response.headers)
    const location = headers.get('location')
    if (location?.startsWith('/') && !location.startsWith('//')) {
      const own = `${preview.prefix}/${preview.token}`
      if (location !== own && !location.startsWith(`${own}/`)) {
        headers.set('location', previewHref(preview.prefix, preview.token, location))
      }
    }
    return withPreviewHeaders(
      new Response(response.body, { status: response.status, headers }),
      preview.endpoint,
      false
    )
  }
  if (!/^text\/html\b/i.test(type)) return withPreviewHeaders(response, preview.endpoint, false)
  const html = await response.text()
  return finishPreviewResponse(html, {
    prefix: preview.prefix,
    token: preview.token,
    overlay: preview.overlay,
    endpoint: preview.endpoint,
    assets,
    status: response.status,
    headers: response.headers,
  })
}

function withPreviewHeaders(
  response: Response,
  endpoint: string | undefined,
  html: boolean
): Response {
  const headers = new Headers(response.headers)
  previewHeaders({ endpoint }).forEach((value, name) => {
    if (!html && name === 'content-type') return
    headers.set(name, value)
  })
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

function noindex(response: Response): Response {
  const headers = new Headers(response.headers)
  headers.set('X-Robots-Tag', 'noindex')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
