import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [projects, standaloneTasks, posts] = await Promise.all([
      prisma.dashboardProject.findMany({
        include: {
          milestones: {
            orderBy: { createdAt: "asc" }
          },
          tasks: {
            orderBy: { createdAt: "desc" }
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.dashboardTask.findMany({
        where: { projectId: null },
        orderBy: { createdAt: "desc" }
      }),
      prisma.post.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" }
      })
    ]);

    return NextResponse.json({ projects, standaloneTasks, posts });
  } catch (error: any) {
    console.error("GET Planner error:", error);
    return NextResponse.json({ error: error.message || "Failed to load data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "CREATE_PROJECT": {
        const { title, status, description, dueDate } = body;
        const project = await prisma.dashboardProject.create({
          data: {
            title,
            status,
            description,
            dueDate: dueDate ? new Date(dueDate) : null
          }
        });
        return NextResponse.json({ project });
      }

      case "UPDATE_PROJECT": {
        const { id, title, status, description, dueDate } = body;
        const project = await prisma.dashboardProject.update({
          where: { id },
          data: {
            title,
            status,
            description,
            dueDate: dueDate ? new Date(dueDate) : null
          }
        });
        return NextResponse.json({ project });
      }

      case "DELETE_PROJECT": {
        const { id } = body;
        await prisma.dashboardProject.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }

      case "CREATE_MILESTONE": {
        const { title, projectId, dueDate } = body;
        const milestone = await prisma.dashboardMilestone.create({
          data: {
            title,
            projectId,
            dueDate: dueDate ? new Date(dueDate) : null,
            status: "pending"
          }
        });
        return NextResponse.json({ milestone });
      }

      case "UPDATE_MILESTONE_STATUS": {
        const { id, status } = body;
        const milestone = await prisma.dashboardMilestone.update({
          where: { id },
          data: { status }
        });
        return NextResponse.json({ milestone });
      }

      case "DELETE_MILESTONE": {
        const { id } = body;
        await prisma.dashboardMilestone.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }

      case "CREATE_TASK": {
        const { title, projectId, milestoneId, type, blogId, status, priority, dueDate } = body;
        const task = await prisma.dashboardTask.create({
          data: {
            title,
            projectId: projectId || null,
            milestoneId: milestoneId || null,
            type,
            blogId: blogId || null,
            status,
            priority,
            dueDate: dueDate ? new Date(dueDate) : null
          }
        });
        return NextResponse.json({ task });
      }

      case "UPDATE_TASK_STATUS": {
        const { id, status } = body;
        const task = await prisma.dashboardTask.update({
          where: { id },
          data: { status }
        });
        return NextResponse.json({ task });
      }

      case "UPDATE_TASK": {
        const { id, title, type, blogId, status, priority, dueDate, projectId, milestoneId } = body;
        const task = await prisma.dashboardTask.update({
          where: { id },
          data: {
            title,
            projectId: projectId || null,
            milestoneId: milestoneId || null,
            type,
            blogId: blogId || null,
            status,
            priority,
            dueDate: dueDate ? new Date(dueDate) : null
          }
        });
        return NextResponse.json({ task });
      }

      case "DELETE_TASK": {
        const { id } = body;
        await prisma.dashboardTask.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("POST Planner error:", error);
    return NextResponse.json({ error: error.message || "Failed to process request" }, { status: 500 });
  }
}
