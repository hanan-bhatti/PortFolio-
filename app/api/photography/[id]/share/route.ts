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
    const platform = body.platform || "unknown";

    if (!visitorId) {
      return NextResponse.json({ error: "Visitor ID is required" }, { status: 400 });
    }

    // Record interaction to allow tracking duplicates
    const existing = await prisma.photoInteraction.findFirst({
      where: {
        photoId: id,
        visitorId,
        type: {
          startsWith: "share_"
        }
      },
    });

    await prisma.photoInteraction.create({
      data: {
        photoId: id,
        visitorId,
        type: `share_${platform}`,
      },
    });

    if (!existing) {
      // First share of this photo for this visitor: increment unique count
      const updatedPhoto = await prisma.photo.update({
        where: { id },
        data: {
          shares: {
            increment: 1,
          },
        },
        select: {
          shares: true,
        },
      });

      return NextResponse.json({ shares: updatedPhoto.shares });
    }

    const currentPhoto = await prisma.photo.findUnique({
      where: { id },
      select: { shares: true },
    });

    return NextResponse.json({ shares: currentPhoto?.shares || 0 });
  } catch (error) {
    console.error("Share error:", error);
    return NextResponse.json({ error: "Failed to process share" }, { status: 500 });
  }
}
