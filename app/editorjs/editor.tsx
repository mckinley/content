"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import EditorJS, { OutputData, ToolConstructable } from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Code from "@editorjs/code";
import Quote from "@editorjs/quote";

// Type assertion for EditorJS tools (their types are not fully compatible)
const HeaderTool = Header as unknown as ToolConstructable;
const ListTool = List as unknown as ToolConstructable;
const CodeTool = Code as unknown as ToolConstructable;
const QuoteTool = Quote as unknown as ToolConstructable;

interface Article {
  slug: string;
  title: string;
}

interface ArticleMeta {
  title: string;
  slug?: string;
  description?: string;
  author?: string;
  date?: string;
  array?: string[];
  object?: { key: string };
}

export default function EditorJSApp() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [meta, setMeta] = useState<ArticleMeta>({
    title: "",
    description: "",
    author: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const editorRef = useRef<EditorJS | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Load articles list
  useEffect(() => {
    fetch("/api/editorjs")
      .then((r) => r.json())
      .then((data) => setArticles(data.articles || []));
  }, []);

  // Initialize editor
  const initEditor = useCallback((data?: OutputData) => {
    if (editorRef.current) {
      editorRef.current.destroy();
      editorRef.current = null;
    }

    if (!editorContainerRef.current) return;

    const editor = new EditorJS({
      holder: editorContainerRef.current,
      tools: {
        header: {
          class: HeaderTool,
          config: {
            levels: [1, 2, 3, 4],
            defaultLevel: 2,
          },
        },
        list: {
          class: ListTool,
          inlineToolbar: true,
        },
        code: CodeTool,
        quote: {
          class: QuoteTool,
          inlineToolbar: true,
        },
      },
      data: data || {
        time: Date.now(),
        blocks: [
          {
            type: "paragraph",
            data: { text: "Start writing..." },
          },
        ],
      },
      placeholder: "Start writing your article...",
      autofocus: true,
    });

    editorRef.current = editor;
  }, []);

  // Load selected article
  useEffect(() => {
    if (selectedSlug) {
      fetch(`/api/editorjs?slug=${selectedSlug}`)
        .then((r) => r.json())
        .then((data) => {
          setMeta({
            title: data.meta?.title || "",
            slug: data.meta?.slug || selectedSlug,
            description: data.meta?.description || "",
            author: data.meta?.author || "",
            date: data.meta?.date
              ? data.meta.date.split("T")[0]
              : new Date().toISOString().split("T")[0],
            array: data.meta?.array || [],
            object: data.meta?.object || { key: "" },
          });
          initEditor(data.content);
        });
    }
  }, [selectedSlug, initEditor]);

  const handleSave = async () => {
    if (!selectedSlug || !editorRef.current) return;

    setSaving(true);
    setMessage(null);

    try {
      const content = await editorRef.current.save();

      const response = await fetch("/api/editorjs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: selectedSlug,
          content,
          meta: {
            ...meta,
            date: new Date(meta.date || Date.now()).toISOString(),
          },
        }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Saved successfully" });
        // Refresh articles list
        const listResponse = await fetch("/api/editorjs");
        const listData = await listResponse.json();
        setArticles(listData.articles || []);
      } else {
        setMessage({ type: "error", text: "Failed to save" });
      }
    } catch {
      setMessage({ type: "error", text: "Error saving article" });
    }

    setSaving(false);
  };

  const handleNew = () => {
    const slug = prompt("Enter slug for new article (e.g., article-03):");
    if (!slug) return;

    setSelectedSlug(slug);
    setMeta({
      title: "New Article",
      slug: slug,
      description: "",
      author: "",
      date: new Date().toISOString().split("T")[0],
      array: [],
      object: { key: "" },
    });

    // Initialize with empty editor
    setTimeout(() => {
      initEditor({
        time: Date.now(),
        blocks: [
          {
            type: "paragraph",
            data: { text: "Start writing..." },
          },
        ],
      });
    }, 0);
  };

  const handleDelete = async () => {
    if (!selectedSlug) return;
    if (!confirm(`Delete article "${selectedSlug}"?`)) return;

    const response = await fetch(`/api/editorjs?slug=${selectedSlug}`, {
      method: "DELETE",
    });

    if (response.ok) {
      setSelectedSlug(null);
      setMeta({
        title: "",
        description: "",
        author: "",
        date: new Date().toISOString().split("T")[0],
      });
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
      // Refresh list
      const listResponse = await fetch("/api/editorjs");
      const listData = await listResponse.json();
      setArticles(listData.articles || []);
      setMessage({ type: "success", text: "Article deleted" });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight">EditorJS</h1>
            <p className="text-gray-600 text-sm">Block-based content editor</p>
          </div>
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Back to Demo
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar - Article List */}
          <aside className="w-56 flex-shrink-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-medium text-sm uppercase tracking-wide text-gray-500">
                Articles
              </h2>
              <button
                onClick={handleNew}
                className="text-xs px-2 py-1 bg-gray-900 text-white rounded hover:bg-gray-700"
              >
                New
              </button>
            </div>
            <ul className="space-y-1">
              {articles.map((article) => (
                <li key={article.slug}>
                  <button
                    onClick={() => setSelectedSlug(article.slug)}
                    className={`w-full text-left px-3 py-2 rounded text-sm ${
                      selectedSlug === article.slug
                        ? "bg-gray-100 font-medium"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {article.title}
                    <span className="block text-xs text-gray-400">
                      {article.slug}
                    </span>
                  </button>
                </li>
              ))}
              {articles.length === 0 && (
                <li className="text-sm text-gray-400 px-3 py-2">
                  No articles yet
                </li>
              )}
            </ul>
          </aside>

          {/* Main Editor Area */}
          <main className="flex-1 min-w-0">
            {selectedSlug ? (
              <div className="space-y-6">
                {/* Message */}
                {message && (
                  <div
                    className={`px-4 py-2 rounded text-sm ${
                      message.type === "success"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-red-50 text-red-800"
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                {/* Metadata Form */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={meta.title}
                      onChange={(e) =>
                        setMeta({ ...meta, title: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Author
                    </label>
                    <input
                      type="text"
                      value={meta.author || ""}
                      onChange={(e) =>
                        setMeta({ ...meta, author: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Description
                    </label>
                    <textarea
                      value={meta.description || ""}
                      onChange={(e) =>
                        setMeta({ ...meta, description: e.target.value })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={meta.date || ""}
                      onChange={(e) =>
                        setMeta({ ...meta, date: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Slug
                    </label>
                    <input
                      type="text"
                      value={selectedSlug}
                      disabled
                      className="w-full px-3 py-2 border border-gray-100 rounded text-sm bg-gray-50 text-gray-500"
                    />
                  </div>
                </div>

                {/* EditorJS Container */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Content
                  </label>
                  <div
                    ref={editorContainerRef}
                    className="border border-gray-200 rounded-lg p-4 min-h-[400px] prose prose-sm prose-gray max-w-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <button
                    onClick={handleDelete}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedSlug(null);
                        if (editorRef.current) {
                          editorRef.current.destroy();
                          editorRef.current = null;
                        }
                      }}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>

                {/* Block Reference */}
                <details className="mt-8 pt-6 border-t border-gray-100">
                  <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600 uppercase tracking-wide">
                    Keyboard Shortcuts
                  </summary>
                  <div className="mt-4 text-sm text-gray-600 space-y-2">
                    <p>
                      <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                        Tab
                      </kbd>{" "}
                      - Show block menu
                    </p>
                    <p>
                      <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                        /
                      </kbd>{" "}
                      - Quick block search
                    </p>
                    <p>
                      <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                        Enter
                      </kbd>{" "}
                      - New paragraph
                    </p>
                    <p>
                      <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                        Backspace
                      </kbd>{" "}
                      on empty block - Delete block
                    </p>
                  </div>
                </details>
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400">
                <p>Select an article to edit</p>
                <p className="text-sm mt-1">or create a new one</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
