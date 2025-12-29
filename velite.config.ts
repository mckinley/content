import { parse as csvParse } from "csv-parse/sync";
import edjsHTML from "editorjs-html";
import fs from "fs";
import { JSDOM } from "jsdom";
import JSON5 from "json5";
import path from "path";
import toml from "toml";
import { defineConfig, defineLoader, s } from "velite";
import { VFile } from "vfile";
import yaml from "yaml";

function metadata(vfile: VFile) {
  const metaFilePath = path.join(
    path.dirname(vfile.path),
    `${path.basename(vfile.path, path.extname(vfile.path))}.meta.json`,
  );

  if (fs.existsSync(metaFilePath)) {
    const metaData = JSON.parse(fs.readFileSync(metaFilePath, "utf-8"));
    return metaData;
  }

  return {};
}

const editorjsLoader = defineLoader({
  test: /\.editorjs$/,
  load: (vfile) => {
    const edjsParser = edjsHTML();
    const html = edjsParser.parse(JSON.parse(vfile.toString())).join("");
    return { data: { content: html, ...metadata(vfile) } };
  },
});

// JSON5 loader - supports comments and trailing commas
const json5Loader = defineLoader({
  test: /\.json5$/,
  load: (vfile) => {
    const data = JSON5.parse(vfile.toString());
    return { data };
  },
});

// HTML loader - extracts metadata from embedded <script id="meta"> tags
const htmlLoader = defineLoader({
  test: /\.html$/,
  load: (vfile) => {
    const dom = new JSDOM(vfile.toString());
    const metaScript = dom.window.document.querySelector("script#meta");
    const meta = metaScript ? JSON5.parse(metaScript.textContent || "{}") : {};
    metaScript?.remove();
    const content = dom.window.document.body.innerHTML;
    return { data: { content, ...meta } };
  },
});

// YAML loader - pure YAML data files (no frontmatter, just data)
const yamlLoader = defineLoader({
  test: /\.yaml$/,
  load: (vfile) => {
    const data = yaml.parse(vfile.toString());
    return { data };
  },
});

// CSV loader - tabular data with headers
const csvLoader = defineLoader({
  test: /\.csv$/,
  load: (vfile) => {
    const records = csvParse(vfile.toString(), {
      columns: true, // Use first row as headers
      skip_empty_lines: true,
      trim: true,
    });
    return { data: { rows: records } };
  },
});

// TOML loader - popular in Hugo/Rust ecosystems
const tomlLoader = defineLoader({
  test: /\.toml$/,
  load: (vfile) => {
    const data = toml.parse(vfile.toString());
    return { data };
  },
});

// Helper to extract date from Jekyll-style filenames (YYYY-MM-DD-slug.md)
function extractDateFromFilename(filepath: string): {
  date: string | null;
  slug: string;
} {
  const basename = path.basename(filepath, path.extname(filepath));
  const match = basename.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);
  if (match) {
    return { date: match[1], slug: match[2] };
  }
  return { date: null, slug: basename };
}

