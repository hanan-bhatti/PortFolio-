import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/skills — list all skills
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const skills = await prisma.skill.findMany({
      orderBy: [
        { order: "asc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json(skills);
  } catch (error) {
    console.error("GET /api/admin/skills failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/skills — create skill
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, icon, level, category, order } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (typeof level !== "number" || level < 1 || level > 100) {
      return NextResponse.json({ error: "Level must be a number between 1 and 100" }, { status: 400 });
    }
    if (!category || typeof category !== "string") {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    const skill = await prisma.skill.create({
      data: {
        name,
        icon: icon || null,
        level: Math.round(level),
        category,
        order: typeof order === "number" ? Math.round(order) : 0,
      },
    });

    return NextResponse.json(skill, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/skills failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
