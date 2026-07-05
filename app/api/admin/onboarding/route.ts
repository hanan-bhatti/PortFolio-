import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: session.user.id },
    select: {
      hasSeenAdminTour: true,
      seenPageTours: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let seenPageTours: string[] = [];
  try {
    if (typeof user.seenPageTours === "string") {
      seenPageTours = JSON.parse(user.seenPageTours);
    } else if (Array.isArray(user.seenPageTours)) {
      seenPageTours = user.seenPageTours as string[];
    }
  } catch {
    seenPageTours = [];
  }

  return NextResponse.json({
    hasSeenAdminTour: user.hasSeenAdminTour,
    seenPageTours,
  });
}
