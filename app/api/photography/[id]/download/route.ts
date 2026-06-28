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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const visitorId = searchParams.get("visitorId") || request.headers.get("x-visitor-id") || "anonymous";

    // 1. Fetch photo details from database
    const photo = await prisma.photo.findUnique({
      where: { id },
    });

    if (!photo) {
      return new Response("Photograph not found", { status: 404 });
    }

    // 2. Track download count
    const existing = await prisma.photoInteraction.findFirst({
      where: {
        photoId: id,
        visitorId,
        type: "download",
      },
    });

    await prisma.photoInteraction.create({
      data: {
        photoId: id,
        visitorId,
        type: "download",
      },
    });

    if (!existing) {
      await prisma.photo.update({
        where: { id },
        data: {
          downloads: {
            increment: 1,
          },
        },
      });
    }

    // 3. Fetch image contents from actual source url
    const imageResponse = await fetch(photo.imageUrl);
    if (!imageResponse.ok) {
      return new Response("Failed to fetch image from host", { status: 502 });
    }

    const blob = await imageResponse.blob();
    const headers = new Headers();
    const filename = photo.title
      ? `${photo.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.jpg`
      : `photo-${photo.id}.jpg`;

    headers.set("Content-Type", imageResponse.headers.get("Content-Type") || "image/jpeg");
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    headers.set("Cache-Control", "no-cache");

    return new Response(blob, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("GET download proxy error:", error);
    return new Response("Internal server error during download proxying", { status: 500 });
  }
}
