import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get("c");
    const email = searchParams.get("e");

    if (campaignId && email) {
      const existing = await prisma.emailOpen.findFirst({
        where: { campaignId, email: email.toLowerCase().trim() },
      });

      if (!existing) {
        const userAgent = req.headers.get("user-agent") || null;
        await prisma.emailOpen.create({
          data: {
            campaignId,
            email: email.toLowerCase().trim(),
            userAgent,
          },
        });
      }
    }

    // Transparent 1x1 pixel GIF
    const pixel = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    );

    return new NextResponse(pixel, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("Failed to track email open:", error);
    return new NextResponse("Error", { status: 500 });
  }
}
