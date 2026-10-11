# Content Layer Systems Demo

A Next.js 15 project demonstrating four different content management approaches, each with unique strengths for different use cases.

## Content Systems Compared

| System           | Format       | Admin UI | Type Safety | Best For                       |
| ---------------- | ------------ | -------- | ----------- | ------------------------------ |
| **Contentlayer** | Markdown/MDX | No       | Excellent   | Developer blogs, documentation |
| **Keystatic**    | Markdoc      | Yes      | Good        | Team content editing           |
| **Velite**       | Markdown     | No       | Good        | Custom transformations         |
| **EditorJS**     | JSON         | External | Manual      | Headless CMS integrations      |

## Quick Start

```bash
# Install dependencies
bun install
# or
yarn install

# Run development server (content + Next.js)
bun run dev
# or
yarn dev

# Build for production
bun run build
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/
│   ├── page.tsx              # Main demo page showing all content systems
│   ├── posts/[slug]/         # Contentlayer post detail pages
│   ├── keystatic/            # Keystatic admin UI routes
│   └── api/keystatic/        # Keystatic API routes
├── content/
│   ├── contentlayer/posts/   # Markdown posts for Contentlayer
│   ├── keystatic/posts/      # Markdoc posts for Keystatic
│   └── velite/
│       ├── posts/            # Markdown posts for Velite
│       ├── articles/         # EditorJS JSON articles
│       └── files/            # Shared static files (images)
├── contentlayer.config.ts    # Contentlayer schema definition
├── keystatic.config.ts       # Keystatic schema definition
└── velite.config.ts          # Velite schema + EditorJS loader
```

## Using Keystatic Admin UI

Keystatic provides a visual interface for content editing without touching code.

1. Start the development server: `bun run dev`
2. Navigate to [http://localhost:3000/keystatic](http://localhost:3000/keystatic)
3. Create, edit, or delete posts through the visual interface
4. Changes are saved directly to `content/keystatic/posts/`

### Keystatic Features

- **Slug auto-generation** from title
- **Date picker** for published dates
- **Multi-line text** for descriptions
- **Tag arrays** for categorization
- **Markdoc content** with live preview
- **Git-backed storage** - no database required

## Content Layer Details

### Contentlayer

**Config:** `contentlayer.config.ts`

Features demonstrated:

- Type-safe content access via generated TypeScript types
- Computed fields (URL, slug, reading time, word count)
- Date parsing and formatting
- Markdown to HTML conversion

```typescript
import { allPosts, Post } from 'contentlayer/generated'

// Fully typed - IDE autocomplete works!
const post: Post = allPosts[0]
console.log(post.title) // string
console.log(post.readingTime) // number (computed)
console.log(post.url) // string (computed)
```

### Keystatic

**Config:** `keystatic.config.ts`

Features demonstrated:

- Visual admin interface at `/keystatic`
- Git-backed local storage
- Markdoc format with component support
- Field validation and defaults
- Array fields for tags

### Velite

**Config:** `velite.config.ts`

Features demonstrated:

- Custom EditorJS loader using `defineLoader`
- Image processing with blur placeholders
- Metadata extraction (word count, reading time)
- Table of contents generation
- Computed permalink fields
- Excerpt extraction

### EditorJS via Velite

**Files:** `*.editorjs` + `*.meta.json`

Features demonstrated:

- Block-based JSON content structure
- Custom Velite loader using `editorjs-html`
- Companion metadata files for extended fields
- JSON to HTML conversion at build time

Supported block types: paragraph, header (H1-H6), code, lists, quotes, images

## Development Scripts

```bash
# Development (runs both Velite content build and Next.js)
bun run dev

# Build content only (Velite)
bun run dev:content

# Build Next.js only
bun run dev:next

# Production build (content then Next.js)
bun run build

# Lint and format code
bun run prep
```

## Adding New Content

### Contentlayer Post

Create `content/contentlayer/posts/my-post.md`:

```markdown
---
title: 'My New Post'
date: 2024-12-28
description: 'Post description'
author: 'Your Name'
tags: ['tag1', 'tag2']
featured: true
---

Your markdown content here...
```

### Keystatic Post

Use the admin UI at `/keystatic`, or create `content/keystatic/posts/my-post.mdoc`:

```markdown
---
title: my-post
publishedDate: 2024-12-28
description: Post description
author: Your Name
featured: false
tags:
  - tag1
  - tag2
---

Your markdoc content here...
```

### Velite Post

Create `content/velite/posts/my-post.md`:

```markdown
---
title: 'My Velite Post'
date: 2024-12-28
description: 'Post description'
author: 'Your Name'
tags: ['velite', 'demo']
cover: ../files/cover.jpeg
---

Your markdown content here...
```

### EditorJS Article

1. Create `content/velite/articles/my-article.editorjs`:

```json
{
  "time": 1735200000000,
  "blocks": [
    {
      "id": "intro",
      "type": "paragraph",
      "data": { "text": "Your content here" }
    },
    {
      "id": "heading",
      "type": "header",
      "data": { "text": "Section Title", "level": 2 }
    }
  ],
  "version": "2.30.7"
}
```

2. Create `content/velite/articles/my-article.meta.json`:

```json
{
  "title": "Article Title",
  "slug": "my-article",
  "description": "Article description",
  "author": "Your Name",
  "array": ["tag1", "tag2"],
  "date": "2024-12-28T10:00:00.000Z",
  "object": { "key": "value" },
  "cover": {
    "src": "/static/cover.jpeg",
    "height": 529,
    "width": 816
  }
}
```

## Tech Stack

- **Next.js 15** with App Router
- **React 19**
- **TypeScript 5**
- **Tailwind CSS 3** with Typography plugin
- **contentlayer2** - Type-safe content layer
- **@keystatic/core** - Git-backed CMS
- **velite** - Modern content loader
- **editorjs-html** - EditorJS to HTML conversion
- **date-fns** - Date formatting

## Generated Files

Content systems generate files during build:

- `.contentlayer/generated/` - Contentlayer types and data
- `.velite/` - Velite types and data (posts.json, articles.json)

These are gitignored and regenerated on each build.

## cntmgmt live preview

This site is cntmgmt's test site for the live preview (design 04 paths 1 and 2), with the
`@cntmgmt/astro` helper vendored in `src/lib/cntmgmt/`.

- **Path 1, on the site:** `https://content.cntmgmt.com/cntmgmt-preview/<token>/` (home page)
  and `…/posts/<id>` render the Astro posts (`src/content/posts/*.md`) with the editor's drafts,
  Markdown rendered on request (`src/pages/cntmgmt-preview/[...path].astro`, `src/lib/posts.ts`).
- **Path 2, a separate deployment:** the same site built with `CNTMGMT_PREVIEW_DEPLOYMENT=1`
  renders every page on request: the Worker `content-preview` on
  `https://preview.content.cntmgmt.com/<token>/…` (`wrangler deploy --env preview`, second step of
  the deploy workflow). Switch `site.preview.url` in `cntmgmt.config.json` to it to test path 2.
- **Velite, Keystatic and the other collections show as built.** They need a build step, so
  their drafts belong to the build preview (path 3), not to these paths.
- Locally: run cntmgmt's stub preview API (`packages/astro/test/stub-server.ts`) and put
  `CNTMGMT_ENDPOINT=http://127.0.0.1:<port>` in `.dev.vars`; `wrangler dev` serves the built Worker
  (`--env preview` for path 2).
- The EditorJS demo and Keystatic's admin write local files, so they work under `astro dev` only;
  the deployed Workers answer 404 for them.

## License

MIT
