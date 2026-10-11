// Vendored from mckinley/cntmgmt packages/astro @ 8645d298ebf2. Do not edit here.
// What a preview page gets injected (design 04 §4.1): a slim fixed banner and the refresh script.
// Both are constant text (the page's values travel in data-* attributes), so a site with a strict
// Content-Security-Policy can allow them by hash (`previewCspHashes()`) or pass a nonce. No
// inline event handlers, no eval, no dependencies.

/** The banner's look: a slim bar fixed to the bottom edge, plus room for it under the page. */
export const PREVIEW_STYLE =
  'cntmgmt-preview-bar{all:initial;position:fixed;z-index:2147483647;left:0;right:0;bottom:0;' +
  'display:flex;flex-wrap:wrap;gap:.25rem 1rem;align-items:center;justify-content:center;' +
  'padding:.3rem .75rem;background:#111;color:#fff;' +
  'font:500 12px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;' +
  'box-shadow:0 -1px 0 rgba(255,255,255,.15)}' +
  'cntmgmt-preview-bar span{all:unset}' +
  'cntmgmt-preview-bar [data-cntmgmt-blocked]{color:#ffd27a}' +
  'cntmgmt-preview-spacer{all:initial;display:block;height:2rem}' +
  '@media print{cntmgmt-preview-bar,cntmgmt-preview-spacer{display:none}}'

/**
 * Polls `<endpoint>/api/preview/v1/version?token=…` every 1.5 s while the page is visible, and
 * checks at once on a `{ type: 'cntmgmt:refresh' }` message from the CMS. On a new version it
 * reloads, keeping the scroll position. A 401 (the link expired) stops it and says so.
 */
export const PREVIEW_SCRIPT = `(function () {
  var s = document.currentScript
  if (!s || window.__cntmgmtPreview) return
  window.__cntmgmtPreview = true
  var url = s.getAttribute('data-version-url')
  var current = s.getAttribute('data-version')
  var origins = (s.getAttribute('data-origins') || '').split(' ')
  var key = 'cntmgmt-preview-scroll:' + location.pathname
  var timer = 0, busy = false, stopped = false, failures = 0
  try {
    var saved = sessionStorage.getItem(key)
    if (saved !== null) {
      sessionStorage.removeItem(key)
      var y = Number(saved) || 0
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
      var restore = function () { window.scrollTo(0, y) }
      restore()
      window.addEventListener('load', restore)
    }
  } catch (e) {}
  function reload() {
    try { sessionStorage.setItem(key, String(window.scrollY || window.pageYOffset || 0)) } catch (e) {}
    location.reload()
  }
  function expired() {
    stopped = true
    var bar = document.querySelector('cntmgmt-preview-bar [data-cntmgmt-state]')
    if (bar) bar.textContent = 'This preview link has expired. Open the preview again from the CMS.'
  }
  function schedule(ms) {
    if (stopped || timer || document.visibilityState === 'hidden') return
    timer = setTimeout(check, ms)
  }
  function check() {
    timer = 0
    if (stopped || busy || !url) return
    busy = true
    fetch(url, { cache: 'no-store', credentials: 'omit' })
      .then(function (r) {
        if (r.status === 401) return expired()
        if (!r.ok) throw new Error(String(r.status))
        return r.json().then(function (d) {
          failures = 0
          if (d && typeof d.version === 'string' && d.version !== current) {
            stopped = true
            reload()
          }
        })
      })
      .catch(function () { failures = Math.min(failures + 1, 5) })
      .then(function () {
        busy = false
        schedule(failures ? 1500 * Math.pow(2, failures) : 1500)
      })
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      if (!timer && !busy) check()
    } else if (timer) {
      clearTimeout(timer)
      timer = 0
    }
  })
  window.addEventListener('message', function (e) {
    if (origins.indexOf(e.origin) === -1) return
    if (!e.data || e.data.type !== 'cntmgmt:refresh') return
    if (timer) { clearTimeout(timer); timer = 0 }
    if (!busy) check()
  })
  schedule(1500)
})()`

/** 'sha256-…' sources for a Content-Security-Policy that allows the injected script and style. */
export async function previewCspHashes(): Promise<{ script: string; style: string }> {
  const hash = async (text: string) => {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
    let binary = ''
    for (const byte of new Uint8Array(digest)) binary += String.fromCharCode(byte)
    return `'sha256-${btoa(binary)}'`
  }
  return { script: await hash(PREVIEW_SCRIPT), style: await hash(PREVIEW_STYLE) }
}
