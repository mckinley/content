# Claude Code Instructions

## Design Philosophy

This is a technical demo site for scientists and developers. Maintain:

- **Stark, simple, utilitarian but friendly** aesthetic
- **Humble but sophisticated** presentation
- **Black and white primary** with greyscale accents
- **Minimal color** - only when necessary and always classy
- **No flashy CTAs** or marketing-style elements
- **Technical accuracy** over visual flair

## Content Systems

This project demonstrates 4 content layer approaches:

1. **Contentlayer** - Type-safe markdown
2. **Keystatic** - Git-backed CMS with admin UI at `/keystatic`
3. **Velite** - Custom loaders and transformations
4. **EditorJS** - Block-based JSON via Velite

## Admin Interfaces

- Keystatic: `/keystatic`
- EditorJS: `/admin/editorjs`

## Search

The site is a demo, so it stays out of search engines: `src/layouts/Layout.astro` sends `<meta name="robots" content="noindex">` on every page, and it has no sitemap or canonical tags on purpose (pjmgmt's canonical-urls standard is n/a here). Keep `robots.txt` open, or crawlers can't see the noindex.

This project is tracked in the pjmgmt HQ: mckinley/pjmgmt, hq/projects/content-management.md.
