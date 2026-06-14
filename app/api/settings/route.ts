/**
 * @file app/api/settings/route.ts
 * @description Next.js API route handling requests for the route.ts endpoint.
 * 
 * @exports
 * - GET(): Function
 */

import { NextResponse } from "next/server";
import { getSiteSettings, getAboutSettings } from "@/lib/settings";

export async function GET(): Promise<NextResponse> {
  const settings = await getSiteSettings();
  const about = await getAboutSettings();
  return NextResponse.json({
    ...settings,
    hero_photo_url: settings.heroPhotoUrl,
    hero_tagline: settings.heroTagline,
    stats_years: settings.statsYears,
    stats_projects: settings.statsProjects,
    stats_contributions: settings.statsContributions,
    stats_commits: settings.statsCommits,
    marquee_skills: settings.marqueeSkills,
    ...about,
  });
}
