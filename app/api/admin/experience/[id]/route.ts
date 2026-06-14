/**
 * @file app/api/admin/experience/[id]/route.ts
 * @description Next.js API route handling requests for the route.ts endpoint.
 * 
 * @exports
 * - DELETE(): Function
 * - GET(): Function
 * - PATCH(): Function
 * - dynamic: Constant / Helper
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/experience/[id] — get single experience
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

    const experience = await prisma.experience.findUnique({
      where: { id },
    });

    if (!experience) {
      return NextResponse.json({ error: "Experience not found" }, { status: 404 });
    }

    return NextResponse.json(experience);
  } catch (error) {
    console.error("GET /api/admin/experience/[id] failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/admin/experience/[id] — update experience
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
    const { role, company, location, startDate, endDate, current, description, order } = body;

    const existingExperience = await prisma.experience.findUnique({
      where: { id },
    });

    if (!existingExperience) {
      return NextResponse.json({ error: "Experience not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};

    if (role !== undefined) {
      if (typeof role !== "string" || !role.trim()) {
        return NextResponse.json({ error: "Role must be a valid string" }, { status: 400 });
      }
      updateData.role = role;
    }

    if (company !== undefined) {
      if (typeof company !== "string" || !company.trim()) {
        return NextResponse.json({ error: "Company must be a valid string" }, { status: 400 });
      }
      updateData.company = company;
    }

    if (location !== undefined) {
      updateData.location = location || null;
    }

    if (description !== undefined) {
      if (typeof description !== "string" || !description.trim()) {
        return NextResponse.json({ error: "Description must be a valid string" }, { status: 400 });
      }
      updateData.description = description;
    }

    if (order !== undefined) {
      if (typeof order !== "number") {
        return NextResponse.json({ error: "Order must be a number" }, { status: 400 });
      }
      updateData.order = Math.round(order);
    }

    // Process dates
    let resolvedCurrent = existingExperience.current;
    if (current !== undefined) {
      resolvedCurrent = Boolean(current);
      updateData.current = resolvedCurrent;
    }

    if (startDate !== undefined) {
      if (typeof startDate !== "string") {
        return NextResponse.json({ error: "Start Date must be a string" }, { status: 400 });
      }
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return NextResponse.json({ error: "Start Date is invalid" }, { status: 400 });
      }
      updateData.startDate = start;
    }

    if (resolvedCurrent) {
      updateData.endDate = null;
    } else {
      if (endDate !== undefined) {
        if (endDate === null || endDate === "") {
          updateData.endDate = null;
        } else {
          if (typeof endDate !== "string") {
            return NextResponse.json({ error: "End Date must be a string" }, { status: 400 });
          }
          const end = new Date(endDate);
          if (isNaN(end.getTime())) {
            return NextResponse.json({ error: "End Date is invalid" }, { status: 400 });
          }
          updateData.endDate = end;
        }
      } else if (current !== undefined && !resolvedCurrent) {
        // If they switched currently working here to false, but didn't specify end date
        return NextResponse.json({ error: "End Date is required when not currently working there" }, { status: 400 });
      }
    }

    const updatedExperience = await prisma.experience.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedExperience);
  } catch (error) {
    console.error("PATCH /api/admin/experience/[id] failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/experience/[id] — delete experience
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

    const existingExperience = await prisma.experience.findUnique({
      where: { id },
    });

    if (!existingExperience) {
      return NextResponse.json({ error: "Experience not found" }, { status: 404 });
    }

    await prisma.experience.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/experience/[id] failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
