---
title: 'Computed Fields in Contentlayer'
date: 2024-12-27
description: 'Explore how computed fields extend your content with derived values'
author: 'Demo Author'
tags: ['contentlayer', 'computed-fields', 'automation']
---

# Computed Fields Demo

This post demonstrates computed fields - values that are automatically calculated from your content at build time.

## What Are Computed Fields?

Computed fields are derived from your source content. Instead of manually maintaining values like URLs or reading times, Contentlayer calculates them for you.

## Examples in This Project

### Reading Time

The `readingTime` field is computed from the word count:

```typescript
readingTime: {
  type: "number",
  resolve: (post) => Math.ceil(post.body.raw.split(/\s+/).length / 200),
}
```

### URL Generation

The `url` field creates the page path from the file location:

```typescript
url: {
  type: "string",
  resolve: (post) => `/${post._raw.flattenedPath}`,
}
```

### Word Count

Track content length automatically:

```typescript
wordCount: {
  type: "number",
  resolve: (post) => post.body.raw.split(/\s+/).length,
}
```

## Benefits

- **Consistency** - URLs and slugs are always correctly formatted
- **Automation** - No manual updates when content changes
- **DRY** - Define the logic once, apply everywhere
