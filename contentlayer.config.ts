import { defineDocumentType, makeSource } from 'contentlayer2/source-files'

export const Post = defineDocumentType(() => ({
  name: 'Post',
  filePathPattern: `posts/**/*.md`,
  contentType: 'markdown',
  fields: {
    title: { type: 'string', required: true },
    date: { type: 'date', required: true },
    description: { type: 'string', required: false },
    author: { type: 'string', required: false },
    tags: { type: 'list', of: { type: 'string' }, required: false },
    featured: { type: 'boolean', required: false, default: false },
  },
  computedFields: {
    url: {
      type: 'string',
      resolve: (post) => `/${post._raw.flattenedPath}`,
    },
    slug: {
      type: 'string',
      resolve: (post) => post._raw.flattenedPath.split('/').pop() ?? '',
    },
    readingTime: {
      type: 'number',
      resolve: (post) => Math.ceil(post.body.raw.split(/\s+/).length / 200),
    },
    wordCount: {
      type: 'number',
      resolve: (post) => post.body.raw.split(/\s+/).length,
    },
  },
}))

export default makeSource({
  contentDirPath: 'content/contentlayer',
  documentTypes: [Post],
})
