import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json() as {
    photography_enabled: string;
    photography_title: string;
    photography_description: string;
  };
  const pairs = [
    { key: "photography_enabled", value: body.photography_enabled },
    { key: "photography_title", value: body.photography_title },
    { key: "photography_description", value: body.photography_description },
  ];
  await prisma.$transaction(
    pairs.map(({ key, value }) =>
      prisma.siteSettings.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )
  );
  return NextResponse.json({ ok: true });
}
