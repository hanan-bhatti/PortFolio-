/**
 * @file app/api/resume/download/route.ts
 * @description Next.js API route handling requests for the route.ts endpoint.
 * 
 * @exports
 * - POST(): Function
 * - dynamic: Constant / Helper
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/resume/download — track a download and return a download id
export async function POST(request: NextRequest) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? (forwarded.split(",")[0]?.trim() ?? "unknown") : "unknown";
    const userAgent = request.headers.get("user-agent") || "";

    // Geo-lookup
    let country: string | null = null;
    let city: string | null = null;
    try {
      const geo = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,status`, {
        signal: AbortSignal.timeout(3000),
      });
      if (geo.ok) {
        const data = await geo.json();
        if (data.status === "success") {
          country = data.country || null;
          city = data.city || null;
        }
      }
    } catch {
      // geo lookup is best-effort, ignore failures
    }

    const record = await prisma.resumeDownload.create({
      data: { visitorIp: ip, country, city, userAgent },
    });

    return NextResponse.json({ downloadId: record.id });
  } catch (error) {
    console.error("POST /api/resume/download failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
