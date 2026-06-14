/**
 * @file app/(public)/photography/page.tsx
 * @description Next.js route view page or layout component for page.tsx.
 * 
 * @exports
 * - PhotographyPage (default): Main React component or function
 * - dynamic: Constant / Helper
 * - generateMetadata(): Function
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";
import { auth } from "@/lib/auth";
import PhotographyGrid from "@/components/ui/PhotographyGrid";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: settings.photography_title || "Photography",
    description: settings.photography_description || "Moments captured on budget devices.",
  };
}

export default async function PhotographyPage() {
  const session = await auth();
  const settings = await getSiteSettings();
  const isEnabled = settings.photography_enabled === "true";

  if (!isEnabled && !session?.user) {
    notFound();
  }

  const photos = await prisma.photo.findMany({
    where: session?.user ? undefined : { visible: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  const title = settings.photography_title || "Through My Lens";
  const words = title.split(" ");
  const titleElements = words.map((word, idx) => {
    const isAmber = idx === (words.length > 2 ? words.length - 1 : Math.min(1, words.length - 1));
    const offset = idx === 0 ? "0" : idx === 1 ? "3rem" : "1.5rem";
    return (
      <div
        key={idx}
        style={{
          color: isAmber ? "var(--amber)" : "#fff",
          transform: offset !== "0" ? `translateX(${offset})` : undefined,
        }}
      >
        {word}
      </div>
    );
  });

  return (
    <div
      className="w-full min-h-screen relative"
      style={{
        backgroundColor: "#0a0a0a",
        backgroundImage: `
          linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
        overflowX: "hidden",
      }}
    >
      {/* Radial Gradient Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, rgba(10, 10, 10, 0.7) 70%, #0a0a0a 100%)",
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-32 pb-20">
        {/* Header Section */}
        <div className="relative mb-16">
          {/* Green Label */}
          <p
            style={{
              fontFamily: "var(--font-inter), Inter, sans-serif",
              fontWeight: 600,
              fontSize: "11px",
              letterSpacing: "0.2em",
              color: "var(--green)",
              marginBottom: "1.5rem",
              textTransform: "uppercase",
            }}
          >
            PHOTOGRAPHY
          </p>

          {/* Stacked Brutalist Heading */}
          <h1
            className="font-syne uppercase photography-heading"
            style={{
              fontWeight: 800,
              fontSize: "clamp(4rem, 10vw, 8rem)",
              lineHeight: 0.92,
              letterSpacing: "-0.02em",
            }}
          >
            {titleElements}
          </h1>

          {/* Description */}
          {settings.photography_description && (
            <p
              style={{
                marginTop: "2rem",
                marginLeft: "1rem",
                fontFamily: "var(--font-inter), Inter, sans-serif",
                fontWeight: 400,
                fontStyle: "italic",
                fontSize: "14px",
                color: "var(--text-muted)",
                borderLeft: "2px solid var(--amber)",
                paddingLeft: "1rem",
              }}
            >
              {settings.photography_description}
            </p>
          )}
        </div>

        {/* Photography Grid */}
        <PhotographyGrid
          photos={photos.map((p) => ({
            id: p.id,
            imageUrl: p.imageUrl,
            title: p.title,
            description: p.description,
            exif_data: p.exif_data,
          }))}
        />
      </div>

      {/* Responsive adjustments block */}
      <style>{`
        @media (max-width: 767px) {
          .photography-heading {
            font-size: clamp(2.2rem, 10vw, 4rem) !important;
            line-height: 0.95 !important;
          }
          .photography-heading > div {
            transform: translateX(0) !important;
          }
        }
        @media (min-width: 768px) and (max-width: 1024px) {
          .photography-heading {
            font-size: clamp(3.5rem, 8vw, 6rem) !important;
          }
        }
      `}</style>
    </div>
  );
}
