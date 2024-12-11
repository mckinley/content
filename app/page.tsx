import keystaticConfig from "@/keystatic.config";
import { createReader } from "@keystatic/core/reader";
import { allPosts, Post } from "contentlayer/generated";
import { compareDesc, format, parseISO } from "date-fns";
import Link from "next/link";

const reader = createReader(process.cwd(), keystaticConfig);

function PostCard(post: Post) {
  return (
    <div className="mb-8">
      <h2 className="mb-1 text-xl">
        <Link
          href={post.url}
          className="text-blue-700 hover:text-blue-900 dark:text-blue-400"
        >
          {post.title}
        </Link>
      </h2>
      <time dateTime={post.date} className="mb-2 block text-xs text-gray-600">
        {format(parseISO(post.date), "LLLL d, yyyy")}
      </time>
      <div
        className="text-sm [&>*]:mb-3 [&>*:last-child]:mb-0"
        dangerouslySetInnerHTML={{ __html: post.body.html }}
      />
    </div>
  );
}

export default async function Home() {
  const contentLayerPosts = allPosts.sort((a, b) =>
    compareDesc(new Date(a.date), new Date(b.date))
  );

  const keystaticPosts = await reader.collections.posts.all();

  return (
    <div className="mx-auto max-w-xl py-8">
      <h1 className="mb-8 text-center text-2xl font-black">Content Examples</h1>
      <h2>Contentlayer</h2>
      {contentLayerPosts.map((post, idx) => (
        <PostCard key={idx} {...post} />
      ))}
      <h2>Keystatic</h2>
      {keystaticPosts.map((post) => (
        <div key={post.slug}>
          <h2>{post.entry.title}</h2>
        </div>
      ))}
    </div>
  );
}
