import keystaticConfig from '@/keystatic.config'
import { createReader } from '@keystatic/core/reader'
import { allPosts } from 'contentlayer/generated'
import { compareDesc, format, parseISO } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import {
  posts as velitePosts,
  articles as veliteArticles,
  siteConfig,
  pages as velitePages,
  htmlPages,
  team,
  navigation,
  products,
  hugoConfig,
  jekyllPosts,
} from '@/.velite'

// Data fetching
const contentLayerPosts = allPosts.sort((a, b) => compareDesc(new Date(a.date), new Date(b.date)))

const reader = createReader(process.cwd(), keystaticConfig)
const keystaticPosts = await reader.collections.posts.all()

// Section component
function Section({
  id,
  title,
  description,
  features,
  adminLink,
  children,
}: {
  id: string
  title: string
  description: string
  features: string[]
  adminLink?: { href: string; label: string }
  children: React.ReactNode
}) {
  return (
    <section id={id} className="mb-16">
      <header className="mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="text-gray-600 mt-1 text-sm">{description}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {features.map((feature) => (
            <span key={feature} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
              {feature}
            </span>
          ))}
          {adminLink && (
            <Link
              href={adminLink.href}
              className="text-xs px-2 py-1 bg-gray-900 text-white rounded hover:bg-gray-700"
            >
              {adminLink.label}
            </Link>
          )}
        </div>
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

