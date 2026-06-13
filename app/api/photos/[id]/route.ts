import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) return null;
  return session;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json() as { title?: string; visible?: boolean; order?: number };
  const photo = await prisma.photo.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title || null }),
      ...(body.visible !== undefined && { visible: body.visible }),
      ...(body.order !== undefined && { order: body.order }),
    },
  });
  return NextResponse.json({ photo });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.photo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
