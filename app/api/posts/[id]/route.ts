/**
 * @file app/api/posts/[id]/route.ts
 * @description Dynamic Next.js API route to retrieve a published post by slug or ID.
 * 
 * @exports
 * - GET(): Function
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET: Retrieves a published post by its slug or ID.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Try finding by slug first, then by ID as fallback
    let post = await prisma.post.findUnique({
      where: { slug: id },
    });

    if (!post) {
      post = await prisma.post.findUnique({
        where: { id },
      });
    }

    if (!post || !post.published) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("GET /api/posts/[id] failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
