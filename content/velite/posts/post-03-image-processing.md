---
title: "Image Processing with Velite"
date: 2024-12-26
description: "How Velite automatically optimizes images with blur placeholders"
author: "Demo Author"
tags: ["velite", "images", "optimization", "next.js"]
cover: ../files/cover.jpeg
---

# Automatic Image Optimization

Velite processes your images at build time and generates optimization data that works seamlessly with Next.js Image component.

## What Velite Generates

For each image referenced in your content, Velite produces:

```json
{
  "src": "/static/cover-6ecc40c2.jpeg",
  "height": 529,
  "width": 816,
  "blurDataURL": "data:image/webp;base64,UklGR...",
  "blurWidth": 8,
  "blurHeight": 5
}
```

## Using with Next.js Image

The generated data maps directly to Next.js Image props:

```tsx
import Image from "next/image";

<Image
  src={post.cover.src}
  alt={post.title}
  width={post.cover.width}
  height={post.cover.height}
  placeholder="blur"
  blurDataURL={post.cover.blurDataURL}
/>
```

## Benefits

1. **Blur placeholders** - Smooth loading experience with base64 previews
2. **Automatic dimensions** - No manual width/height measurement
3. **Static optimization** - Images copied to public folder with hashed names
4. **Cache busting** - File hashes in names ensure fresh content

## Metadata Extraction

Velite also extracts reading time and word count from markdown:

```typescript
metadata: s.metadata()  // { readingTime: 2, wordCount: 450 }
```

This makes it easy to display "5 min read" without manual calculation.
