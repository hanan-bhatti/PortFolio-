import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { order } = await req.json() as { order: { id: string; order: number }[] };
  if (!Array.isArray(order)) {
    return NextResponse.json({ error: "order array required" }, { status: 400 });
  }
  await prisma.$transaction(
    order.map(({ id, order: o }) =>
      prisma.photo.update({ where: { id }, data: { order: o } })
    )
  );
  return NextResponse.json({ ok: true });
}
