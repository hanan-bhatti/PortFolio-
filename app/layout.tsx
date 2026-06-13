import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Syne, Inter } from "next/font/google";
import { Toaster } from "sonner";
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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Hanan Bhatti — Portfolio", template: "%s | Hanan Bhatti" },
  description: "Full-Stack Developer, Open Source Builder, CS Student at UET.",
  openGraph: { type: "website", siteName: "Hanan Bhatti" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${syne.variable} ${inter.variable}`} data-scroll-behavior="smooth">
      <body className="antialiased">
        {children}
        <Toaster theme="dark" position="bottom-right" richColors />
      </body>
    </html>
  );
}
