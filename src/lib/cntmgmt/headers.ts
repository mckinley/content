// Vendored from mckinley/cntmgmt packages/astro @ 8645d298ebf2. Do not edit here.
// Where the CMS is, and the headers every preview response carries (design 04 §4.1).

/** cntmgmt's production origin: the default endpoint and the CMS that may frame previews. */
export const DEFAULT_ENDPOINT = 'https://cntmgmt.com'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

/**
 * The CMS endpoint as `https://host[/path]` without a trailing slash. Plain http is accepted
 * only for local testing (localhost). Throws for anything else, which the loader reports as a
 * setup problem rather than calling it.
 */
export function normalizeEndpoint(endpoint?: string | null): string {
  const raw = (endpoint ?? '').trim() || DEFAULT_ENDPOINT
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new TypeError(`The cntmgmt endpoint "${raw}" is not a URL`)
  }
  const local = url.protocol === 'http:' && LOCAL_HOSTS.has(url.hostname)
  if (url.protocol !== 'https:' && !local) {
    throw new TypeError(`The cntmgmt endpoint must be https (or http://localhost): "${raw}"`)
  }
  if (url.search || url.hash || url.username || url.password) {
    throw new TypeError(`The cntmgmt endpoint must be a plain origin or path: "${raw}"`)
  }
  return `${url.origin}${url.pathname.replace(/\/+$/, '')}`
}

/** The origins that may frame a preview and send it refresh messages: cntmgmt and the endpoint. */
export function cmsOrigins(endpoint?: string | null): string[] {
  const origins = [new URL(DEFAULT_ENDPOINT).origin]
  try {
    const own = new URL(normalizeEndpoint(endpoint)).origin
    if (!origins.includes(own)) origins.push(own)
  } catch {
    // an unusable endpoint adds nothing
  }
  return origins
}

/** `frame-ancestors 'self' https://cntmgmt.com <endpoint origin>` */
export function frameAncestors(endpoint?: string | null): string {
  return `frame-ancestors 'self' ${cmsOrigins(endpoint).join(' ')}`
}

/**
 * Headers for a preview page: never cached or indexed, the token never leaves the site in a
 * Referer (the site's own API routes can still tell a preview page called them), and only the
 * site itself and the CMS may frame it.
 */
export function previewHeaders(options: { endpoint?: string | null } = {}): Headers {
  return new Headers({
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'private, no-store',
    'X-Robots-Tag': 'noindex',
    'Referrer-Policy': 'same-origin',
    'Content-Security-Policy': frameAncestors(options.endpoint),
  })
}
