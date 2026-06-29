import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const bookmarks = await prisma.workspaceBookmark.findMany({
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json({ success: true, data: bookmarks });
  } catch (error: any) {
    console.error("GET bookmarks error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to load bookmarks" }, { status: 550 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url, title, description, category, favicon, ogImage, ogTitle, ogDesc, pageId } = await req.json();
    const bookmark = await prisma.workspaceBookmark.create({
      data: {
        url,
        title: title || "Untitled Bookmark",
        description: description || null,
        category: category || "general",
        favicon: favicon || null,
        ogImage: ogImage || null,
        ogTitle: ogTitle || null,
        ogDesc: ogDesc || null,
        pageId: pageId || null
      }
    });
    return NextResponse.json({ success: true, data: bookmark });
  } catch (error: any) {
    console.error("POST bookmark error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to save bookmark" }, { status: 500 });
  }
}
