// Vendored from mckinley/cntmgmt packages/astro @ 8645d298ebf2. Do not edit here.
// Plain pages for when there is nothing to preview: an expired link, an unreachable CMS, a draft
// the site can't render. Never a stack trace; every one is noindex and never cached.

import { frameAncestors, previewHeaders } from './headers'

export interface PreviewPage {
  status: number
  title: string
  message: string
  /** Optional technical detail (e.g. which field of which entry is invalid), shown small */
  detail?: string
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const STYLE =
  'body{font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;max-width:34rem;' +
  'margin:15vh auto;padding:0 1.25rem;color:#111;background:#fff}' +
  'h1{font-size:1.25rem;margin:0 0 .5rem}p{margin:0 0 1rem;color:#333}' +
  'pre{white-space:pre-wrap;word-break:break-word;font-size:.8125rem;background:#f4f4f4;' +
  'padding:.75rem;border-radius:4px}' +
  '@media (prefers-color-scheme:dark){body{color:#eee;background:#111}p{color:#ccc}pre{background:#222}}'

/** The HTML of a plain preview page. */
export function previewPageHtml(page: PreviewPage): string {
  const detail = page.detail ? `\n<pre>${escapeHtml(page.detail)}</pre>` : ''
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<meta name="referrer" content="same-origin">
<title>${escapeHtml(page.title)}</title>
<style>${STYLE}</style>
</head>
<body>
<h1>${escapeHtml(page.title)}</h1>
<p>${escapeHtml(page.message)}</p>${detail}
</body>
</html>
`
}

/** A plain preview page as a Response (no scripts; styles inline). */
export function previewPageResponse(
  page: PreviewPage,
  options: { endpoint?: string } = {}
): Response {
  const headers = previewHeaders(options)
  headers.set(
    'Content-Security-Policy',
    `default-src 'none'; style-src 'unsafe-inline'; ${frameAncestors(options.endpoint)}`
  )
  return new Response(previewPageHtml(page), { status: page.status, headers })
}
