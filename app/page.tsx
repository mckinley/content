import keystaticConfig from "@/keystatic.config";
import { createReader } from "@keystatic/core/reader";
import { allPosts, Post } from "contentlayer/generated";
import { compareDesc, format, parseISO } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { posts as velitePosts, articles as veliteArticles } from "@/.velite";

// Data fetching
const contentLayerPosts = allPosts.sort((a, b) =>
  compareDesc(new Date(a.date), new Date(b.date))
);

const reader = createReader(process.cwd(), keystaticConfig);
const keystaticPosts = await reader.collections.posts.all();

// Feature badge component
function FeatureBadge({
  children,
  className,
}: {
  children: string;
  className: string;
}) {
  return (
    <span
      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${className}`}
    >
      {children}
    </span>
  );
}

// Content system card wrapper
function ContentSystemCard({
  title,
  description,
  features,
  colorClasses,
  children,
}: {
  title: string;
  description: string;
  features: string[];
  colorClasses: { bg: string; border: string; badge: string };
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-xl border-2 ${colorClasses.border} ${colorClasses.bg} p-6 mb-8`}
    >
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-3">{description}</p>
        <div className="flex flex-wrap gap-2">
          {features.map((feature) => (
            <FeatureBadge key={feature} className={colorClasses.badge}>
              {feature}
            </FeatureBadge>
          ))}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

// Post card for Contentlayer posts
function ContentlayerPostCard({ post }: { post: Post }) {
  return (
    <article className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold">
          <Link href={post.url} className="hover:underline text-blue-700 dark:text-blue-400">
            {post.title}
          </Link>
        </h3>
        {post.featured && (
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
            Featured
          </span>
        )}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
        {format(parseISO(post.date), "LLLL d, yyyy")}
        {post.readingTime && ` · ${post.readingTime} min read`}
        {post.wordCount && ` · ${post.wordCount} words`}
      </div>
      {post.description && (
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
          {post.description}
        </p>
      )}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

export default async function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-black mb-4">
            Content Layer Systems Demo
          </h1>
          <p className="text-xl opacity-90 mb-6">
            Comparing 4 different content management approaches in Next.js 15
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link
              href="/keystatic"
              className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition shadow-lg"
            >
              Open Keystatic Admin
            </Link>
            <a
              href="https://github.com"
              className="inline-block bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:bg-opacity-10 transition"
            >
              View Source
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4">
        {/* Contentlayer Section */}
        <ContentSystemCard
          title="Contentlayer"
          description="Type-safe content layer with generated TypeScript types and computed fields"
          features={[
            "Type-Safe",
            "Computed Fields",
            "Hot Reload",
            "MDX Support",
          ]}
          colorClasses={{
            bg: "bg-blue-50 dark:bg-blue-950/30",
            border: "border-blue-200 dark:border-blue-800",
            badge:
              "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
          }}
        >
          {contentLayerPosts.map((post) => (
            <ContentlayerPostCard key={post._id} post={post} />
          ))}
        </ContentSystemCard>

        {/* Keystatic Section */}
        <ContentSystemCard
          title="Keystatic"
          description="Git-backed CMS with visual admin interface for content editing"
          features={["Admin UI", "Git-Backed", "Markdoc", "Live Preview"]}
          colorClasses={{
            bg: "bg-green-50 dark:bg-green-950/30",
            border: "border-green-200 dark:border-green-800",
            badge:
              "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
          }}
        >
          {keystaticPosts.map((post) => (
            <article
              key={post.slug}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">{post.entry.title}</h3>
                {post.entry.featured && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                    Featured
                  </span>
                )}
              </div>
              {post.entry.publishedDate && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {format(new Date(post.entry.publishedDate), "LLLL d, yyyy")}
                  {post.entry.author && ` · ${post.entry.author}`}
                </div>
              )}
              {post.entry.description && (
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                  {post.entry.description}
                </p>
              )}
              {post.entry.tags && post.entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {post.entry.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
          <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-4">
            Edit posts at{" "}
            <Link href="/keystatic" className="underline hover:text-gray-700">
              /keystatic
            </Link>
          </p>
        </ContentSystemCard>

        {/* Velite Section */}
        <ContentSystemCard
          title="Velite"
          description="Modern content loader with custom transformations and image processing"
          features={[
            "Custom Loaders",
            "Image Processing",
            "Blur Placeholders",
            "Metadata Extraction",
          ]}
          colorClasses={{
            bg: "bg-purple-50 dark:bg-purple-950/30",
            border: "border-purple-200 dark:border-purple-800",
            badge:
              "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200",
          }}
        >
          {velitePosts.map((post) => (
            <article
              key={post.slug}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <div className="flex gap-4">
                {post.cover && (
                  <Image
                    src={post.cover.src}
                    alt={post.title}
                    width={120}
                    height={80}
                    placeholder="blur"
                    blurDataURL={post.cover.blurDataURL}
                    className="rounded object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{post.title}</h3>
                  {post.date && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {format(parseISO(post.date), "LLLL d, yyyy")}
                      {post.metadata?.readingTime &&
                        ` · ${post.metadata.readingTime} min read`}
                    </div>
                  )}
                  {post.description && (
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                      {post.description}
                    </p>
                  )}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </ContentSystemCard>

        {/* EditorJS Section */}
        <ContentSystemCard
          title="EditorJS via Velite"
          description="Block-based JSON content with custom loader converting to HTML"
          features={[
            "Block-Based",
            "JSON Format",
            "Custom Parser",
            "Metadata Files",
          ]}
          colorClasses={{
            bg: "bg-orange-50 dark:bg-orange-950/30",
            border: "border-orange-200 dark:border-orange-800",
            badge:
              "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200",
          }}
        >
          {veliteArticles.map((article, i) => (
            <article
              key={i}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <div className="flex gap-4 mb-3">
                {article.cover && (
                  <Image
                    src={article.cover.src}
                    alt={article.title}
                    width={120}
                    height={80}
                    placeholder="blur"
                    blurDataURL={article.cover.blurDataURL}
                    className="rounded object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{article.title}</h3>
                  {article.date && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {format(new Date(article.date), "LLLL d, yyyy")}
                      {article.author && ` · ${article.author}`}
                    </div>
                  )}
                  {article.description && (
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {article.description}
                    </p>
                  )}
                </div>
              </div>
              <div
                className="prose prose-sm dark:prose-invert max-w-none mb-3"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700">
                  View raw JSON structure
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-auto max-h-48">
                  {JSON.stringify(
                    {
                      title: article.title,
                      slug: article.slug,
                      date: article.date,
                      array: article.array,
                    },
                    null,
                    2
                  )}
                </pre>
              </details>
            </article>
          ))}
        </ContentSystemCard>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-800 py-8 px-4 text-center border-t border-gray-200 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-400">
          Content Layer Systems Demo · Next.js 15 · React 19 · TypeScript
        </p>
        <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
          Demonstrating Contentlayer, Keystatic, Velite, and EditorJS
        </p>
      </footer>
    </div>
  );
}
