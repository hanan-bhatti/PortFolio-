import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/skills/[id] — get single skill
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const skill = await prisma.skill.findUnique({
      where: { id },
    });

    if (!skill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    return NextResponse.json(skill);
  } catch (error) {
    console.error("GET /api/admin/skills/[id] failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/admin/skills/[id] — update skill
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, icon, level, category, order } = body;

    const existingSkill = await prisma.skill.findUnique({
      where: { id },
    });

    if (!existingSkill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json({ error: "Name must be a valid string" }, { status: 400 });
      }
      updateData.name = name;
    }

    if (icon !== undefined) {
      updateData.icon = icon || null;
    }

    if (level !== undefined) {
      if (typeof level !== "number" || level < 1 || level > 100) {
        return NextResponse.json({ error: "Level must be a number between 1 and 100" }, { status: 400 });
      }
      updateData.level = Math.round(level);
    }

    if (category !== undefined) {
      if (typeof category !== "string" || !category.trim()) {
        return NextResponse.json({ error: "Category must be a valid string" }, { status: 400 });
      }
      updateData.category = category;
    }

    if (order !== undefined) {
      if (typeof order !== "number") {
        return NextResponse.json({ error: "Order must be a number" }, { status: 400 });
      }
      updateData.order = Math.round(order);
    }

    const updatedSkill = await prisma.skill.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedSkill);
  } catch (error) {
    console.error("PATCH /api/admin/skills/[id] failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/skills/[id] — delete skill
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingSkill = await prisma.skill.findUnique({
      where: { id },
    });

    if (!existingSkill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    await prisma.skill.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/skills/[id] failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
