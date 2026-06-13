import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/experience — list all experience
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const experiences = await prisma.experience.findMany({
      orderBy: [
        { order: "asc" },
        { startDate: "desc" },
      ],
    });

    return NextResponse.json(experiences);
  } catch (error) {
    console.error("GET /api/admin/experience failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/experience — create experience
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { role, company, location, startDate, endDate, current, description, order } = body;

    if (!role || typeof role !== "string" || !role.trim()) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }
    if (!company || typeof company !== "string" || !company.trim()) {
      return NextResponse.json({ error: "Company is required" }, { status: 400 });
    }
    if (!startDate || typeof startDate !== "string") {
      return NextResponse.json({ error: "Start Date is required" }, { status: 400 });
    }
    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      return NextResponse.json({ error: "Start Date is invalid" }, { status: 400 });
    }

    let end: Date | null = null;
    const isCurrent = Boolean(current);
    if (!isCurrent) {
      if (!endDate || typeof endDate !== "string") {
        return NextResponse.json({ error: "End Date is required when not currently working there" }, { status: 400 });
      }
      end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return NextResponse.json({ error: "End Date is invalid" }, { status: 400 });
      }
    }

    const experience = await prisma.experience.create({
      data: {
        role,
        company,
        location: location || null,
        startDate: start,
        endDate: end,
        current: isCurrent,
        description,
        order: typeof order === "number" ? Math.round(order) : 0,
      },
    });

    return NextResponse.json(experience, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/experience failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
