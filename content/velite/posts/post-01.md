---
title: Introduction to Velite (Edited)
date: "2024-12-20T00:00:00.000Z"
description: A modern content layer for Next.js with powerful transformation capabilities
author: Demo Author
tags: ['velite', 'introduction', 'next.js']
cover: ../files/cover.jpeg
parentSlug: null
slug: post-slug
---

# What is Velite?

Velite is a modern content layer that transforms your markdown, MDX, and other content formats into type-safe data for your Next.js application. yes! Yas!

## Key Features

* **Custom Loaders** - Support any file format
* **Image Processing** - Automatic optimization and blur placeholders
* **Type Safety** - Full TypeScript support
* **Flexible Schema** - Define complex content structures

## Getting Started

Install Velite and configure your collections:

```typescript
export default defineConfig({
  collections: {
    posts: {
      pattern: 'posts/**/*.md',
      schema: s.object({
        title: s.string(),
        date: s.isodate(),
        content: s.markdown(),
      }),
    },
  },
})
```

## Image Handling

Velite automatically processes images:

Images get blur placeholders and optimized paths.

## Related Resources

Check out [the documentation](../files/plain.txt) for more details.