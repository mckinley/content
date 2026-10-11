import GithubSlugger from 'github-slugger'
import remarkSmartypants from 'remark-smartypants'
import { renderMarkdown } from './cntmgmt/markdown'

interface HastNode {
  type: string
  tagName?: string
  value?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}

const text = (node: HastNode): string =>
  node.type === 'text' ? (node.value ?? '') : (node.children ?? []).map(text).join('')

// Heading ids as Astro's Markdown gives them (github-slugger over the heading text).
function headingIds() {
  return (tree: HastNode) => {
    const slugger = new GithubSlugger()
    const visit = (node: HastNode) => {
      if (node.type === 'element' && /^h[1-6]$/.test(node.tagName ?? '')) {
        node.properties = {
          ...node.properties,
          id: node.properties?.id ?? slugger.slug(text(node)),
        }
      }
      node.children?.forEach(visit)
    }
    visit(tree)
  }
}

/** A draft post's Markdown, rendered at request time with Astro's defaults (no syntax highlighting). */
export function renderPostMarkdown(body: string): Promise<string> {
  return renderMarkdown(body, { remarkPlugins: [remarkSmartypants], rehypePlugins: [headingIds] })
}
