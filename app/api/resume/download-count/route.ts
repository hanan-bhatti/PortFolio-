import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const count = await prisma.resumeDownload.count();
    return NextResponse.json({ count });
  } catch (error) {
    console.error("GET /api/resume/download-count failed:", error);
    return NextResponse.json({ count: 0 });
  }
}
