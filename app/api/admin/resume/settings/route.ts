/**
 * @file app/api/admin/resume/settings/route.ts
 * @description Next.js API route handling requests for the route.ts endpoint.
 * 
 * @exports
 * - GET(): Function
 * - POST(): Function
 * - dynamic: Constant / Helper
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const RESUME_KEYS = [
  "resume_name",
  "resume_title",
  "resume_phone",
  "resume_email",
  "resume_location",
  "resume_photo_url",
  "resume_hero_photo_url",
  "resume_summary",
  "resume_enabled",
];

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await prisma.resumeSettings.findMany({
      where: { key: { in: RESUME_KEYS } },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));

    const settings: Record<string, string> = {};
    for (const key of RESUME_KEYS) {
      settings[key] = map.get(key) ?? "";
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET /api/admin/resume/settings failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const upserts = Object.entries(body)
      .filter(([key]) => RESUME_KEYS.includes(key))
      .map(([key, value]) =>
        prisma.resumeSettings.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      );

    await Promise.all(upserts);
    revalidateTag("resume", "max");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/admin/resume/settings failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
