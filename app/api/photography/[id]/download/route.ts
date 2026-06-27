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

    if (!visitorId) {
      return NextResponse.json({ error: "Visitor ID is required" }, { status: 400 });
    }

    // Record interaction (upsert-like behavior using findFirst/create to prevent unique constraint crash but allow multiple downloads if they clear cookies)
    const existing = await prisma.photoInteraction.findFirst({
      where: {
        photoId: id,
        visitorId,
        type: "download",
      },
    });

    // Record all download events in the audit log
    await prisma.photoInteraction.create({
      data: {
        photoId: id,
        visitorId,
        type: "download",
      },
    });

    if (!existing) {
      // First download for this visitor: increment unique count
      const updatedPhoto = await prisma.photo.update({
        where: { id },
        data: {
          downloads: {
            increment: 1,
          },
        },
        select: {
          downloads: true,
        },
      });

      return NextResponse.json({ downloads: updatedPhoto.downloads });
    }

    const currentPhoto = await prisma.photo.findUnique({
      where: { id },
      select: { downloads: true },
    });

    return NextResponse.json({ downloads: currentPhoto?.downloads || 0 });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Failed to process download" }, { status: 500 });
  }
}
