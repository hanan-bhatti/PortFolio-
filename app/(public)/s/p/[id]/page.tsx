import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ u?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  
  const photo = await prisma.photo.findUnique({
    where: { id },
  });

  if (!photo) {
    return {
      title: "Photo Not Found",
    };
  }

  const title = photo.title || "Moments Captured";
  const description = photo.description || "View this photograph on my portfolio.";
  
  return {
    title: `${title} | Photography`,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: photo.imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [photo.imageUrl],
    },
  };
}

export default async function PhotoSharePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { u: referrerId } = await searchParams;

  const photo = await prisma.photo.findUnique({
    where: { id },
  });

  if (!photo) {
    notFound();
  }

  // Redirect to main photography page with the specific photo ID and referrer ID
  const dest = `/photography?photo=${id}${referrerId ? `&ref=${referrerId}` : ""}`;
  redirect(dest);
}