export default defineConfig({
  root: "content/velite",
  loaders: [
    editorjsLoader,
    json5Loader,
    htmlLoader,
    yamlLoader,
    csvLoader,
    tomlLoader,
  ],
  collections: {
    posts: {
      name: "Post",
      pattern: `posts/**/*.md`,
      schema: s
        .object({
          title: s.string().max(99),
          slug: s.path(),
          parentSlug: s.string().nullable().optional(), // For parent-child relationships
          date: s.isodate().optional(),
          description: s.string().optional(),
          author: s.string().optional(),
          tags: s.array(s.string()).optional(),
          cover: s.image().optional(),
          metadata: s.metadata(),
          content: s.markdown(),
          excerpt: s.excerpt(),
          toc: s.toc(),
        })
        .transform((data) => ({ ...data, permalink: `/velite/${data.slug}` })),
    },
    articles: {
      name: "Article",
      pattern: `articles/**/*.editorjs`,
      schema: s.object({
        content: s.string(),
        title: s.string(),
        slug: s.slug("articles"),
        description: s.string().optional(),
        author: s.string().optional(),
        array: s.array(s.string()),
        date: s.isodate(),
        object: s.object({
          key: s.string(),
        }),
        cover: s.any(),
      }),
    },
    // Single-file collection for site config (demonstrates single: true)
    siteConfig: {
      name: "SiteConfig",
      pattern: "config/site.json5",
      single: true,
      schema: s.object({
        name: s.string(),
        version: s.string(),
        description: s.string().optional(),
        features: s.array(s.string()),
      }),
    },
    // MDX pages with compiled code
    pages: {
      name: "Page",
      pattern: "pages/**/*.mdx",
      schema: s.object({
        title: s.string(),
        slug: s.slug("pages"),
        description: s.string().optional(),
        code: s.mdx(), // Compiled MDX code
      }),
    },
    // HTML pages with embedded metadata
    htmlPages: {
      name: "HtmlPage",
      pattern: "html/**/*.html",
      schema: s.object({
        title: s.string(),
        slug: s.slug("html"),
        content: s.string(),
      }),
    },

    // ===== DATA FORMAT DEMOS =====

    // YAML data collection - team members (common pattern for structured data)
    team: {
      name: "TeamMember",
      pattern: "data/team.yaml",
      single: true,
      schema: s.object({
        members: s.array(
          s.object({
            name: s.string(),
            role: s.string(),
            bio: s.string().optional(),
            avatar: s.string().optional(),
            social: s
              .object({
                twitter: s.string().optional(),
                github: s.string().optional(),
                linkedin: s.string().optional(),
              })
              .optional(),
          }),
        ),
      }),
    },

    // YAML navigation - common pattern for site navigation
    navigation: {
      name: "Navigation",
      pattern: "data/navigation.yaml",
      single: true,
      schema: s.object({
        main: s.array(
          s.object({
            label: s.string(),
            href: s.string(),
            children: s
              .array(
                s.object({
                  label: s.string(),
                  href: s.string(),
                }),
              )
              .optional(),
          }),
        ),
        footer: s.array(
          s.object({
            label: s.string(),
            href: s.string(),
          }),
        ),
      }),
    },

    // CSV data - products/pricing table (spreadsheet-like data)
    products: {
      name: "Products",
      pattern: "data/products.csv",
      single: true,
      schema: s.object({
        rows: s.array(
          s.object({
            id: s.string(),
            name: s.string(),
            price: s.string(),
            category: s.string(),
            inStock: s.string(),
          }),
        ),
      }),
    },

    // TOML config - Hugo-style configuration
    hugoConfig: {
      name: "HugoConfig",
      pattern: "data/hugo.toml",
      single: true,
      schema: s.object({
        baseURL: s.string(),
        title: s.string(),
        languageCode: s.string(),
        theme: s.string().optional(),
        params: s
          .object({
            description: s.string().optional(),
            author: s.string().optional(),
            showReadingTime: s.boolean().optional(),
          })
          .optional(),
        menu: s
          .object({
            main: s
              .array(
                s.object({
                  name: s.string(),
                  url: s.string(),
                  weight: s.number().optional(),
                }),
              )
              .optional(),
          })
          .optional(),
      }),
    },

    // Jekyll-style posts - date in filename (YYYY-MM-DD-slug.md)
    jekyllPosts: {
      name: "JekyllPost",
      pattern: "jekyll-posts/*.md",
      schema: s
        .object({
          title: s.string(),
          layout: s.string().optional(),
          categories: s.array(s.string()).optional(),
          tags: s.array(s.string()).optional(),
          content: s.markdown(),
          excerpt: s.excerpt(),
          // Raw path for date extraction
          rawPath: s.path(),
        })
        .transform((data, { meta }) => {
          // Extract date from filename (Jekyll convention)
          const { date, slug } = extractDateFromFilename(meta.path as string);
          return {
            ...data,
            slug,
            date,
            permalink: `/blog/${date ? date.replace(/-/g, "/") : ""}/${slug}`,
          };
        }),
    },
  },
});
