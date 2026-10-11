import { defineMiddleware, sequence } from 'astro:middleware'
import { previewMiddleware, type MiddlewareContextLike } from './lib/cntmgmt'

// The EditorJS demo and Keystatic's admin read and write local files, so they work under
// `astro dev` only; deployed Workers answer 404 for them.
const LOCAL_ONLY = /^\/(?:editorjs|keystatic|api\/editorjs|api\/keystatic)(?:\/|$)/
const localOnly = defineMiddleware(({ url }, next) =>
  !import.meta.env.DEV && LOCAL_ONLY.test(url.pathname)
    ? new Response('Not found', { status: 404 })
    : next()
)

// cntmgmt live preview (design 04): on the site under /cntmgmt-preview/<token>/… (path 1), or
// every page of the separate preview deployment under /<token>/… (path 2).
const endpoint = ({ locals }: MiddlewareContextLike) =>
  (locals as { runtime?: { env?: { CNTMGMT_ENDPOINT?: string } } }).runtime?.env?.CNTMGMT_ENDPOINT
const preview = defineMiddleware(
  __CNTMGMT_PREVIEW_DEPLOYMENT__
    ? previewMiddleware({ endpoint })
    : previewMiddleware({ prefix: '/cntmgmt-preview', rewrite: false, endpoint })
)

export const onRequest = sequence(localOnly, preview)
