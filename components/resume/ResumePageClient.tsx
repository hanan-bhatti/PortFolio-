"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import SkillIcon from "@/components/ui/SkillIcon";
import { FiMail, FiPhone, FiMapPin, FiDownload, FiGithub, FiLinkedin, FiTwitter } from "react-icons/fi";

type Settings = Record<string, string>;
type EducationItem = {
  id: string; degree: string; institution: string; field: string | null;
  startYear: string; endYear: string | null; current: boolean; description: string | null; order: number;
};
type CertItem = {
  id: string; name: string; issuer: string; year: string | null; url: string | null; order: number;
};
type ExperienceItem = {
  id: string; role: string; company: string; location: string | null;
  startDate: string; endDate: string | null; current: boolean; description: string; order: number;
};
type SkillItem = { id: string; name: string; icon: string | null; level: number; category: string; order: number };
type ProjectItem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  techStack: string[];
  liveUrl: string | null;
  githubUrl: string | null;
  resumeBullets: string | null;
  order: number;
};

interface Props {
  settings: Settings;
  education: EducationItem[];
  certifications: CertItem[];
  experience: ExperienceItem[];
  skills: SkillItem[];
  projects: ProjectItem[];
  totalDownloads: number;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function groupSkills(skills: SkillItem[]) {
  const map = new Map<string, SkillItem[]>();
  for (const s of skills) {
    if (!map.has(s.category)) map.set(s.category, []);
    map.get(s.category)!.push(s);
  }
  return map;
}

export default function ResumePageClient({
  settings,
  education,
  certifications,
  experience,
  skills,
  projects,
  totalDownloads,
}: Props) {
  const gitDisplay = settings.social_github ? "github.com/" + settings.social_github.replace(/https?:\/\/(www\.)?github\.com\//i, "").replace(/\/$/, "") : "";
  const liDisplay = settings.social_linkedin ? "linkedin.com/in/" + settings.social_linkedin.replace(/https?:\/\/(www\.)?linkedin\.com\/in\//i, "").replace(/\/$/, "") : "";
  const twDisplay = settings.social_twitter ? "@" + settings.social_twitter.replace(/https?:\/\/(www\.)?(twitter|x)\.com\//i, "").replace(/\/$/, "") : "";
  const [downloading, setDownloading] = useState(false);
  const [activeDownloadId, setActiveDownloadId] = useState<string | null>(null);
  const photoUrl = settings.resume_photo_url || settings.resume_hero_photo_url || "";
  const skillGroups = groupSkills(skills);

  useEffect(() => {
    if (activeDownloadId) {
      const generatePDF = async () => {
        const element = document.getElementById("resume-root");
        if (!element) {
          window.dispatchEvent(new CustomEvent("resume-download-success"));
          setActiveDownloadId(null);
          return;
        }

        // Add class to apply print styles for html2pdf rendering
        document.body.classList.add("html2pdf-printing");

        const options = {
          margin: [0.3, 0.3, 0.3, 0.3] as [number, number, number, number], // 0.3 inch margins for perfect fit
          filename: `Resume_${settings.resume_name?.replace(/\s+/g, "_") || "Abdul_Hannan_Bhatti"}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { 
            scale: 2.5, // Crisp resolution
            useCORS: true,
            letterRendering: true,
          },
          jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"] }
        };

        try {
          const html2pdf = (await import("html2pdf.js")).default;
          await html2pdf().from(element).set(options as any).save();
          window.dispatchEvent(new CustomEvent("resume-download-success"));
        } catch (err) {
          console.error("html2pdf generation failed:", err);
          window.dispatchEvent(new CustomEvent("resume-download-error"));
        } finally {
          document.body.classList.remove("html2pdf-printing");
          setActiveDownloadId(null);
        }
      };

      generatePDF();
    }
  }, [activeDownloadId, settings.resume_name]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    let downloadId: string | null = null;
    try {
      const res = await fetch("/api/resume/download", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        downloadId = data.downloadId || null;
      } else {
        throw new Error(`Server returned status ${res.status}`);
      }
    } catch (err) {
      console.error("Failed to register download:", err);
      // Fallback ID generation so the verification link is still printed on PDF
      if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        downloadId = crypto.randomUUID();
      } else {
        downloadId = `fallback-${Date.now()}`;
      }
    } finally {
      setDownloading(false);
      if (downloadId) {
        setActiveDownloadId(downloadId);
      } else {
        window.print();
        window.dispatchEvent(new CustomEvent("resume-download-success"));
      }
    }
  }, []);

  useEffect(() => {
    const handleTrigger = async () => {
      try {
        await handleDownload();
      } catch (err) {
        console.error("Error handling print trigger:", err);
        window.dispatchEvent(new CustomEvent("resume-download-error"));
      }
    };

    window.addEventListener("trigger-resume-download", handleTrigger);
    return () => {
      window.removeEventListener("trigger-resume-download", handleTrigger);
    };
  }, [handleDownload]);

  return (
    <>
      {/* Grid background matching projects page */}
      <div
        className="w-full min-h-screen relative"
        style={{
          backgroundColor: "#0a0a0a",
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      >
        {/* Radial Gradient Overlay */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            background: "radial-gradient(ellipse at center, transparent 0%, rgba(10, 10, 10, 0.7) 70%, #0a0a0a 100%)",
          }}
        />

        {/* Content Container (pt-28 sits exactly 2rem below the fixed navbar) */}
        <div className="relative z-10 mx-auto max-w-[1000px] px-4 pt-28 pb-20">

        {/* ─── Resume Card (WHITE Background) ─── */}
        <div
          id="resume-root"
          style={{
            border: "1px solid #e0e0e0",
            background: "#ffffff",
            color: "#1a1a1a",
            padding: "clamp(1.5rem, 4vw, 3rem)",
            boxShadow: "0 4px 60px rgba(0,0,0,0.5)",
          }}
        >
          {/* Personal info strip */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 24,
              marginBottom: "2rem",
              paddingBottom: "2rem",
              borderBottom: "1px solid #e5e7eb",
              flexWrap: "wrap",
            }}
          >
            {photoUrl && (
              <div
                style={{
                  width: 80,
                  height: 80,
                  flexShrink: 0,
                  position: "relative",
                  border: "3px solid #F59E0B",
                }}
              >
                <Image
                  src={photoUrl}
                  alt={settings.resume_name || "Profile Photo"}
                  fill
                  sizes="80px"
                  priority
                  style={{ objectFit: "cover" }}
                />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <h1
                style={{
                  fontFamily: "var(--font-syne), Syne, sans-serif",
                  fontSize: "clamp(1.2rem, 3vw, 1.35rem)",
                  fontWeight: 800,
                  color: "#1a1a1a",
                  margin: "0 0 4px",
                  letterSpacing: "-0.02em",
                  whiteSpace: "nowrap",
                }}
              >
                {settings.resume_name || "Your Name"}
              </h1>
              {settings.resume_title && (
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#F59E0B", margin: "0 0 12px", fontWeight: 650 }}>
                  {settings.resume_title}
                </p>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 20px", fontSize: 12, color: "#555555", fontFamily: "Inter, sans-serif" }}>
                {settings.resume_email && (
                  <a 
                    href={`mailto:${settings.resume_email}`} 
                    style={{ color: "#555555", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
                    className="hover:text-amber transition-colors"
                  >
                    <FiMail size={14} style={{ color: "var(--green)" }} />
                    <span>{settings.resume_email}</span>
                  </a>
                )}
                {settings.resume_phone && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#555555" }}>
                    <FiPhone size={14} style={{ color: "var(--green)" }} />
                    <span>{settings.resume_phone}</span>
                  </span>
                )}
                {settings.resume_location && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#555555" }}>
                    <FiMapPin size={14} style={{ color: "var(--green)" }} />
                    <span>{settings.resume_location}</span>
                  </span>
                )}
                {settings.social_github && (
                  <a 
                    href={settings.social_github}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#555555", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
                    className="hover:text-amber transition-colors"
                  >
                    <FiGithub size={14} style={{ color: "var(--green)" }} />
                    <span>{gitDisplay}</span>
                  </a>
                )}
                {settings.social_linkedin && (
                  <a 
                    href={settings.social_linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#555555", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
                    className="hover:text-amber transition-colors"
                  >
                    <FiLinkedin size={14} style={{ color: "var(--green)" }} />
                    <span>{liDisplay}</span>
                  </a>
                )}
                {settings.social_twitter && (
                  <a 
                    href={settings.social_twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#555555", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
                    className="hover:text-amber transition-colors"
                  >
                    <FiTwitter size={14} style={{ color: "var(--green)" }} />
                    <span>{twDisplay}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          {settings.resume_summary && (
            <ResumeSection title="Summary">
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: 1.8, color: "#1a1a1a", margin: 0 }}>
                {settings.resume_summary}
              </p>
            </ResumeSection>
          )}

          {/* Two-Column Grid for sections */}
          <div className="resume-columns" style={{ marginTop: "2rem" }}>
            {/* Left Column: Work Experience & Projects */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {/* Experience */}
              {experience.length > 0 && (
                <ResumeSection title="Work Experience">
                  {experience.map((exp, i) => (
                    <div
                      key={exp.id}
                      className="resume-entry"
                      style={{ marginBottom: i < experience.length - 1 ? 24 : 0, paddingBottom: i < experience.length - 1 ? 24 : 0, borderBottom: i < experience.length - 1 ? "1px solid #e5e7eb" : "none" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                        <div>
                          <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{exp.role}</span>
                          <span style={{ color: "#555555", marginLeft: 8, fontSize: 13, fontFamily: "Inter, sans-serif" }}>@ {exp.company}</span>
                          {exp.location && <span style={{ color: "#555555", fontSize: 11, marginLeft: 8, fontFamily: "Inter, sans-serif" }}>· {exp.location}</span>}
                        </div>
                        <span style={{ fontSize: 11, color: "#555555", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap" }}>
                          {formatDate(exp.startDate)} — {exp.current ? "Present" : exp.endDate ? formatDate(exp.endDate) : ""}
                        </span>
                      </div>
                      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#555555", lineHeight: 1.7, margin: 0 }}>{exp.description}</p>
                    </div>
                  ))}
                </ResumeSection>
              )}

              {/* Projects */}
              {projects.length > 0 && (
                <ResumeSection title="Projects" last>
                  {projects.map((p, i) => {
                    const bullets = p.resumeBullets
                      ? p.resumeBullets.split("\n").map((b) => b.trim()).filter(Boolean)
                      : p.description
                      ? [p.description]
                      : [];
                    return (
                      <div
                        key={p.id}
                        className="resume-entry"
                        style={{ marginBottom: i < projects.length - 1 ? 24 : 0, paddingBottom: i < projects.length - 1 ? 24 : 0, borderBottom: i < projects.length - 1 ? "1px solid #e5e7eb" : "none" }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 4, marginBottom: 4 }}>
                          <div>
                            <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{p.title}</span>
                            {p.techStack.length > 0 && (
                              <span style={{ color: "#555555", marginLeft: 8, fontSize: 11, fontFamily: "Inter, sans-serif", fontWeight: 500 }}>
                                ({p.techStack.join(", ")})
                              </span>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: 12, fontSize: 11, fontFamily: "Inter, sans-serif" }}>
                            {p.githubUrl && (
                              <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#F59E0B", textDecoration: "none" }} className="hover:underline">
                                Code ↗
                              </a>
                            )}
                            {p.liveUrl && (
                              <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#F59E0B", textDecoration: "none" }} className="hover:underline">
                                Live ↗
                              </a>
                            )}
                          </div>
                        </div>
                        {bullets.length > 0 && (
                          <ul style={{ margin: "6px 0 0", paddingLeft: 16, fontSize: 13, color: "#555555", fontFamily: "Inter, sans-serif", listStyleType: "disc" }}>
                            {bullets.map((bullet, idx) => (
                              <li key={idx} style={{ marginBottom: 4, lineHeight: 1.5 }}>{bullet}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </ResumeSection>
              )}
            </div>

            {/* Right Column: Skills, Education, Certifications */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {/* Skills */}
              {skills.length > 0 && (
                <ResumeSection title="Skills">
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {Array.from(skillGroups.entries()).map(([category, items]) => (
                      <div key={category} className="resume-entry">
                        <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 10, color: "#555555", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>
                          {category}
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {items.map((s) => (
                            <span
                              key={s.id}
                              style={{
                                padding: "5px 12px",
                                border: "1px solid #e0e0e0",
                                fontFamily: "Inter, sans-serif",
                                fontSize: 12,
                                color: "#1a1a1a",
                                background: "#f5f5f5",
                              }}
                            >
                              {s.icon && (
                                <span style={{ display: "inline-flex", alignItems: "center", marginRight: 6, color: "#16A34A" }}>
                                  <SkillIcon name={s.icon} size={14} className="text-green" />
                                </span>
                              )}
                              {s.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ResumeSection>
              )}

              {/* Education */}
              {education.length > 0 && (
                <ResumeSection title="Education">
                  {education.map((edu, i) => (
                    <div
                      key={edu.id}
                      className="resume-entry"
                      style={{ marginBottom: i < education.length - 1 ? 20 : 0, paddingBottom: i < education.length - 1 ? 20 : 0, borderBottom: i < education.length - 1 ? "1px solid #e5e7eb" : "none" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4, marginBottom: 4 }}>
                        <div>
                          <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{edu.degree}</span>
                          {edu.field && <span style={{ color: "#555555", marginLeft: 8, fontSize: 13, fontFamily: "Inter, sans-serif" }}>in {edu.field}</span>}
                          <span style={{ color: "#555555", marginLeft: 8, fontSize: 13, fontFamily: "Inter, sans-serif" }}>@ {edu.institution}</span>
                        </div>
                        <span style={{ fontSize: 11, color: "#555555", fontFamily: "Inter, sans-serif" }}>
                          {edu.startYear} — {edu.current ? "Present" : edu.endYear ?? ""}
                        </span>
                      </div>
                      {edu.description && (
                        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#555555", lineHeight: 1.65, margin: 0 }}>{edu.description}</p>
                      )}
                    </div>
                  ))}
                </ResumeSection>
              )}

              {/* Certifications */}
              {certifications.length > 0 && (
                <ResumeSection title="Certifications" last>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {certifications.map((c) => (
                      <div key={c.id} className="resume-entry" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                        <div>
                          <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>{c.name}</span>
                          <span style={{ color: "#555555", marginLeft: 8, fontSize: 13, fontFamily: "Inter, sans-serif" }}>· {c.issuer}</span>
                          {c.url && (
                            <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8, fontSize: 11, color: "#F59E0B" }}>↗ Verify</a>
                          )}
                        </div>
                        {c.year && <span style={{ fontSize: 11, color: "#555555", fontFamily: "Inter, sans-serif" }}>{c.year}</span>}
                      </div>
                    ))}
                  </div>
                </ResumeSection>
              )}
            </div>
          </div>

          {/* Verification footer (prints only) */}
          {activeDownloadId && (
            <div
              className="print-only"
              style={{
                marginTop: "2.5rem",
                paddingTop: "1.2rem",
                borderTop: "1px dashed #d1d5db",
                fontSize: 11,
                color: "#4b5563",
                fontFamily: "Inter, sans-serif",
                textAlign: "center",
              }}
            >
              Verify the authenticity of this resume at:{" "}
              <a
                href={`${typeof window !== "undefined" ? window.location.origin : "https://hanan-bhatti.site"}/verify/${activeDownloadId}`}
                style={{ color: "#D97706", textDecoration: "underline", fontWeight: 600 }}
              >
                {`${typeof window !== "undefined" ? window.location.origin : "https://hanan-bhatti.site"}/verify/${activeDownloadId}`}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* ─── Screen & Print Styles ─── */}
      <style>{`
        .print-only {
          display: none;
        }
        .html2pdf-printing .print-only {
          display: block !important;
        }
        .resume-columns {
          display: grid;
          grid-template-columns: 1.65fr 1fr;
          gap: 2.5rem;
        }
        @media (max-width: 768px) {
          .resume-columns {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }

        @media print {
          /* Hide all non-printable elements completely */
          header, nav, footer, .navbar, .no-print, button, [style*="radial-gradient"] {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          html, body {
            background: #fff !important;
            color: #1a1a1a !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: auto !important;
            width: 100% !important;
          }

          .print-only {
            display: block !important;
          }
        }

        /* Styles applied during print media OR during HTML2PDF compilation */
        @media print, .html2pdf-printing {
          /* Ensure wrapping containers don't add fixed heights, background, or spacing */
          .w-full.min-h-screen,
          div[style*="linear-gradient"],
          .relative.z-10 {
            background-image: none !important;
            background: #fff !important;
            min-height: auto !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            position: relative !important;
            transform: none !important;
          }

          #resume-root {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            position: relative !important;
            background: #fff !important;
            color: #1a1a1a !important;
          }

          #resume-root * { 
            color: #1a1a1a !important; 
            border-color: #e5e7eb !important;
            background: transparent !important;
          }

          #resume-root a { 
            color: #1a1a1a !important; 
            text-decoration: underline !important;
          }

          .resume-columns {
            display: grid !important;
            grid-template-columns: 1.65fr 1fr !important;
            gap: 2.5rem !important;
          }

          /* Prevent breaking sections or entries across pages */
          .resume-section {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            margin-bottom: 1.5rem !important;
            padding-bottom: 1.5rem !important;
          }

          .resume-entry {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          /* Remove extra bottom margin on last section */
          .resume-section:last-of-type {
            margin-bottom: 0 !important;
            padding-bottom: 0 !important;
            border-bottom: none !important;
          }
        }
      `}</style>
    </>
  );
}

function ResumeSection({ title, children, last = false }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className="resume-section" style={{ marginBottom: last ? 0 : "2rem", paddingBottom: last ? 0 : "2rem", borderBottom: last ? "none" : "1px solid #e5e7eb" }}>
      <div style={{ marginBottom: 16 }}>
        <h2
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#F59E0B",
            borderLeft: "3px solid #F59E0B",
            paddingLeft: 8,
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}
