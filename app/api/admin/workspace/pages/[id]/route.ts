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
    const { title, emoji, type, content, meta, order } = await req.json();
    const updated = await prisma.workspacePage.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(emoji !== undefined && { emoji }),
        ...(type !== undefined && { type }),
        ...(content !== undefined && { content }),
        ...(meta !== undefined && { meta }),
        ...(order !== undefined && { order })
      }
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PATCH page error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update page" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.workspacePage.delete({
      where: { id: params.id }
    });
    return NextResponse.json({ success: true, data: { id: params.id } });
  } catch (error: any) {
    console.error("DELETE page error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to delete page" }, { status: 500 });
  }
}
