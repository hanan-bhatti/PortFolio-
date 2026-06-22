/**
 * @file app/api/admin/search-queries/route.ts
 * @description Admin API route to list site search queries recorded in the database.
 * Secured by NextAuth session check.
 * 
 * @exports
 * - GET(): Function
 * - dynamic: Constant
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET: Lists recorded search queries.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const queries = await prisma.siteSearchQuery.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(queries);
  } catch (error) {
    console.error("GET /api/admin/search-queries failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
