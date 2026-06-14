/**
 * @file app/api/posts/[slug]/route.ts
 * @description Next.js API route handling requests for the route.ts endpoint.
 * 
 * @exports
 * - GET(): Function
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post || !post.published) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.post.update({
    where: { id: post.id },
    data: { views: { increment: 1 } },
  });

  return NextResponse.json({ post: updated });
}
