import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tasks = await prisma.workspaceTask.findMany({
      where: { pageId: params.id },
      orderBy: [
        { order: "asc" },
        { createdAt: "asc" }
      ]
    });
    return NextResponse.json({ success: true, data: tasks });
  } catch (error: any) {
    console.error("GET page tasks error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to load tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, status, priority, dueDate } = await req.json();
    
    // Get count to determine order
    const count = await prisma.workspaceTask.count({
      where: { pageId: params.id }
    });

    const task = await prisma.workspaceTask.create({
      data: {
        pageId: params.id,
        title: title || "Untitled Task",
        status: status || "todo",
        priority: priority || "medium",
        dueDate: dueDate ? new Date(dueDate) : null,
        order: count
      }
    });
    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    console.error("POST page task error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create task" }, { status: 550 });
  }
}
