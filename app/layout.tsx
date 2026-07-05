/**
 * @file app/layout.tsx
 * @description Next.js route view page or layout component for layout.tsx.
 * 
 * Copyright (C) 2026 Abdul Hannan Bhatti
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Syne, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { getSiteSettings } from "@/lib/settings";
import { extractTwitterUsername } from "@/lib/utils";
import NextTopLoader from "nextjs-toploader";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import "./bones/registry";

const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-syne",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

export const viewport = {
  themeColor: "#0a0a0a",
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const twitterHandle = extractTwitterUsername(settings.socialTwitter);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://hanan-bhatti.site").replace(/\/$/, "");

  return {
    metadataBase: new URL(siteUrl),
    title: { default: `${settings.siteName} — Portfolio`, template: `%s | ${settings.siteName}` },
    description: "Full-Stack Developer, Open Source Builder, and Computer Science Student at UET. Building premium, high-performance web applications and open-source tools.",
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      type: "website",
      siteName: settings.siteName,
      url: siteUrl,
      title: `${settings.siteName} — Portfolio`,
      description: "Full-Stack Developer, Open Source Builder, and Computer Science Student at UET. Building premium, high-performance web applications and open-source tools.",
      locale: "en_US",
      images: [
        {
          url: `${siteUrl}/_next/image?url=${encodeURIComponent("/og-image.png")}&w=1200&q=75`,
          width: 1200,
          height: 630,
          alt: `${settings.siteName} — Portfolio`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${settings.siteName} — Portfolio`,
      description: "Full-Stack Developer, Open Source Builder, and Computer Science Student at UET. Building premium, high-performance web applications and open-source tools.",
      creator: twitterHandle,
      site: twitterHandle,
      images: [`${siteUrl}/_next/image?url=${encodeURIComponent("/og-image.png")}&w=1200&q=75`],
    },
    icons: {
      icon: [
        { url: "/favicon.ico" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon.svg", type: "image/svg+xml" },
      ],
      apple: "/apple-icon.png",
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${syne.variable} ${inter.variable}`} data-scroll-behavior="smooth">
      <body className="antialiased">
        <NextTopLoader
          color="#F59E0B"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #F59E0B,0 0 5px #F59E0B"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              "name": "Hanan Bhatti",
              "url": "https://hanan-bhatti.site",
              "sameAs": [
                "https://github.com/hanan-bhatti",
                "https://linkedin.com/in/hanan-bhatti"
              ],
              "jobTitle": "Full-Stack Developer",
              "alumniOf": {
                "@type": "EducationalOrganization",
                "name": "University of Engineering and Technology (UET)"
              },
              "description": "Full-Stack Developer, Open Source Builder, and Computer Science Student at UET. Building premium, high-performance web applications and open-source tools."
            }),
          }}
        />
        {children}
        <Analytics />
        <Toaster theme="dark" position="bottom-right" richColors />
      </body>
    </html>
  );
}
