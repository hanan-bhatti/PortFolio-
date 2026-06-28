import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rate-limit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
    }

    if (isRateLimited(`newsletter:${email}`)) {
      return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
    }

    const cleanedEmail = email.toLowerCase().trim();

    const existing = await prisma.postNotifyRequest.findFirst({
      where: {
        postId: null,
        email: cleanedEmail,
      },
    });

    if (existing) {
      return NextResponse.json({ error: "You are already subscribed to the newsletter." }, { status: 400 });
    }

    const notifyRequest = await prisma.postNotifyRequest.create({
      data: {
        postId: null,
        email: cleanedEmail,
        confirmed: true, // Auto-confirm global newsletter signups
      },
    });

    return NextResponse.json({ success: true, message: "Subscribed successfully!" }, { status: 201 });
  } catch (error) {
    console.error("POST /api/newsletter/subscribe failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
