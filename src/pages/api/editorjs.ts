import type { APIRoute } from 'astro'
import fs from 'node:fs'
import path from 'node:path'

const ARTICLES_DIR = path.join(process.cwd(), 'content/velite/articles')

export const prerender = false

export const GET: APIRoute = async ({ url }) => {
  const slug = url.searchParams.get('slug')

  if (slug) {
    const editorjsPath = path.join(ARTICLES_DIR, `${slug}.editorjs`)
    const metaPath = path.join(ARTICLES_DIR, `${slug}.meta.json`)

    if (!fs.existsSync(editorjsPath)) {
      return new Response(JSON.stringify({ error: 'Article not found' }), { status: 404 })
    }

    const content = JSON.parse(fs.readFileSync(editorjsPath, 'utf-8'))
    const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf-8')) : {}
    return new Response(JSON.stringify({ slug, content, meta }))
  }

  const files = fs.readdirSync(ARTICLES_DIR)
  const articles = files
    .filter((f) => f.endsWith('.editorjs'))
    .map((f) => {
      const s = f.replace('.editorjs', '')
      const metaPath = path.join(ARTICLES_DIR, `${s}.meta.json`)
      const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf-8')) : {}
      return { slug: s, title: meta.title || s }
    })

  return new Response(JSON.stringify({ articles }))
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { slug, content, meta } = await request.json()
    if (!slug) {
      return new Response(JSON.stringify({ error: 'Slug is required' }), { status: 400 })
    }

    const editorjsPath = path.join(ARTICLES_DIR, `${slug}.editorjs`)
    const metaPath = path.join(ARTICLES_DIR, `${slug}.meta.json`)

    fs.writeFileSync(editorjsPath, JSON.stringify(content, null, 2))
    if (meta) {
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2))
    }

    return new Response(JSON.stringify({ success: true, slug }))
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to save article' }), { status: 500 })
  }
}

export const DELETE: APIRoute = async ({ url }) => {
  const slug = url.searchParams.get('slug')
  if (!slug) {
    return new Response(JSON.stringify({ error: 'Slug is required' }), { status: 400 })
  }

  const editorjsPath = path.join(ARTICLES_DIR, `${slug}.editorjs`)
  const metaPath = path.join(ARTICLES_DIR, `${slug}.meta.json`)

  if (fs.existsSync(editorjsPath)) fs.unlinkSync(editorjsPath)
  if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath)

  return new Response(JSON.stringify({ success: true }))
}
