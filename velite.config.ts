import edjsHTML from "editorjs-html";
import fs from "fs";
import { JSDOM } from "jsdom";
import JSON5 from "json5";
import path from "path";
import { defineConfig, defineLoader, s } from "velite";
import { VFile } from "vfile";

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

export default defineConfig({
  root: "content/velite",
  loaders: [editorjsLoader, json5Loader, htmlLoader],
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
  },
});
