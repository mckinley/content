// Vendored from mckinley/cntmgmt packages/astro @ 8645d298ebf2. Do not edit here.
// Side effects stay off in previews (design 04 §4.1): an API route (contact form, newsletter,
// payment) asks isPreviewRequest() first and refuses with "Disabled in the preview."

import { DEFAULT_PREFIX, normalizePrefix } from './path'

export const PREVIEW_DISABLED_MESSAGE = 'Disabled in the preview.'

export interface PreviewRequestOptions {
  /** The preview route's prefix; default '/cntmgmt-preview' */
  prefix?: string
  /**
   * The separate preview deployment's flag (CNTMGMT_PREVIEW_DEPLOYMENT=1): every request there is
   * a preview request.
   */
  deployment?: boolean | string | null
}

/**
 * Did a preview page send this request? Preview pages send `Referrer-Policy: same-origin`, so a
 * request from one carries its full URL as Referer and the path tells. A request without a
 * Referer counts as not from a preview.
 */
export function isPreviewRequest(request: Request, options: PreviewRequestOptions = {}): boolean {
  const flag = options.deployment
  if (flag === true || flag === '1' || flag === 'true') return true
  const prefix = normalizePrefix(options.prefix ?? DEFAULT_PREFIX)
  if (!prefix) return false
  const referer = request.headers.get('referer')
  if (!referer) return false
  let path: string
  try {
    path = new URL(referer).pathname
  } catch {
    return false
  }
  return path === prefix || path.startsWith(`${prefix}/`)
}

/**
 * The refusal: 403 with `{ error: "Disabled in the preview.", code: "DISABLED_IN_PREVIEW" }`, so
 * a form that shows `error` shows the sentence.
 */
export function previewDisabledResponse(): Response {
  return Response.json(
    { error: PREVIEW_DISABLED_MESSAGE, code: 'DISABLED_IN_PREVIEW' },
    { status: 403, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } }
  )
}
