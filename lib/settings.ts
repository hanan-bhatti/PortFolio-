import { prisma } from "@/lib/prisma";
import type { SettingsInput } from "@/lib/validations";

const DEFAULTS: SettingsInput = {
  siteName: "Hanan Bhatti",
  tagline: "Full-Stack Developer",
  aboutBio: "",
  profilePhotoUrl: "",
  socialGithub: "",
  socialLinkedin: "",
  socialTwitter: "",
  socialEmail: "",
};

export async function getSiteSettings(): Promise<SettingsInput> {
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
  };
}
