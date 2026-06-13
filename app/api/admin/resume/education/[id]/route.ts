import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// PATCH /api/admin/resume/education/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { degree, institution, field, startYear, endYear, current, description, order } = body;

    const item = await prisma.education.update({
      where: { id },
      data: {
        ...(degree !== undefined && { degree: degree.trim() }),
        ...(institution !== undefined && { institution: institution.trim() }),
        ...(field !== undefined && { field: field?.trim() || null }),
        ...(startYear !== undefined && { startYear: startYear.trim() }),
        ...(endYear !== undefined && { endYear: endYear?.trim() || null }),
        ...(current !== undefined && { current: Boolean(current) }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(order !== undefined && { order }),
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("PATCH /api/admin/resume/education/[id] failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/resume/education/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await prisma.education.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/resume/education/[id] failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
