import edjsHTML from "editorjs-html";
import fs from "fs";
import path from "path";
import { defineConfig, defineLoader, s } from "velite";
import { VFile } from "vfile";

function metadata(vfile: VFile) {
  const metaFilePath = path.join(
    path.dirname(vfile.path),
    `${path.basename(vfile.path, path.extname(vfile.path))}.meta.json`
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

export default defineConfig({
  root: "content/velite",
  loaders: [editorjsLoader],
  collections: {
    posts: {
      name: "Post",
      pattern: `posts/**/*.md`,
      schema: s
        .object({
          title: s.string().max(99),
          slug: s.path(),
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
  },
});
