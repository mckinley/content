// Vendored from mckinley/cntmgmt packages/astro @ 8645d298ebf2. Do not edit here.
// Fetching the drafts from cntmgmt (design 04 §3.3): GET <endpoint>/api/preview/v1/overlay with
// the token as a bearer credential, server to server. Errors become typed results that render
// as plain pages; nothing here throws for a bad link or an unreachable CMS.

import { normalizeEndpoint } from './headers'
import { previewPageResponse, type PreviewPage } from './pages'
import { isPreviewToken } from './path'
import type { PreviewOverlay } from './protocol'

/** The error body of every cntmgmt preview endpoint. */
export interface PreviewErrorBody {
  error: string
  message?: string
}

/** What `GET /api/preview/v1/version` answers. */
export interface PreviewVersion {
  version: string
  expiresAt: string
}

export type PreviewProblem =
  | 'expired' //       401 PREVIEW_TOKEN_INVALID: unknown, expired, revoked, or no longer a member
  | 'rate-limited' //  429
  | 'paused' //        503 POLICY_UNAVAILABLE: the site's CMS config can't be read
  | 'github' //        502 GITHUB_UNAVAILABLE
  | 'unreachable' //   the CMS didn't answer (network error, timeout)
  | 'server' //        any other error status
  | 'bad-response' //  an answer this helper can't read
  | 'misconfigured' // the site's endpoint setting is unusable

export interface PreviewError extends PreviewPage {
  problem: PreviewProblem
  /** The server's error code, when it sent one */
  code?: string
}

export type PreviewLoad = { ok: true; overlay: PreviewOverlay } | { ok: false; error: PreviewError }

export interface LoadPreviewOptions {
  /** The cntmgmt origin; default https://cntmgmt.com */
  endpoint?: string | null
  /** The fetch to use (a service binding's, a test stub); default the global fetch */
  fetch?: (input: Request) => Promise<Response>
  /** The incoming request: loads for the same request (and token) share one fetch */
  request?: Request
  /** Give up after this long; default 15 s */
  timeoutMs?: number
}

const COPY: Record<PreviewProblem, { status: number; title: string; message: string }> = {
  expired: {
    status: 401,
    title: 'Preview link expired',
    message: 'This preview link has expired. Open the preview again from the CMS.',
  },
  'rate-limited': {
    status: 429,
    title: 'Too many preview requests',
    message: 'The preview was asked for too often. Wait a minute, then reload this page.',
  },
  paused: {
    status: 503,
    title: 'Preview paused',
    message:
      "Editing and previews are paused for this site until its CMS settings are fixed. Please tell the site's developer.",
  },
  github: {
    status: 502,
    title: 'Preview unavailable',
    message: "The preview couldn't load the site's content from GitHub. Try again in a minute.",
  },
  unreachable: {
    status: 502,
    title: 'Preview unavailable',
    message: "The preview couldn't reach the CMS. Try again in a minute.",
  },
  server: {
    status: 502,
    title: 'Preview unavailable',
    message:
      "The CMS answered with an error. Try again in a minute; if it keeps happening, tell the site's developer.",
  },
  'bad-response': {
    status: 502,
    title: 'Preview unavailable',
    message:
      "The CMS sent a preview this site can't read. The site's developer may need to update its cntmgmt helper.",
  },
  misconfigured: {
    status: 500,
    title: 'Preview not set up',
    message: "This site's preview isn't set up correctly. The site's developer can fix this.",
  },
}

export function previewError(
  problem: PreviewProblem,
  extra: { code?: string; detail?: string } = {}
): PreviewError {
  return { problem, ...COPY[problem], ...extra }
}

/** The plain page for a failed load: the expired-link page, or one naming the problem. */
export function previewErrorResponse(
  error: PreviewError,
  options: { endpoint?: string | null } = {}
): Response {
  return previewPageResponse(error, { endpoint: safeEndpoint(options.endpoint) })
}

function safeEndpoint(endpoint?: string | null): string | undefined {
  try {
    return normalizeEndpoint(endpoint)
  } catch {
    return undefined
  }
}

