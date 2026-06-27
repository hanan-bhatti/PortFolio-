import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const visitorId = body.visitorId || request.headers.get("x-visitor-id");
    const referrerId = body.referrerId;

    if (!visitorId) {
      return NextResponse.json({ error: "Visitor ID is required" }, { status: 400 });
    }

    // Record the share referral click event in the interactions log
    // We store the referrer ID inside the type or format it clearly (e.g. `ref_click:${referrerId}`)
    // This allows us to track who clicked whose share link.
    const interactionType = referrerId ? `ref_click:${referrerId}` : "share_click";

    const existing = await prisma.photoInteraction.findFirst({
      where: {
        photoId: id,
        visitorId,
        type: interactionType,
      },
    });

    if (!existing) {
      await prisma.photoInteraction.create({
        data: {
          photoId: id,
          visitorId,
          type: interactionType,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Share click track error:", error);
    return NextResponse.json({ error: "Failed to track share click" }, { status: 500 });
  }
}
