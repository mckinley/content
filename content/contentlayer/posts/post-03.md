---
title: Working with MDX
date: 2024-12-22
description: Using MDX for interactive content with React components
author: Demo Author
tags: ['contentlayer', 'mdx', 'components']
---

# MDX Support

MDX lets you use React components directly in your markdown content.

## Setup

Enable MDX in your document type:

```typescript
defineDocumentType(() => ({
  name: 'Post',
  contentType: 'mdx',
  // ...
}))
```

## Custom Components

Pass components to the MDX renderer:

```tsx
<MDXContent
  components={{
    Callout: ({ children }) => <div className="callout">{children}</div>,
  }}
/>
```

## Benefits

1. **Interactive docs** - Embed live examples
2. **Reusable patterns** - Create component libraries
3. **Type-safe props** - Components are fully typed

## Syntax Highlighting

Code blocks automatically support syntax highlighting:

```javascript
function greet(name) {
  return `Hello, ${name}!`
}
```

> MDX bridges the gap between documentation and interactive applications.
