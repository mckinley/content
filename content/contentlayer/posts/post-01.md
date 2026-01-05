---
title: Getting Started with Contentlayer
date: 2024-12-20
description: A quick introduction to using Contentlayer in your Next.js project
author: Demo Author
tags: ['contentlayer', 'getting-started', 'tutorial']
---

# Getting Started

Contentlayer transforms your content into type-safe data. Here's how to set it up:

## Installation

```bash
npm install contentlayer next-contentlayer
```

## Key Features

- **Type Safety**: Full TypeScript support
- **Hot Reload**: Changes reflect instantly
- **Validation**: Schema-based content validation

## Configuration Steps

1. Create `contentlayer.config.ts`
2. Define your document types
3. Wrap Next.js config with `withContentlayer`
4. Import content from `contentlayer/generated`

## Example Usage

```typescript
import { allPosts } from 'contentlayer/generated'

export default function Blog() {
  return posts.map(post => <Post key={post._id} {...post} />)
}
```

> Contentlayer generates types at build time, giving you full IDE support.