// Post card component
function PostCard({
  title,
  href,
  date,
  description,
  author,
  tags,
  readingTime,
  wordCount,
  featured,
}: {
  title: string
  href?: string
  date?: string
  description?: string
  author?: string
  tags?: string[]
  readingTime?: number
  wordCount?: number
  featured?: boolean
}) {
  const TitleEl = href ? (
    <Link href={href} className="hover:underline">
      {title}
    </Link>
  ) : (
    <span>{title}</span>
  )

  return (
    <article className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      <div className="flex justify-between items-start gap-4">
        <h3 className="font-medium">{TitleEl}</h3>
        {featured && (
          <span className="text-xs px-2 py-0.5 bg-gray-900 text-white rounded flex-shrink-0">
            featured
          </span>
        )}
      </div>
      {(date || author || readingTime) && (
        <div className="text-sm text-gray-500 mt-1">
          {date}
          {author && ` · ${author}`}
          {readingTime && ` · ${readingTime} min read`}
          {wordCount && ` · ${wordCount} words`}
        </div>
      )}
      {description && <p className="text-gray-600 text-sm mt-2">{description}</p>}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {tags.map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}

// Article card with image
function ArticleCard({
  title,
  date,
  description,
  author,
  cover,
  content,
  rawData,
}: {
  title: string
  date?: string
  description?: string
  author?: string
  cover?: { src: string; blurDataURL: string }
  content: string
  rawData?: object
}) {
  return (
    <article className="p-4 border border-gray-200 rounded-lg">
      <div className="flex gap-4">
        {cover && (
          <Image
            src={cover.src}
            alt={title}
            width={100}
            height={66}
            placeholder="blur"
            blurDataURL={cover.blurDataURL}
            className="rounded object-cover flex-shrink-0 grayscale hover:grayscale-0 transition-all"
            style={{ width: 'auto', height: 'auto' }}
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium">{title}</h3>
          {(date || author) && (
            <div className="text-sm text-gray-500 mt-1">
              {date}
              {author && ` · ${author}`}
            </div>
          )}
          {description && <p className="text-gray-600 text-sm mt-1">{description}</p>}
        </div>
      </div>
      {/* suppressHydrationWarning: velite watch mode can cause timing differences between server render and client hydration in dev */}
      <div
        className="prose prose-sm prose-gray max-w-none mt-4 pt-4 border-t border-gray-100"
        dangerouslySetInnerHTML={{ __html: content }}
        suppressHydrationWarning
      />
      {rawData && (
        <details className="mt-4 pt-4 border-t border-gray-100">
          <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600 uppercase tracking-wide">
            View JSON
          </summary>
          <pre className="mt-2 text-xs bg-gray-50 p-3 rounded overflow-auto max-h-40 font-mono">
            {JSON.stringify(rawData, null, 2)}
          </pre>
        </details>
      )}
    </article>
  )
}

export default async function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold tracking-tight">Content Layer Systems</h1>
          <p className="text-gray-600 mt-1">Comparing content management approaches in Next.js</p>
          <nav className="flex gap-4 mt-4 text-sm">
            <Link href="/keystatic" className="text-gray-600 hover:text-gray-900 underline">
              Keystatic Admin
            </Link>
            <span className="text-gray-300">·</span>
            <Link href="/editorjs" className="text-gray-600 hover:text-gray-900 underline">
              EditorJS Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* Table of Contents */}
      <nav className="border-b border-gray-100 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <a href="#velite" className="text-gray-600 hover:text-gray-900">
              Velite Posts
            </a>
            <a href="#editorjs" className="text-gray-600 hover:text-gray-900">
              EditorJS
            </a>
            <a href="#velite-advanced" className="text-gray-600 hover:text-gray-900">
              Advanced Velite
            </a>
            <a href="#data-formats" className="text-gray-600 hover:text-gray-900">
              Data Formats
            </a>
            <a href="#contentlayer" className="text-gray-600 hover:text-gray-900">
              Contentlayer
            </a>
            <a href="#keystatic" className="text-gray-600 hover:text-gray-900">
              Keystatic
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Velite */}
        <Section
          id="velite"
          title="Velite"
          description="Modern content loader with custom transformations"
          features={['Custom Loaders', 'Image Processing', 'Blur Placeholders', 'TOC Generation']}
        >
          {velitePosts.map((post) => (
            <ArticleCard
              key={post.slug}
              title={post.title}
              date={post.date ? format(parseISO(post.date), 'MMM d, yyyy') : undefined}
              description={post.description}
              author={post.author}
              cover={post.cover}
              content={post.content}
              rawData={
                post.toc && post.toc.length > 0
                  ? { toc: post.toc, metadata: post.metadata }
                  : undefined
              }
            />
          ))}
        </Section>

        {/* EditorJS */}
        <Section
          id="editorjs"
          title="EditorJS via Velite"
          description="Block-based JSON content with custom parser"
          features={['Block Format', 'JSON Storage', 'Custom Parser', 'Metadata Files']}
          adminLink={{ href: '/editorjs', label: 'Open Admin' }}
        >
          {veliteArticles.map((article, i) => (
            <ArticleCard
              key={i}
              title={article.title}
              date={format(new Date(article.date), 'MMM d, yyyy')}
              description={article.description}
              author={article.author}
              cover={article.cover}
              content={article.content}
              rawData={{
                slug: article.slug,
                tags: article.array,
                object: article.object,
              }}
            />
          ))}
        </Section>

        {/* Advanced Velite Features */}
        <Section
          id="velite-advanced"
          title="Advanced Velite Features"
          description="Custom loaders, single-file collections, and parent-child relationships"
          features={[
            'JSON5 Loader',
            'HTML Loader',
            'Single Collection',
            'MDX Compilation',
            'Parent-Child',
          ]}
        >
          {/* Site Config - Single File Collection */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium">Site Configuration</h3>
            <p className="text-sm text-gray-500 mt-1">
              Single-file collection from JSON5 with comments
            </p>
            <div className="mt-3 bg-gray-50 p-3 rounded text-sm font-mono">
              <div>
                <span className="text-gray-500">name:</span> {siteConfig.name}
              </div>
              <div>
                <span className="text-gray-500">version:</span> {siteConfig.version}
              </div>
              {siteConfig.description && (
                <div>
                  <span className="text-gray-500">description:</span> {siteConfig.description}
                </div>
              )}
              <div>
                <span className="text-gray-500">features:</span> {siteConfig.features.join(', ')}
              </div>
            </div>
          </div>

          {/* MDX Pages */}
          {velitePages.map((page) => (
            <article key={page.slug} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-start">
                <h3 className="font-medium">{page.title}</h3>
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">MDX</span>
              </div>
              {page.description && <p className="text-gray-600 text-sm mt-1">{page.description}</p>}
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600 uppercase tracking-wide">
                  Compiled MDX Code
                </summary>
                <pre className="mt-2 text-xs bg-gray-50 p-3 rounded overflow-auto max-h-32 font-mono">
                  {page.code.substring(0, 500)}...
                </pre>
              </details>
            </article>
          ))}

          {/* HTML Pages */}
          {htmlPages.map((page) => (
            <article key={page.slug} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-start">
                <h3 className="font-medium">{page.title}</h3>
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">HTML</span>
              </div>
              <div
                className="prose prose-sm prose-gray max-w-none mt-3"
                dangerouslySetInnerHTML={{ __html: page.content }}
                suppressHydrationWarning
              />
            </article>
          ))}

          {/* Parent-Child Relationships */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium">Parent-Child Relationships</h3>
            <p className="text-sm text-gray-500 mt-1">
              Posts can reference parent posts via parentSlug
            </p>
            <div className="mt-3 space-y-2">
              {velitePosts.map((post) => (
                <div key={post.slug} className="text-sm flex items-center gap-2">
                  {post.parentSlug ? (
                    <>
                      <span className="text-gray-400">└─</span>
                      <span>{post.title}</span>
                      <span className="text-xs text-gray-400">(child of {post.parentSlug})</span>
                    </>
                  ) : (
                    <>
                      <span className="text-gray-600">●</span>
                      <span className="font-medium">{post.title}</span>
                      <span className="text-xs text-gray-400">(root)</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Data Formats Section */}
        <Section
          id="data-formats"
          title="Data Format Demos"
          description="Different file formats used for content storage in static site generators"
          features={['YAML', 'CSV', 'TOML', 'Jekyll Filenames']}
        >
          {/* YAML Team Data */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-start">
              <h3 className="font-medium">Team Members (YAML)</h3>
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">.yaml</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Structured data commonly stored in _data/ or data/ folders
            </p>
            <div className="mt-3 grid gap-3">
              {team.members.map((member) => (
                <div key={member.name} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-sm">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{member.name}</div>
                    <div className="text-xs text-gray-500">{member.role}</div>
                  </div>
                  {member.social && (
                    <div className="ml-auto flex gap-2 text-xs text-gray-400">
                      {member.social.github && <span>gh:{member.social.github}</span>}
                      {member.social.twitter && <span>{member.social.twitter}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* YAML Navigation */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-start">
              <h3 className="font-medium">Site Navigation (YAML)</h3>
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">.yaml</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Hierarchical navigation with nested children
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {navigation.main.map((item) => (
                <div key={item.href} className="text-sm">
                  <span className="px-2 py-1 bg-gray-100 rounded">{item.label}</span>
                  {item.children && (
                    <span className="text-xs text-gray-400 ml-1">(+{item.children.length})</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CSV Products */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-start">
              <h3 className="font-medium">Products Table (CSV)</h3>
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">.csv</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Spreadsheet-like data for pricing, catalogs, etc.
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-4 font-medium text-gray-600">Name</th>
                    <th className="text-right py-2 pr-4 font-medium text-gray-600">Price</th>
                    <th className="text-left py-2 pr-4 font-medium text-gray-600">Category</th>
                    <th className="text-center py-2 font-medium text-gray-600">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {products.rows.slice(0, 5).map((row) => (
                    <tr key={row.id} className="border-b border-gray-100">
                      <td className="py-2 pr-4">{row.name}</td>
                      <td className="py-2 pr-4 text-right">${row.price}</td>
                      <td className="py-2 pr-4 text-gray-500">{row.category}</td>
                      <td className="py-2 text-center">
                        {row.inStock === 'true' ? (
                          <span className="text-green-600">●</span>
                        ) : (
                          <span className="text-gray-300">○</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.rows.length > 5 && (
                <p className="text-xs text-gray-400 mt-2">+{products.rows.length - 5} more items</p>
              )}
            </div>
          </div>

          {/* TOML Hugo Config */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-start">
              <h3 className="font-medium">Hugo Configuration (TOML)</h3>
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">.toml</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Hugo-style site configuration - popular in Go/Rust ecosystems
            </p>
            <div className="mt-3 bg-gray-50 p-3 rounded text-sm font-mono">
              <div>
                <span className="text-gray-500">baseURL =</span> &quot;
                {hugoConfig.baseURL}&quot;
              </div>
              <div>
                <span className="text-gray-500">title =</span> &quot;
                {hugoConfig.title}&quot;
              </div>
              <div>
                <span className="text-gray-500">languageCode =</span> &quot;
                {hugoConfig.languageCode}&quot;
              </div>
              {hugoConfig.theme && (
                <div>
                  <span className="text-gray-500">theme =</span> &quot;
                  {hugoConfig.theme}&quot;
                </div>
              )}
              {hugoConfig.params && (
                <div className="mt-2 pl-2 border-l-2 border-gray-200">
                  <div className="text-gray-400">[params]</div>
                  {hugoConfig.params.author && (
                    <div>
                      <span className="text-gray-500">author =</span> &quot;
                      {hugoConfig.params.author}&quot;
                    </div>
                  )}
                  {hugoConfig.params.showReadingTime !== undefined && (
                    <div>
                      <span className="text-gray-500">showReadingTime =</span>{' '}
                      {String(hugoConfig.params.showReadingTime)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Jekyll Posts */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-start">
              <h3 className="font-medium">Jekyll-Style Posts</h3>
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                YYYY-MM-DD-slug.md
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Date extracted from filename - no frontmatter date needed
            </p>
            <div className="mt-3 space-y-3">
              {jekyllPosts.map((post) => (
                <div key={post.slug} className="p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-sm">{post.title}</h4>
                    {post.date && (
                      <span className="text-xs text-gray-500">
                        {format(parseISO(post.date), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 font-mono">{post.permalink}</div>
                  {post.categories && post.categories.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {post.categories.map((cat) => (
                        <span key={cat} className="text-xs px-1.5 py-0.5 bg-gray-200 rounded">
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Contentlayer */}
        <Section
          id="contentlayer"
          title="Contentlayer"
          description="Type-safe content layer with generated TypeScript types"
          features={['Type Generation', 'Computed Fields', 'Hot Reload', 'MDX Support']}
        >
          {contentLayerPosts.map((post) => (
            <PostCard
              key={post._id}
              title={post.title}
              href={post.url}
              date={format(parseISO(post.date), 'MMM d, yyyy')}
              description={post.description}
              author={post.author}
              tags={post.tags}
              readingTime={post.readingTime}
              wordCount={post.wordCount}
              featured={post.featured}
            />
          ))}
        </Section>

        {/* Keystatic */}
        <Section
          id="keystatic"
          title="Keystatic"
          description="Git-backed CMS with visual admin interface"
          features={['Admin UI', 'Git Storage', 'Markdoc', 'Live Preview']}
          adminLink={{ href: '/keystatic', label: 'Open Admin' }}
        >
          {keystaticPosts.map((post) => (
            <PostCard
              key={post.slug}
              title={String(post.entry.title)}
              date={
                post.entry.publishedDate
                  ? format(new Date(post.entry.publishedDate), 'MMM d, yyyy')
                  : undefined
              }
              description={post.entry.description ?? undefined}
              author={post.entry.author ?? undefined}
              tags={post.entry.tags?.filter((t): t is string => t !== null)}
              featured={post.entry.featured ?? undefined}
            />
          ))}
        </Section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-6 text-sm text-gray-500">
          <p>Next.js 15 · React 19 · TypeScript</p>
        </div>
      </footer>
    </div>
  )
}
