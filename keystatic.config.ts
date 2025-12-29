import { config, fields, collection } from "@keystatic/core";

export default config({
  storage: {
    kind: "local",
  },
  collections: {
    posts: collection({
      label: "Posts",
      slugField: "title",
      path: "content/keystatic/posts/*",
      format: { contentField: "content" },
      schema: {
        title: fields.slug({ name: { label: "Title" } }),
        publishedDate: fields.date({ label: "Published Date" }),
        description: fields.text({
          label: "Description",
          multiline: true,
        }),
        author: fields.text({ label: "Author" }),
        featured: fields.checkbox({
          label: "Featured Post",
          defaultValue: false,
        }),
        tags: fields.array(fields.text({ label: "Tag" }), {
          label: "Tags",
          itemLabel: (props) => props.value,
        }),
        content: fields.markdoc({ label: "Content" }),
      },
    }),
  },
});
