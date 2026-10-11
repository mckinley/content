// Vendored from mckinley/cntmgmt packages/astro @ 8645d298ebf2. Do not edit here.
// A small HTML start-tag scanner: it visits the attributes of every start tag and leaves
// everything else (text, comments, script and style bodies) exactly as it was. Enough to rewrite
// links and media URLs in a rendered page without a DOM, in any runtime.

/** Elements whose content is raw text: never scanned for tags. */
const RAW_TEXT = new Set([
  'script',
  'style',
  'textarea',
  'title',
  'xmp',
  'iframe',
  'noembed',
  'noframes',
  'plaintext',
])

export interface AttributeVisit {
  /** Lower-case tag name */
  tag: string
  /** Lower-case attribute name */
  name: string
  /** The value with character references decoded */
  value: string
}

/** Return the new decoded value, or undefined to keep the attribute as written. */
export type AttributeRewriter = (attr: AttributeVisit) => string | undefined

export interface ScanResult {
  html: string
  /** Offset just after the first `<head …>` start tag in the output, or -1 */
  headEnd: number
  /** Offset just after the first `<html …>` start tag in the output, or -1 */
  htmlEnd: number
}

const NAME_END = /[\s/>]/

export function rewriteAttributes(html: string, rewrite: AttributeRewriter): ScanResult {
  let out = ''
  let i = 0
  let headEnd = -1
  let htmlEnd = -1
  const n = html.length
  while (i < n) {
    const lt = html.indexOf('<', i)
    if (lt === -1) {
      out += html.slice(i)
      break
    }
    out += html.slice(i, lt)
    i = lt
    if (html.startsWith('<!--', i)) {
      const end = html.indexOf('-->', i + 4)
      const stop = end === -1 ? n : end + 3
      out += html.slice(i, stop)
      i = stop
      continue
    }
    const next = html[i + 1]
    if (next === '!' || next === '?' || next === '/') {
      const end = html.indexOf('>', i + 1)
      const stop = end === -1 ? n : end + 1
      out += html.slice(i, stop)
      i = stop
      continue
    }
    if (!next || !/[A-Za-z]/.test(next)) {
      out += '<'
      i += 1
      continue
    }
    // A start tag.
    let j = i + 1
    while (j < n && !NAME_END.test(html[j])) j++
    const tag = html.slice(i + 1, j).toLowerCase()
    const parsed = scanAttributes(html, j, tag, rewrite)
    out += `<${html.slice(i + 1, j)}${parsed.text}`
    i = parsed.end
    if (tag === 'head' && headEnd === -1) headEnd = out.length
    if (tag === 'html' && htmlEnd === -1) htmlEnd = out.length
    if (RAW_TEXT.has(tag) && !parsed.selfClosing) {
      const close = findClose(html, i, tag)
      out += html.slice(i, close)
      i = close
    }
  }
  return { html: out, headEnd, htmlEnd }
}

function findClose(html: string, from: number, tag: string): number {
  const lower = html.toLowerCase()
  let at = from
  for (;;) {
    const k = lower.indexOf(`</${tag}`, at)
    if (k === -1) return html.length
    const after = lower[k + 2 + tag.length]
    if (after === undefined || NAME_END.test(after)) return k
    at = k + 1
  }
}

/** Attributes from `from` (just after the tag name) to the end of the tag. */
function scanAttributes(
  html: string,
  from: number,
  tag: string,
  rewrite: AttributeRewriter
): { text: string; end: number; selfClosing: boolean } {
  let out = ''
  let i = from
  const n = html.length
  while (i < n) {
    const c = html[i]
    if (c === '>') return { text: `${out}>`, end: i + 1, selfClosing: html[i - 1] === '/' }
    if (/[\s/]/.test(c)) {
      out += c
      i++
      continue
    }
    // Attribute name
    let j = i
    while (j < n && !/[\s/>=]/.test(html[j])) j++
    const rawName = html.slice(i, j)
    let k = j
    while (k < n && /\s/.test(html[k])) k++
    if (html[k] !== '=') {
      out += html.slice(i, j)
      i = j
      continue
    }
    k++
    while (k < n && /\s/.test(html[k])) k++
    const quoted = html[k] === '"' || html[k] === "'"
    const valueStart = quoted ? k + 1 : k
    let valueEnd: number
    let after: number
    if (quoted) {
      const close = html.indexOf(html[k], valueStart)
      valueEnd = close === -1 ? n : close
      after = close === -1 ? n : close + 1
    } else {
      let m = k
      while (m < n && !/[\s>]/.test(html[m])) m++
      valueEnd = m
      after = m
    }
    const raw = html.slice(valueStart, valueEnd)
    const next = rewrite({ tag, name: rawName.toLowerCase(), value: decodeEntities(raw) })
    if (next === undefined) {
      out += html.slice(i, after)
    } else {
      out += `${rawName}="${escapeAttribute(next)}"`
    }
    i = after
  }
  return { text: out, end: n, selfClosing: false }
}

const NAMED: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
}

/** Decode the character references that occur in URLs and attribute values. */
export function decodeEntities(value: string): string {
  if (!value.includes('&')) return value
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, ref: string) => {
    if (ref[0] === '#') {
      const code =
        ref[1] === 'x' || ref[1] === 'X' ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10)
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : whole
    }
    return NAMED[ref.toLowerCase()] ?? whole
  })
}

export function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
