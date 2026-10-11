import { getCollection, type CollectionEntry } from 'astro:content'
import {
  getPreview,
  PreviewDataError,
  previewPageResponse,
  toCollections,
  type MarkdownEntry,
} from './cntmgmt'
import { renderPostMarkdown } from './markdown'
import { postSchema, type PostData } from './schema'

/** A post as pages show it: a published entry, or a draft from a cntmgmt live preview. */
export interface Post {
  id: string
  data: PostData
  /** Published: rendered with Astro's render() */
  entry?: CollectionEntry<'posts'>
  /** Draft: its Markdown rendered at request time */
  html?: string
}

export class PostDraftError extends Error {}

/** All posts, newest first: the published ones, with a preview's drafts laid over them. */
export async function getPosts(locals?: object): Promise<Post[]> {
  const posts: Post[] = (await getCollection('posts')).map((entry: CollectionEntry<'posts'>) => ({
    id: entry.id,
    data: entry.data,
    entry,
  }))
  const preview = getPreview(locals)
  const changes = preview
    ? toCollections(preview.overlay, {
        posts: { dir: 'src/content/posts', format: 'markdown', extensions: ['.md'] },
      }).posts
    : undefined
  if (changes) {
    const replaced = new Set([...changes.delete, ...Object.keys(changes.put)])
    const drafts = await Promise.all(
      Object.entries(changes.put).map(async ([id, value]) => {
        const { data, body } = value as MarkdownEntry
        const parsed = postSchema.safeParse(data)
        if (!parsed.success) {
          const issues = parsed.error.issues.map((i) => `${i.path.join('.') || id}: ${i.message}`)
          throw new PostDraftError(`posts/${id}: ${issues.join('; ')}`)
        }
        return { id, data: parsed.data, html: await renderPostMarkdown(body) }
      })
    )
    posts.splice(0, posts.length, ...posts.filter((p) => !replaced.has(p.id)), ...drafts)
  }
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
}

/** The page for a draft the site can't use; other errors rethrow. */
export function draftProblem(error: unknown, endpoint?: string): Response {
  if (!(error instanceof PostDraftError || error instanceof PreviewDataError)) throw error
  return previewPageResponse(
    {
      status: 422,
      title: "This draft can't be shown yet",
      message: 'One of the unpublished changes has a value the site can’t use. Fix it in the CMS.',
      detail: error.message,
    },
    { endpoint }
  )
}
