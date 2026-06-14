/**
 * @file app/api/admin/resume/education/route.ts
 * @description Next.js API route handling requests for the route.ts endpoint.
 * 
 * @exports
 * - GET(): Function
 * - POST(): Function
 * - dynamic: Constant / Helper
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/resume/education
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const items = await prisma.education.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
    return NextResponse.json(items);
  } catch (error) {
    console.error("GET /api/admin/resume/education failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/resume/education
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { degree, institution, field, startYear, endYear, current, description, order } = body;

    if (!degree?.trim()) return NextResponse.json({ error: "Degree is required" }, { status: 400 });
    if (!institution?.trim()) return NextResponse.json({ error: "Institution is required" }, { status: 400 });
    if (!startYear?.trim()) return NextResponse.json({ error: "Start year is required" }, { status: 400 });

    const item = await prisma.education.create({
      data: {
        degree: degree.trim(),
        institution: institution.trim(),
        field: field?.trim() || null,
        startYear: startYear.trim(),
        endYear: endYear?.trim() || null,
        current: Boolean(current),
        description: description?.trim() || null,
        order: typeof order === "number" ? order : 0,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/resume/education failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
