---
title: Getting Started with Jekyll
layout: post
categories: [tutorials, jekyll]
tags: [static-sites, ruby, blogging]
---

# Getting Started with Jekyll

Jekyll is a simple, blog-aware, static site generator that uses the date-in-filename convention for posts.

## The Filename Convention

Jekyll posts follow this naming pattern:

```
YYYY-MM-DD-title-slug.md
```

For example, this file is named `2024-01-15-getting-started-with-jekyll.md`, which means:

- **Date**: January 15, 2024
- **Slug**: getting-started-with-jekyll

## Why This Pattern?

1. **Chronological sorting** - Files naturally sort by date in file explorers
2. **URL generation** - The date becomes part of the permalink
3. **No frontmatter date needed** - The date is embedded in the filename

## Example Directory Structure

```
_posts/
  2024-01-15-getting-started-with-jekyll.md
  2024-01-20-advanced-jekyll-features.md
  2024-02-01-jekyll-plugins.md
```

This is a common pattern used by many static site generators, not just Jekyll.
