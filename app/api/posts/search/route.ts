/**
 * @file app/api/posts/search/route.ts
 * @description API endpoint to handle fuzzy blog search queries.
 * Tracks search query telemetry using SiteSearchQuery.
 * 
 * @exports
 * - GET(): Function
 * - dynamic: Constant
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readingTime } from "@/lib/utils";
import Fuse from "fuse.js";

export const dynamic = "force-dynamic";

/**
 * GET: Fuzzy search published posts.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const visitorId = searchParams.get("visitorId") || null;

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return NextResponse.json([]);
    }

    // Fetch all published posts to run fuzzy search on them
    const posts = await prisma.post.findMany({
      where: { published: true },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        content: true,
        coverImage: true,
        tags: true,
        createdAt: true,
      },
    });

    // Configure Fuse.js for fuzzy searching across the fields with weights
    const fuse = new Fuse(posts, {
      keys: [
        { name: "title", weight: 2 },
        { name: "tags", weight: 1.5 },
        { name: "excerpt", weight: 1 },
        { name: "content", weight: 0.8 },
      ],
      threshold: 0.4,
      ignoreLocation: true, // search within the entire text block (especially content)
    });

    const searchResults = fuse.search(trimmedQuery);

    const matchedPosts = searchResults.map((r) => ({
      slug: r.item.slug,
      title: r.item.title,
      excerpt: r.item.excerpt,
      coverImage: r.item.coverImage,
      tags: r.item.tags,
      createdAt: r.item.createdAt.toISOString(),
      readMins: readingTime(r.item.content),
    }));

    // Log the search event telemetry (fail silently if it errors)
    try {
      await prisma.siteSearchQuery.create({
        data: {
          query: trimmedQuery,
          resultsCount: matchedPosts.length,
          visitorId: visitorId || null,
        },
      });
    } catch (logError) {
      console.error("Failed to log site search query to database:", logError);
    }

    return NextResponse.json(matchedPosts);
  } catch (error) {
    console.error("GET /api/posts/search failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
