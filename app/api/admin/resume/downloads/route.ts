import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/resume/downloads — list all downloads
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const downloads = await prisma.resumeDownload.findMany({
      orderBy: { downloadedAt: "desc" },
      take: 200,
    });
    return NextResponse.json(downloads);
  } catch (error) {
    console.error("GET /api/admin/resume/downloads failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
