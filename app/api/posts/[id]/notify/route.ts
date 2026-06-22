/**
 * @file app/api/posts/[id]/notify/route.ts
 * @description API endpoint to accept email subscription requests (follow topic/post) from visitors.
 * 
 * @exports
 * - POST(): Function
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rate-limit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST: Create a notification follow request.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: postId } = await params;
    const body = await req.json();
    const { email, topic } = body;

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
    }

    if (isRateLimited(`notify:${email}:${postId}`)) {
      return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
    }

    // Verify config allows notifications
    const config = await prisma.postEngagementConfig.findUnique({ where: { postId } });
    if (!config?.notifyMeOn) {
      return NextResponse.json({ error: "Notifications are disabled for this post." }, { status: 403 });
    }

    const notifyRequest = await prisma.postNotifyRequest.create({
      data: {
        postId,
        email: email.toLowerCase().trim(),
        topic: topic ? topic.trim() : null,
        confirmed: false,
      },
    });

    return NextResponse.json(notifyRequest, { status: 201 });
  } catch (error) {
    console.error("POST /api/posts/[id]/notify failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
