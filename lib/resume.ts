import { prisma } from "@/lib/prisma";

export async function getResumeSettings(): Promise<Record<string, string>> {
  const rows = await prisma.resumeSettings.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));

  return {
    resume_name: map.get("resume_name") ?? "",
    resume_title: map.get("resume_title") ?? "",
    resume_phone: map.get("resume_phone") ?? "",
    resume_email: map.get("resume_email") ?? "",
    resume_location: map.get("resume_location") ?? "",
    resume_photo_url: map.get("resume_photo_url") ?? "",
    resume_hero_photo_url: map.get("resume_hero_photo_url") ?? "",
    resume_summary: map.get("resume_summary") ?? "",
    resume_enabled: map.get("resume_enabled") ?? "true",
    resume_last_updated: map.get("resume_last_updated") ?? "",
  };
}

export async function touchResumeLastUpdated() {
  try {
    await prisma.resumeSettings.upsert({
      where: { key: "resume_last_updated" },
      update: { value: new Date().toISOString() },
      create: { key: "resume_last_updated", value: new Date().toISOString() },
    });
  } catch (err) {
    console.error("Failed to touch resume_last_updated:", err);
  }
}
