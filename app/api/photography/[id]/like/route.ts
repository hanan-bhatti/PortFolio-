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

    // Check existing interaction
    const existing = await prisma.photoInteraction.findFirst({
      where: {
        photoId: id,
        visitorId,
        type: "like",
      },
    });

    let liked = false;
    let likesChange = 0;

    if (existing) {
      // Unlike
      await prisma.photoInteraction.delete({
        where: { id: existing.id },
      });
      likesChange = -1;
    } else {
      // Like
      await prisma.photoInteraction.create({
        data: {
          photoId: id,
          visitorId,
          type: "like",
        },
      });
      liked = true;
      likesChange = 1;
    }

    // Update photo count
    const updatedPhoto = await prisma.photo.update({
      where: { id },
      data: {
        likes: {
          increment: likesChange,
        },
      },
      select: {
        likes: true,
      },
    });

    // Make sure likes is not negative
    if (updatedPhoto.likes < 0) {
      await prisma.photo.update({
        where: { id },
        data: { likes: 0 },
      });
      updatedPhoto.likes = 0;
    }

    return NextResponse.json({
      likes: updatedPhoto.likes,
      liked,
    });
  } catch (error) {
    console.error("Like error:", error);
    return NextResponse.json({ error: "Failed to process like" }, { status: 500 });
  }
}
