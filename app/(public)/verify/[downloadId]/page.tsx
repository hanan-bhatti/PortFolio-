/**
 * @file app/(public)/verify/[downloadId]/page.tsx
 * @description Next.js route view page or layout component for page.tsx.
 * 
 * @exports
 * - VerifyPage (default): Main React component or function
 * - dynamic: Constant / Helper
 * - metadata: Constant / Helper
 */

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResumeSettings } from "@/lib/resume";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Resume Download Verification",
  description: "Verify a resume download record.",
  robots: { index: false },
};

export default async function VerifyPage({ params }: { params: Promise<{ downloadId: string }> }) {
  const { downloadId } = await params;

  const record = await prisma.resumeDownload.findUnique({ where: { id: downloadId } });
  if (!record) notFound();

  const [rs, latestEdu, latestCert, latestProject] = await Promise.all([
    getResumeSettings(),
    prisma.education.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.certification.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.project.findFirst({ orderBy: { createdAt: "desc" } }),
  ]);

  const name = rs.resume_name || "Portfolio";
  const title = rs.resume_title || "";

  // Check if anything has been updated or created since the download date
  let isOutdated = false;
  const downloadTime = new Date(record.downloadedAt).getTime();
  const bufferMs = 5000; // 5-second buffer to handle download request timing

  let maxDbDate = 0;
  if (latestEdu) maxDbDate = Math.max(maxDbDate, latestEdu.createdAt.getTime());
  if (latestCert) maxDbDate = Math.max(maxDbDate, latestCert.createdAt.getTime());
  if (latestProject) maxDbDate = Math.max(maxDbDate, latestProject.createdAt.getTime());

  if (maxDbDate > downloadTime + bufferMs) {
    isOutdated = true;
  }

  if (rs.resume_last_updated) {
    const lastUpdatedTime = new Date(rs.resume_last_updated).getTime();
    if (lastUpdatedTime > downloadTime + bufferMs) {
      isOutdated = true;
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 520,
          width: "100%",
          border: "1px solid var(--border)",
          background: "var(--bg-elevated)",
          padding: "2.5rem",
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "4px 14px",
            border: "1px solid var(--green-dim)",
            color: "var(--green)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.1em",
            marginBottom: "1.5rem",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--green)",
              display: "inline-block",
            }}
          />
          VERIFIED DOWNLOAD
        </div>

        {isOutdated && (
          <div
            style={{
              border: "1px solid var(--amber)",
              background: "rgba(245, 158, 11, 0.05)",
              padding: "1rem",
              marginBottom: "1.5rem",
              color: "var(--amber)",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            <strong>⚠️ Outdated Document:</strong> This resume has been updated since it was downloaded. We recommend downloading the latest version from the resume page to ensure you have the most up-to-date details.
          </div>
        )}

        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 8, letterSpacing: "-0.01em" }}>
          Resume Download Record
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
          This record confirms that the resume of <strong style={{ color: "#fff" }}>{name}</strong>
          {title && <>, {title}</>} was accessed and downloaded.
        </p>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <tbody>
            {[
              ["Download ID", record.id],
              ["Date & Time", new Date(record.downloadedAt).toLocaleString("en-US", { dateStyle: "long", timeStyle: "medium" })],
              ["Location", [record.city, record.country].filter(Boolean).join(", ") || "Unknown"],
              ["IP Address", record.visitorIp || "Unknown"],
            ].map(([label, value]) => (
              <tr key={label} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px 0", color: "var(--text-muted)", fontWeight: 600, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", width: "40%", verticalAlign: "top" }}>
                  {label}
                </td>
                <td style={{ padding: "10px 0 10px 16px", color: "#fff", wordBreak: "break-all" }}>
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link
            href="/resume"
            style={{
              padding: "8px 20px",
              background: "var(--amber)",
              color: "#000",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            View Resume
          </Link>
          <Link
            href="/"
            style={{
              padding: "8px 20px",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              fontSize: 13,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            ← Home
          </Link>
        </div>
      </div>
    </main>
  );
}
