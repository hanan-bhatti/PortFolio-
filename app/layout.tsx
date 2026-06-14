import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Syne, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { getSiteSettings } from "@/lib/settings";
import { extractTwitterUsername } from "@/lib/utils";
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
        <Toaster theme="dark" position="bottom-right" richColors />
      </body>
    </html>
  );
}
