/**
 * @file lib/prisma.ts
 * @description Instantiates and extends the Prisma Client with custom global hooks.
 * Automatically touches the 'resume_last_updated' setting when write operations occur on resume-related models.
 * 
 * @exports
 * - prisma: Extended PrismaClient instance containing automated update hooks
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const basePrisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error", "warn"] });

// Apply extension to automatically touch resume_last_updated on changes
const extendedPrisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }: any) {
        const result = await query(args);

        const resumeModels = ["Project", "Skill", "Experience", "Education", "Certification", "ResumeSettings"];
        const writeOperations = ["create", "update", "delete", "upsert", "createMany", "updateMany", "deleteMany"];

        if (resumeModels.includes(model) && writeOperations.includes(operation)) {
          // Avoid infinite loop when updating the timestamp setting itself
          const isUpdatingSelf =
            model === "ResumeSettings" &&
            (args?.where?.key === "resume_last_updated" ||
              args?.create?.key === "resume_last_updated" ||
              args?.data?.key === "resume_last_updated");

          if (!isUpdatingSelf) {
            try {
              await basePrisma.resumeSettings.upsert({
                where: { key: "resume_last_updated" },
                update: { value: new Date().toISOString() },
                create: { key: "resume_last_updated", value: new Date().toISOString() },
              });
            } catch (err) {
              console.error("Failed to update resume_last_updated in extension:", err);
            }
          }
        }

        return result;
      },
    },
  },
});

export const prisma = extendedPrisma;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = basePrisma;
}
