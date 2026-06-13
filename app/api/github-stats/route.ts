import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/settings";

interface CachedStats {
  data: {
    totalContributions: number;
    totalCommits: number;
    totalRepos: number;
    yearsExperience: number;
  };
  timestamp: number;
  username: string;
}

let cache: CachedStats | null = null;
const CACHE_TTL = 3600000; // 1 hour in ms

export async function GET() {
  const now = Date.now();

  let settings;
  try {
    settings = await getSiteSettings();
  } catch (error) {
    console.error("Failed to retrieve site settings for GitHub stats:", error);
    settings = { socialGithub: "" };
  }

  // Extract username dynamically from settings URL
  const githubUsername = settings.socialGithub
    ? settings.socialGithub.replace(/\/$/, "").split("/").pop() || "Hanan-Bhatti"
    : "Hanan-Bhatti";

  // Return cached data if valid and it belongs to the current username
  if (cache && now - cache.timestamp < CACHE_TTL && cache.username === githubUsername) {
    return NextResponse.json(cache.data);
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "GITHUB_TOKEN is not configured" },
      { status: 500 }
    );
  }

  const query = `{
    user(login: "${githubUsername}") {
      createdAt
      contributionsCollection {
        totalCommitContributions
        contributionCalendar {
          totalContributions
        }
      }
      repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC) {
        totalCount
      }
    }
  }`;

  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "Next.js-GitHub-Stats-Fetcher",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`GitHub API returned status ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0]?.message || "GraphQL Error");
    }

    const userData = result.data?.user;
    if (!userData) {
      throw new Error("User data not found in GitHub GraphQL response");
    }

    const totalContributions =
      userData.contributionsCollection?.contributionCalendar?.totalContributions || 0;
    const totalCommits =
      userData.contributionsCollection?.totalCommitContributions || 0;
    const totalRepos = userData.repositories?.totalCount || 0;

    const yearsExperience = userData.createdAt
      ? new Date().getFullYear() - new Date(userData.createdAt).getFullYear()
      : 0;

    const data = {
      totalContributions,
      totalCommits,
      totalRepos,
      yearsExperience: Math.max(1, yearsExperience),
    };

    cache = {
      data,
      timestamp: now,
      username: githubUsername,
    };

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Failed to fetch GitHub stats:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
