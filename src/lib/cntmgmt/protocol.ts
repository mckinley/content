// Vendored from mckinley/cntmgmt packages/astro @ 8645d298ebf2. Do not edit here.
// The wire format. Both sides copy this type verbatim (cntmgmt: src/lib/preview/protocol.ts;
// helper: packages/astro/src/protocol.ts). Additive changes only within v1.
export interface PreviewOverlay {
  v: 1
  project: string            // cntmgmt project id
  repo: string               // "owner/name"
  branch: string             // publish branch
  base: string               // commit oid the files were read at
  version: string            // same value /version returns for this state
  expiresAt: string          // ISO; the token's expiry
  files: PreviewFile[]
  media: PreviewMedia[]
  blocked: { resource: string; entryKey: string; title: string }[]
}
export interface PreviewFile {
  path: string               // repo-relative, as in the config (e.g. "site/src/content/news/x.yaml")
  op: 'write' | 'delete'
  text?: string              // op 'write': the exact file a publish would write now (UTF-8)
  resource: string           // collection or item name in cntmgmt.config.json
  entryKey: string           // a new entry's key as named now
  role: 'main' | 'translation' | 'sidecar'
  isNew?: boolean
}
export interface PreviewMedia {
  url: string                // how content refers to it, e.g. "/media/news/2026/golden.jpg"
  path: string               // repo path it will be published at
  src: string                // absolute, signed, short-lived URL that serves the bytes now
  type: string               // MIME type
}
