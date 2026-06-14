const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("=== SiteSettings ===");
  const siteSettings = await prisma.siteSettings.findMany();
  console.log(siteSettings);

  console.log("\n=== ResumeSettings ===");
  const resumeSettings = await prisma.resumeSettings.findMany();
  console.log(resumeSettings);
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
