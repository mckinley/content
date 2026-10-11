import { z } from 'astro/zod'

// The posts collection's frontmatter (src/content.config.ts); live previews validate drafts with it.
export const postSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  description: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().default(false),
})

export type PostData = z.output<typeof postSchema>
