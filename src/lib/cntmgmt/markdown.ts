// Vendored from mckinley/cntmgmt packages/astro @ 8645d298ebf2. Do not edit here.
// Optional (design 04 §4.1): Markdown rendered at request time, for sites whose build renders a
// Markdown body with remark/rehype, as Astro's own Markdown does. Import it from './markdown'
// only where it is needed: it uses the site's unified packages (unified, remark-parse,
// remark-gfm, remark-rehype, rehype-stringify), which every Astro site already has.
//
// The defaults are Astro's (GitHub-flavoured Markdown, raw HTML kept as written) without syntax
// highlighting. Pass the site's own remark/rehype plugins to match its build; a site that
// sanitizes should pass `allowHtml: false` plus its sanitizer, or keep using its own pipeline.

import { unified, type PluggableList } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

export interface RenderMarkdownOptions {
  /** GitHub-flavoured Markdown (tables, task lists, autolinks); default true */
  gfm?: boolean
  /** Keep raw HTML written in the Markdown; default true (Astro's default). False drops it. */
  allowHtml?: boolean
  remarkPlugins?: PluggableList
  rehypePlugins?: PluggableList
}

export async function renderMarkdown(
  body: string,
  options: RenderMarkdownOptions = {}
): Promise<string> {
  const allowHtml = options.allowHtml ?? true
  const processor = unified()
    .use(remarkParse)
    .use(options.gfm === false ? [] : [remarkGfm])
    .use(options.remarkPlugins ?? [])
    .use(remarkRehype, { allowDangerousHtml: allowHtml })
    .use(options.rehypePlugins ?? [])
    .use(rehypeStringify, { allowDangerousHtml: allowHtml })
  return String(await processor.process(body))
}
