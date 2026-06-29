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
    const pages = await prisma.workspacePage.findMany({
      orderBy: [
        { order: "asc" },
        { createdAt: "asc" }
      ]
    });
    return NextResponse.json({ success: true, data: pages });
  } catch (error: any) {
    console.error("GET pages error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to load pages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, emoji, type, parentId } = await req.json();
    const page = await prisma.workspacePage.create({
      data: {
        title: title || "Untitled",
        emoji: emoji || "📄",
        type: type || "note",
        parentId: parentId || null,
        content: "[]",
        meta: {}
      }
    });
    return NextResponse.json({ success: true, data: page });
  } catch (error: any) {
    console.error("POST pages error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create page" }, { status: 500 });
  }
}
