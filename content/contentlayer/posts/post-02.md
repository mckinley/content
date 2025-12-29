---
title: Schema Definition Guide
date: 2024-12-21
description: Learn how to define content schemas with field types and validation
author: Demo Author
tags: ["contentlayer", "schema", "validation"]
---

# Defining Content Schemas

Schemas define the structure of your content. Each field has a type and can be required or optional.

## Available Field Types

| Type      | Description     | Example         |
| --------- | --------------- | --------------- |
| `string`  | Text content    | `"Hello World"` |
| `date`    | ISO date        | `2024-12-21`    |
| `boolean` | True/false      | `true`          |
| `number`  | Numeric value   | `42`            |
| `list`    | Array of values | `["a", "b"]`    |

## Field Options

Each field accepts configuration:

- `required` - Field must be present
- `default` - Fallback value if missing
- `description` - Documentation for the field

## Computed Fields

Computed fields are derived from source content:

```typescript
computedFields: {
  readingTime: {
    type: 'number',
    resolve: (doc) => calculateReadingTime(doc.body.raw)
  }
}
```

These values are calculated at build time and included in the generated types.
