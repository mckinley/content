---
title: Custom Loaders in Velite
date: 2024-12-22
description: Building custom file loaders for non-standard content formats
author: Demo Author
tags: ["velite", "loaders", "customization"]
cover: ../files/cover.jpeg
---

# Custom Content Loaders

Velite allows you to define custom loaders for any file format. This demo uses a custom EditorJS loader.

## Defining a Loader

```typescript
const customLoader = defineLoader({
  test: /\.custom$/,
  load: (vfile) => {
    const data = parseCustomFormat(vfile.toString())
    return { data }
  }
})
```

## Loader Components

Each loader needs:

- **test** - Regex pattern to match files
- **load** - Function to transform content

## EditorJS Example

The EditorJS loader in this project:

1. Matches `.editorjs` files
2. Parses JSON block format
3. Converts to HTML using `editorjs-html`
4. Reads companion `.meta.json` for metadata

## Configuration

Add loaders to your Velite config:

```typescript
export default defineConfig({
  loaders: [editorjsLoader],
  collections: { ... }
})
```

![Velite processes content at build time](../files/img.jpg)

This approach enables support for any content format while maintaining type safety.
