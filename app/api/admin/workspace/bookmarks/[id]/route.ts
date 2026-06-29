import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url, title, description, category, favicon, ogImage, ogTitle, ogDesc, pageId } = await req.json();
    const updated = await prisma.workspaceBookmark.update({
      where: { id: params.id },
      data: {
        ...(url !== undefined && { url }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(favicon !== undefined && { favicon }),
        ...(ogImage !== undefined && { ogImage }),
        ...(ogTitle !== undefined && { ogTitle }),
        ...(ogDesc !== undefined && { ogDesc }),
        ...(pageId !== undefined && { pageId: pageId || null })
      }
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PATCH bookmark error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update bookmark" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.workspaceBookmark.delete({
      where: { id: params.id }
    });
    return NextResponse.json({ success: true, data: { id: params.id } });
  } catch (error: any) {
    console.error("DELETE bookmark error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to delete bookmark" }, { status: 500 });
  }
}