const memo = new WeakMap<Request, Map<string, Promise<PreviewLoad>>>()

/**
 * The drafts a preview token sees, as cntmgmt would publish them now. Memoized per request when
 * `options.request` is given, so a middleware and a page can both ask.
 */
export function loadPreview(token: string, options: LoadPreviewOptions = {}): Promise<PreviewLoad> {
  const key = `${options.endpoint ?? ''}\n${token}`
  const perRequest = options.request ? (memo.get(options.request) ?? new Map()) : undefined
  const cached = perRequest?.get(key)
  if (cached) return cached
  const load = fetchOverlay(token, options)
  if (perRequest && options.request) {
    perRequest.set(key, load)
    memo.set(options.request, perRequest)
  }
  return load
}

async function fetchOverlay(token: string, options: LoadPreviewOptions): Promise<PreviewLoad> {
  if (!isPreviewToken(token)) return { ok: false, error: previewError('expired') }
  let endpoint: string
  try {
    endpoint = normalizeEndpoint(options.endpoint)
  } catch (e) {
    return { ok: false, error: previewError('misconfigured', { detail: (e as Error).message }) }
  }
  const request = new Request(`${endpoint}/api/preview/v1/overlay`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  })
  const send = options.fetch ?? ((r: Request) => fetch(r))
  let response: Response
  try {
    response = await withTimeout(send(request), options.timeoutMs ?? 15_000)
  } catch {
    return { ok: false, error: previewError('unreachable') }
  }
  if (!response.ok) return { ok: false, error: await errorOf(response) }
  let body: unknown
  try {
    body = await response.json()
  } catch {
    return { ok: false, error: previewError('bad-response') }
  }
  const problem = overlayProblem(body)
  if (problem) return { ok: false, error: previewError('bad-response', { detail: problem }) }
  return { ok: true, overlay: body as PreviewOverlay }
}

async function errorOf(response: Response): Promise<PreviewError> {
  let code: string | undefined
  try {
    const body = (await response.json()) as Partial<PreviewErrorBody>
    if (typeof body?.error === 'string') code = body.error
  } catch {
    // not JSON: the status decides
  }
  const extra = code ? { code } : {}
  if (response.status === 401 || code === 'PREVIEW_TOKEN_INVALID')
    return previewError('expired', extra)
  if (response.status === 429) return previewError('rate-limited', extra)
  if (code === 'POLICY_UNAVAILABLE') return previewError('paused', extra)
  if (code === 'GITHUB_UNAVAILABLE') return previewError('github', extra)
  return previewError('server', {
    ...extra,
    detail: `HTTP ${response.status}${code ? ` ${code}` : ''}`,
  })
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), ms)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    clearTimeout(timer)
  }
}

/** Why a body isn't a v1 overlay this helper can use, or null when it is. */
export function overlayProblem(body: unknown): string | null {
  if (!body || typeof body !== 'object') return 'not an object'
  const o = body as Record<string, unknown>
  if (o.v !== 1) return `unsupported version ${JSON.stringify(o.v)}`
  for (const key of ['project', 'repo', 'branch', 'base', 'version', 'expiresAt'] as const) {
    if (typeof o[key] !== 'string') return `${key} is not a string`
  }
  if (!Array.isArray(o.files) || !Array.isArray(o.media) || !Array.isArray(o.blocked)) {
    return 'files, media and blocked must be lists'
  }
  for (const f of o.files as unknown[]) {
    const file = f as Record<string, unknown> | null
    if (!file || typeof file.path !== 'string') return 'a file has no path'
    if (file.op !== 'write' && file.op !== 'delete') return `${file.path}: unknown op`
    if (file.op === 'write' && typeof file.text !== 'string') return `${file.path}: no text`
  }
  for (const m of o.media as unknown[]) {
    const media = m as Record<string, unknown> | null
    if (!media || typeof media.url !== 'string' || typeof media.src !== 'string') {
      return 'a media file has no url or src'
    }
  }
  return null
}
