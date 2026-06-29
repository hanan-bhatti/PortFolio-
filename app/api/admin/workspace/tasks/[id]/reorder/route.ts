import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { status, order, columnTaskIds } = await req.json();

    // Update status and order for the target task
    const updatedTask = await prisma.workspaceTask.update({
      where: { id: params.id },
      data: { status, order }
    });

    // If an array of task IDs is supplied, update order fields in bulk
    if (Array.isArray(columnTaskIds)) {
      await Promise.all(
        columnTaskIds.map((taskId, index) =>
          prisma.workspaceTask.update({
            where: { id: taskId },
            data: { order: index }
          })
        )
      );
    }

    return NextResponse.json({ success: true, data: updatedTask });
  } catch (error: any) {
    console.error("Reorder task error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to reorder task" }, { status: 500 });
  }
}
