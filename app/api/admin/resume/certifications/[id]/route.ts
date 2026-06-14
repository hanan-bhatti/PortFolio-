/**
 * @file app/api/admin/resume/certifications/[id]/route.ts
 * @description Next.js API route handling requests for the route.ts endpoint.
 * 
 * @exports
 * - DELETE(): Function
 * - PATCH(): Function
 * - dynamic: Constant / Helper
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// PATCH /api/admin/resume/certifications/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { name, issuer, year, url, order } = body;

    const item = await prisma.certification.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(issuer !== undefined && { issuer: issuer.trim() }),
        ...(year !== undefined && { year: year?.trim() || null }),
        ...(url !== undefined && { url: url?.trim() || null }),
        ...(order !== undefined && { order }),
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("PATCH /api/admin/resume/certifications/[id] failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/resume/certifications/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await prisma.certification.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/resume/certifications/[id] failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
