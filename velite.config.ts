import { defineConfig, s } from "velite";

export default defineConfig({
  root: "content/velite",
  collections: {
    posts: {
      name: "Post",
      pattern: `posts/**/*.md`,
      schema: s
        .object({
          title: s.string().max(99),
          slug: s.path(),
          date: s.isodate().optional(),
          cover: s.image().optional(),
          metadata: s.metadata(),
          content: s.markdown(),
        })
        .transform((data) => ({ ...data, permalink: `/velite/${data.slug}` })),
    },
  },
});
