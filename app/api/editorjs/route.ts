import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ARTICLES_DIR = path.join(process.cwd(), "content/velite/articles");

// GET - List all articles or get a specific one
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (slug) {
    // Get specific article
    const editorjsPath = path.join(ARTICLES_DIR, `${slug}.editorjs`);
    const metaPath = path.join(ARTICLES_DIR, `${slug}.meta.json`);

    if (!fs.existsSync(editorjsPath)) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const content = JSON.parse(fs.readFileSync(editorjsPath, "utf-8"));
    const meta = fs.existsSync(metaPath)
      ? JSON.parse(fs.readFileSync(metaPath, "utf-8"))
      : {};

    return NextResponse.json({ slug, content, meta });
  }

  // List all articles
  const files = fs.readdirSync(ARTICLES_DIR);
  const articles = files
    .filter((f) => f.endsWith(".editorjs"))
    .map((f) => {
      const slug = f.replace(".editorjs", "");
      const metaPath = path.join(ARTICLES_DIR, `${slug}.meta.json`);
      const meta = fs.existsSync(metaPath)
        ? JSON.parse(fs.readFileSync(metaPath, "utf-8"))
        : {};
      return { slug, title: meta.title || slug };
    });

  return NextResponse.json({ articles });
}

// POST - Save article
export async function POST(request: NextRequest) {
  try {
    const { slug, content, meta } = await request.json();

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const editorjsPath = path.join(ARTICLES_DIR, `${slug}.editorjs`);
    const metaPath = path.join(ARTICLES_DIR, `${slug}.meta.json`);

    // Save content
    fs.writeFileSync(editorjsPath, JSON.stringify(content, null, 2));

    // Save meta
    if (meta) {
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    }

    return NextResponse.json({ success: true, slug });
  } catch {
    return NextResponse.json(
      { error: "Failed to save article" },
      { status: 500 }
    );
  }
}

// DELETE - Delete article
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  const editorjsPath = path.join(ARTICLES_DIR, `${slug}.editorjs`);
  const metaPath = path.join(ARTICLES_DIR, `${slug}.meta.json`);

  if (fs.existsSync(editorjsPath)) {
    fs.unlinkSync(editorjsPath);
  }
  if (fs.existsSync(metaPath)) {
    fs.unlinkSync(metaPath);
  }

  return NextResponse.json({ success: true });
}
