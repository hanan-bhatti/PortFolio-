import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/resume/certifications
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const items = await prisma.certification.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
    return NextResponse.json(items);
  } catch (error) {
    console.error("GET /api/admin/resume/certifications failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/resume/certifications
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, issuer, year, url, order } = body;

    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!issuer?.trim()) return NextResponse.json({ error: "Issuer is required" }, { status: 400 });

    const item = await prisma.certification.create({
      data: {
        name: name.trim(),
        issuer: issuer.trim(),
        year: year?.trim() || null,
        url: url?.trim() || null,
        order: typeof order === "number" ? order : 0,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/resume/certifications failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
