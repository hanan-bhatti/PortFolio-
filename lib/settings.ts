/**
 * @file lib/settings.ts
 * @description Settings retrieval service managing default site configuration and about-me metadata values from the database.
 * 
 * @exports
 * - getSiteSettings(): Resolves database/default values for general site details, statistics, and theme toggles
 * - getAboutSettings(): Resolves database/default values for about-me story sections, stacks, and CTAs
 */

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { SettingsInput, AboutInput } from "@/lib/validations";

const DEFAULTS: SettingsInput = {
  siteName: "Hanan Bhatti",
  tagline: "Full-Stack Developer",
  aboutBio: "",
  profilePhotoUrl: "",
  socialGithub: "",
  socialLinkedin: "",
  socialTwitter: "",
  socialEmail: "",
  heroPhotoUrl: "",
  heroTagline: "Engineer by logic. Designer by obsession.",
  statsYears: "3+",
  statsProjects: "20+",
  statsContributions: "50+",
  statsCommits: "426",
  marqueeSkills: "FULL STACK, SYSTEM DESIGN, DEVOPS, C++, OPEN SOURCE, VIBE CODER, NEXT.JS, NESTJS, POSTGRESQL, REDIS, KAFKA",
  photography_enabled: "false",
  photography_title: "Through My Lens",
  photography_description: "Moments captured on budget devices.",
  analytics_enabled: "true",
  cookie_consent_text: "We use cookies to analyze site traffic and improve your experience. Your data stays on our servers — no third parties.",
  footerLocation: "Lahore, Pakistan",
  footerTimezone: "GMT+5 · Usually awake at 2am",
};

const ABOUT_DEFAULTS: AboutInput = {
  about_hero_tagline: "",
  about_avatar_url: "",
  about_story: "",
  about_currently: "",
  about_beyond_code: "",
  about_cta_text: "",
  about_cta_email: "",
  about_stack: "[]",
};

export const getSiteSettings = unstable_cache(
  async (): Promise<SettingsInput> => {
    const rows = await prisma.siteSettings.findMany();
    const map = new Map(rows.map((r) => [r.key, r.value]));
    return {
      siteName: map.get("siteName") ?? DEFAULTS.siteName,
      tagline: map.get("tagline") ?? DEFAULTS.tagline,
      aboutBio: map.get("aboutBio") ?? DEFAULTS.aboutBio,
      profilePhotoUrl: map.get("profilePhotoUrl") ?? DEFAULTS.profilePhotoUrl,
      socialGithub: map.get("socialGithub") ?? DEFAULTS.socialGithub,
      socialLinkedin: map.get("socialLinkedin") ?? DEFAULTS.socialLinkedin,
      socialTwitter: map.get("socialTwitter") ?? DEFAULTS.socialTwitter,
      socialEmail: map.get("socialEmail") ?? DEFAULTS.socialEmail,
      heroPhotoUrl: map.get("heroPhotoUrl") ?? DEFAULTS.heroPhotoUrl,
      heroTagline: map.get("heroTagline") ?? DEFAULTS.heroTagline,
      statsYears: map.get("statsYears") ?? DEFAULTS.statsYears,
      statsProjects: map.get("statsProjects") ?? DEFAULTS.statsProjects,
      statsContributions: map.get("statsContributions") ?? DEFAULTS.statsContributions,
      statsCommits: map.get("statsCommits") ?? DEFAULTS.statsCommits,
      marqueeSkills: map.get("marqueeSkills") ?? DEFAULTS.marqueeSkills,
      photography_enabled: map.get("photography_enabled") ?? DEFAULTS.photography_enabled,
      photography_title: map.get("photography_title") ?? DEFAULTS.photography_title,
      photography_description: map.get("photography_description") ?? DEFAULTS.photography_description,
      analytics_enabled: map.get("analytics_enabled") ?? DEFAULTS.analytics_enabled,
      cookie_consent_text: map.get("cookie_consent_text") ?? DEFAULTS.cookie_consent_text,
      footerLocation: map.get("footerLocation") ?? DEFAULTS.footerLocation,
      footerTimezone: map.get("footerTimezone") ?? DEFAULTS.footerTimezone,
    };
  },
  ["site-settings-cache"],
  { revalidate: 3600, tags: ["settings"] }
);

export const getAboutSettings = unstable_cache(
  async (): Promise<AboutInput> => {
    const rows = await prisma.siteSettings.findMany({
      where: {
        key: {
          in: [
            "about_hero_tagline",
            "about_avatar_url",
            "about_story",
            "about_currently",
            "about_beyond_code",
            "about_cta_text",
            "about_cta_email",
            "about_stack",
          ],
        },
      },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));
    return {
      about_hero_tagline: map.get("about_hero_tagline") ?? ABOUT_DEFAULTS.about_hero_tagline,
      about_avatar_url: map.get("about_avatar_url") ?? ABOUT_DEFAULTS.about_avatar_url,
      about_story: map.get("about_story") ?? ABOUT_DEFAULTS.about_story,
      about_currently: map.get("about_currently") ?? ABOUT_DEFAULTS.about_currently,
      about_beyond_code: map.get("about_beyond_code") ?? ABOUT_DEFAULTS.about_beyond_code,
      about_cta_text: map.get("about_cta_text") ?? ABOUT_DEFAULTS.about_cta_text,
      about_cta_email: map.get("about_cta_email") ?? ABOUT_DEFAULTS.about_cta_email,
      about_stack: map.get("about_stack") ?? ABOUT_DEFAULTS.about_stack,
    };
  },
  ["about-settings-cache"],
  { revalidate: 3600, tags: ["settings"] }
);
