"use client";

/**
 * @file components/admin/SettingsForm.tsx
 * @description React component for SettingsForm.tsx under the admin category.
 * 
 * @exports
 * - SettingsForm (default): Main React component or function
 */

import { useTransition, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { settingsSchema, type SettingsInput } from "@/lib/validations";
import {
  saveSettingsAction,
  enable2FAAction,
  disable2FAAction,
  revokeSessionAction,
  changePasswordAction,
  logoutAction,
} from "@/lib/actions";
import { UploadButton } from "@/lib/uploadthing";
import { compressImages } from "@/lib/image-compress";
import { cn, formatDate } from "@/lib/utils";
import EditorialModal from "./EditorialModal";
import ScrollingMarquee from "@/components/ui/ScrollingMarquee";
import {
  FiGlobe,
  FiTag,
  FiMail,
  FiMapPin,
  FiClock,
  FiSettings,
  FiActivity,
  FiUser,
  FiShare2,
  FiLock,
  FiMonitor,
  FiCpu,
  FiKey,
  FiTerminal,
  FiBriefcase,
  FiCalendar,
  FiCheckSquare,
  FiAward,
  FiShield,
  FiSmartphone,
  FiTablet,
  FiChevronUp,
  FiChevronDown,
} from "react-icons/fi";
import {
  FaGithub,
  FaLinkedin,
  FaTwitter,
  FaWindows,
  FaApple,
  FaLinux,
  FaAndroid,
  FaChrome,
  FaSafari,
  FaFirefox,
  FaEdge,
} from "react-icons/fa6";

interface SessionData {
  id: string;
  token: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  city: string | null;
  active: boolean;
  lastUsedAt: Date;
  createdAt: Date;
}

interface SettingsFormProps {
  initial: SettingsInput;
  twoFactorEnabled: boolean;
  new2faSecret: string;
  activeSessions: SessionData[];
  currentSessionToken: string;
}

const GENERAL_FIELDS: Array<{ name: keyof SettingsInput; label: string; placeholder: string; textarea?: boolean }> = [
  { name: "siteName", label: "Site Name", placeholder: "Hanan Bhatti" },
  { name: "tagline", label: "Tagline", placeholder: "Full-Stack Developer" },
  { name: "socialEmail", label: "Public Email", placeholder: "you@example.com" },
  { name: "footerLocation", label: "Footer Location", placeholder: "Lahore, Pakistan" },
  { name: "footerTimezone", label: "Footer Timezone / Awake Info", placeholder: "GMT+5 · Usually awake at 2am" },
];

const HERO_FIELDS: Array<{ name: keyof SettingsInput; label: string; placeholder: string; textarea?: boolean }> = [
  { name: "heroTagline", label: "Hero Tagline", placeholder: "Engineer by logic. Designer by obsession." },
  { name: "aboutBio", label: "About Bio", placeholder: "Tell visitors about yourself...", textarea: true },
  { name: "marqueeSkills", label: "Marquee Skills (comma-separated)", placeholder: "FULL STACK, DEVOPS, C++", textarea: true },
];

const SOCIAL_FIELDS: Array<{ name: keyof SettingsInput; label: string; placeholder: string }> = [
  { name: "socialGithub", label: "GitHub URL", placeholder: "https://github.com/username" },
  { name: "socialLinkedin", label: "LinkedIn URL", placeholder: "https://linkedin.com/in/username" },
  { name: "socialTwitter", label: "Twitter / X URL", placeholder: "https://x.com/username" },
];

interface MarkdownTextareaProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  label: React.ReactNode;
  customPreview?: React.ReactNode;
}

function MarkdownTextarea({
  value,
  onChange,
  placeholder,
  rows = 5,
  label,
  customPreview,
}: MarkdownTextareaProps) {
  const [mode, setMode] = useState<"write" | "preview">("write");

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between border-b border-[#262626]/60 pb-1.5">
        <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          {label}
        </label>
        <div className="flex gap-1 bg-black/45 p-0.5 border border-[#262626] font-mono text-[9px] font-bold uppercase">
          <button
            type="button"
            onClick={() => setMode("write")}
            className={cn("px-2 py-0.5 cursor-pointer transition-colors", mode === "write" ? "bg-amber text-black" : "text-zinc-400 hover:text-zinc-200")}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={cn("px-2 py-0.5 cursor-pointer transition-colors", mode === "preview" ? "bg-amber text-black" : "text-zinc-400 hover:text-zinc-200")}
          >
            Preview
          </button>
        </div>
      </div>
      {mode === "write" ? (
        <div className="relative">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="w-full border border-[#262626] bg-black/40 px-4 py-2.5 font-mono text-xs text-white placeholder-zinc-650 outline-none focus:border-amber transition-colors rounded-none resize-y min-h-[100px]"
          />
          <div className="absolute bottom-2 right-2 text-[9px] font-mono text-zinc-550 bg-black/80 px-1.5 py-0.5 border border-[#262626]">
            {value?.length || 0} chars
          </div>
        </div>
      ) : (
        <div className="w-full border border-[#262626] bg-black/20 px-4 py-3 min-h-[100px] max-h-[250px] overflow-y-auto text-xs text-zinc-300 font-sans whitespace-pre-wrap leading-relaxed">
          {customPreview ? (
            customPreview
          ) : value ? (
            <div className="prose prose-invert prose-xs max-w-none">
              <ReactMarkdown>
                {value}
              </ReactMarkdown>
            </div>
          ) : (
            <span className="italic text-zinc-550 font-mono">Nothing to preview.</span>
          )}
        </div>
      )}
    </div>
  );
}

function getOSIcon(os: string | null) {
  const name = (os || "").toLowerCase();
  if (name.includes("win")) return <FaWindows className="w-3.5 h-3.5 text-blue-400" />;
  if (name.includes("mac") || name.includes("ios") || name.includes("apple")) return <FaApple className="w-3.5 h-3.5 text-zinc-300" />;
  if (name.includes("linux")) return <FaLinux className="w-3.5 h-3.5 text-amber" />;
  if (name.includes("android")) return <FaAndroid className="w-3.5 h-3.5 text-emerald-400" />;
  return <FiCpu className="w-3.5 h-3.5 text-zinc-550" />;
}

function getBrowserIcon(browser: string | null) {
  const name = (browser || "").toLowerCase();
  if (name.includes("chrome")) return <FaChrome className="w-3.5 h-3.5 text-red-400" />;
  if (name.includes("safari")) return <FaSafari className="w-3.5 h-3.5 text-blue-400" />;
  if (name.includes("firefox")) return <FaFirefox className="w-3.5 h-3.5 text-amber" />;
  if (name.includes("edge")) return <FaEdge className="w-3.5 h-3.5 text-cyan-400" />;
  return <FiGlobe className="w-3.5 h-3.5 text-zinc-550" />;
}

function getDeviceIcon(device: string | null) {
  const name = (device || "").toLowerCase();
  if (name === "mobile") return <FiSmartphone className="w-4 h-4 text-zinc-400" />;
  if (name === "tablet") return <FiTablet className="w-4 h-4 text-zinc-400" />;
  return <FiMonitor className="w-4 h-4 text-zinc-400" />;
}

export default function SettingsForm({
  initial,
  twoFactorEnabled,
  new2faSecret,
  activeSessions,
  currentSessionToken,
}: SettingsFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isSyncing, setIsSyncing] = useState(false);

  // Tab State
  const activeTab = searchParams.get("tab") || "general";
  const setTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Modal State for session revocation
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  // 2FA forms
  const [code2fa, setCode2fa] = useState("");
  
  // Password change form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSyncGithub = async () => {
    setIsSyncing(true);
    const toastId = toast.loading("Syncing live stats from GitHub...");
    try {
      const res = await fetch("/api/github-stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      
      if (typeof data.yearsExperience === "number") {
        setValue("statsYears", `${data.yearsExperience}+`, { shouldDirty: true });
      }
      if (typeof data.totalRepos === "number") {
        setValue("statsProjects", `${data.totalRepos}+`, { shouldDirty: true });
      }
      if (typeof data.totalContributions === "number") {
        setValue("statsContributions", `${data.totalContributions}+`, { shouldDirty: true });
      }
      if (typeof data.totalCommits === "number") {
        setValue("statsCommits", `${data.totalCommits}+`, { shouldDirty: true });
      }

      toast.success("GitHub stats synced! Click save to store them.", { id: toastId });
    } catch {
      toast.error("Failed to sync stats. Verify GITHUB_TOKEN.", { id: toastId });
    } finally {
      setIsSyncing(false);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch,
  } = useForm<SettingsInput>({ resolver: zodResolver(settingsSchema), defaultValues: initial });

  const profilePhotoUrl = watch("profilePhotoUrl");
  const heroPhotoUrl = watch("heroPhotoUrl");

  const onSubmit = (values: SettingsInput): void => {
    reset(values);
    const toastId = toast.loading("Saving settings...");
    startTransition(async () => {
      const res = await saveSettingsAction(values);
      if (res.error) {
        toast.error(res.error, { id: toastId });
        reset(initial);
      } else {
        toast.success("Settings saved successfully", { id: toastId });
        router.refresh();
      }
    });
  };

  // 2FA Submit Handlers
  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code2fa) return toast.error("Enter verification code");
    
    const toastId = toast.loading("Enabling 2FA...");
    const res = await enable2FAAction(new2faSecret, code2fa);
    if (res.error) {
      toast.error(res.error, { id: toastId });
    } else {
      toast.success("Two-factor authentication enabled successfully", { id: toastId });
      setCode2fa("");
      router.refresh();
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code2fa) return toast.error("Enter verification code");

    const toastId = toast.loading("Disabling 2FA...");
    const res = await disable2FAAction(code2fa);
    if (res.error) {
      toast.error(res.error, { id: toastId });
    } else {
      toast.success("Two-factor authentication disabled successfully", { id: toastId });
      setCode2fa("");
      router.refresh();
    }
  };

  // Password Change Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return toast.error("All fields are required");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");

    const toastId = toast.loading("Changing password...");
    const res = await changePasswordAction(currentPassword, newPassword);
    if (res.error) {
      toast.error(res.error, { id: toastId });
    } else {
      toast.success("Password updated successfully", { id: toastId });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  // Session Revocation Confirm
  const handleRevokeSession = async () => {
    if (!revokeTarget) return;
    const toastId = toast.loading("Terminating session...");
    const currentSession = activeSessions.find(s => s.token === currentSessionToken);
    const isCurrent = revokeTarget === currentSession?.id;

    const res = await revokeSessionAction(revokeTarget);
    setRevokeTarget(null);
    if (res.error) {
      toast.error(res.error, { id: toastId });
    } else {
      toast.success("Session terminated", { id: toastId });
      if (isCurrent) {
        toast.info("Your session was terminated. Redirecting to login...", { id: toastId });
        await logoutAction();
        window.location.href = "/admin/login";
      } else {
        router.refresh();
      }
    }
  };

  const inputClass =
    "w-full border border-[#262626] bg-black/40 px-4 py-2.5 font-mono text-xs text-white placeholder-zinc-600 outline-none focus:border-[#F59E0B] transition-colors";

  // Google Authenticator QR Url builder
  const otpAuthUrl = `otpauth://totp/Portfolio:Admin?secret=${new2faSecret}&issuer=Portfolio`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(otpAuthUrl)}`;

  return (
    <div className="space-y-6">
      {/* Editorial Navigation Tabs */}
      <div className="relative border-b border-[#262626]">
        {/* Right Fade indicator on mobile */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black via-black/80 to-transparent pointer-events-none z-10 md:hidden" />
        
        <div className="flex flex-row flex-nowrap overflow-x-auto scrollbar-none gap-px bg-[#262626]/20 font-mono text-[11px] font-bold uppercase tracking-wider min-w-0 pr-8 md:pr-0">
          {["general", "hero-bio", "social", "security", "sessions"].map((tab) => {
            const labels = {
              general: "General",
              "hero-bio": "Hero & Bio",
              social: "Social",
              security: "Security & 2FA",
              sessions: `Devices (${activeSessions.filter((s) => s.active).length})`,
            };
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setTab(tab)}
                className={cn(
                  "border-b-2 px-5 py-3 transition-colors cursor-pointer whitespace-nowrap shrink-0",
                  isActive
                    ? "border-[#F59E0B] bg-[#0c0c0c] text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-[#0c0c0c]/40"
                )}
              >
                {labels[tab as keyof typeof labels]}
              </button>
            );
          })}
        </div>
      </div>

      {/* GENERAL TAB */}
      {activeTab === "general" && (
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl space-y-6" noValidate>
          <div className="border border-[#262626] bg-[#0c0c0c] p-6 space-y-5">
            <h3 className="font-mono text-xs font-bold text-[#F59E0B] uppercase tracking-widest border-b border-[#262626] pb-3 mb-4 flex items-center gap-1.5">
              <FiSettings className="w-4 h-4 text-amber" />
              General Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <FiGlobe className="w-3.5 h-3.5 text-zinc-550" /> Site Name
                </label>
                <input {...register("siteName")} placeholder="Hanan Bhatti" className={inputClass} />
                {errors.siteName ? <p className="font-mono text-[10px] text-red-400">{errors.siteName?.message}</p> : null}
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <FiTag className="w-3.5 h-3.5 text-zinc-550" /> Tagline
                </label>
                <input {...register("tagline")} placeholder="Full-Stack Developer" className={inputClass} />
                {errors.tagline ? <p className="font-mono text-[10px] text-red-400">{errors.tagline?.message}</p> : null}
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <FiMail className="w-3.5 h-3.5 text-zinc-550" /> Public Email
                </label>
                <input {...register("socialEmail")} placeholder="you@example.com" className={inputClass} />
                {errors.socialEmail ? <p className="font-mono text-[10px] text-red-400">{errors.socialEmail?.message}</p> : null}
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <FiMapPin className="w-3.5 h-3.5 text-zinc-550" /> Footer Location
                </label>
                <input {...register("footerLocation")} placeholder="Lahore, Pakistan" className={inputClass} />
                {errors.footerLocation ? <p className="font-mono text-[10px] text-red-400">{errors.footerLocation?.message}</p> : null}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <FiClock className="w-3.5 h-3.5 text-zinc-550" /> Footer Timezone / Awake Info
                </label>
                <input {...register("footerTimezone")} placeholder="GMT+5 · Usually awake at 2am" className={inputClass} />
                {errors.footerTimezone ? <p className="font-mono text-[10px] text-red-400">{errors.footerTimezone?.message}</p> : null}
              </div>
            </div>
          </div>

          {/* Sync Stats */}
          <div className="border border-[#262626] bg-[#0c0c0c] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3 mb-2">
              <h3 className="font-mono text-xs font-bold text-[#F59E0B] uppercase tracking-widest flex items-center gap-1.5">
                <FiActivity className="w-4 h-4 text-amber" />
                GitHub Statistics
              </h3>
              <button
                type="button"
                onClick={handleSyncGithub}
                disabled={isSyncing}
                className="border border-[#262626] bg-black/40 px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-300 hover:border-[#10B981] hover:text-[#10B981] disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSyncing ? "Syncing..." : "Sync from GitHub"}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <FiCalendar className="w-3.5 h-3.5 text-zinc-550" /> Experience
                </label>
                <input {...register("statsYears")} placeholder="3+" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <FiBriefcase className="w-3.5 h-3.5 text-zinc-550" /> Projects
                </label>
                <input {...register("statsProjects")} placeholder="20+" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <FiActivity className="w-3.5 h-3.5 text-zinc-550" /> Contributions
                </label>
                <input {...register("statsContributions")} placeholder="500+" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <FiCheckSquare className="w-3.5 h-3.5 text-zinc-550" /> Commits
                </label>
                <input {...register("statsCommits")} placeholder="1200+" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Analytics Settings */}
          <div className="border border-[#262626] bg-[#0c0c0c] p-6 space-y-5">
            <h3 className="font-mono text-xs font-bold text-[#F59E0B] uppercase tracking-widest border-b border-[#262626] pb-3 mb-4 flex items-center gap-1.5">
              <FiMonitor className="w-4 h-4 text-amber" />
              Analytics Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">Enable Visitor Tracking</label>
                <select {...register("analytics_enabled")} className={inputClass}>
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <MarkdownTextarea
                  label="Cookie Banner Consent Text"
                  value={watch("cookie_consent_text") || ""}
                  onChange={(v) => setValue("cookie_consent_text", v, { shouldDirty: true })}
                  placeholder="We use cookies..."
                  rows={2}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || !isDirty}
            className="border border-[#F59E0B] bg-[#F59E0B]/10 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-[#F59E0B] hover:bg-[#F59E0B]/25 disabled:opacity-30 transition-all cursor-pointer"
          >
            {isPending ? "Saving..." : "Save Settings"}
          </button>
        </form>
      )}

      {/* HERO & BIO TAB */}
      {activeTab === "hero-bio" && (
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl space-y-6" noValidate>
          <div className="border border-[#262626] bg-[#0c0c0c] p-6 space-y-5">
            <h3 className="font-mono text-xs font-bold text-[#F59E0B] uppercase tracking-widest border-b border-[#262626] pb-3 mb-4 flex items-center gap-1.5">
              <FiUser className="w-4 h-4 text-amber" />
              Hero & Biography Settings
            </h3>

            {/* Profile Photo & Hero Photo Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 border border-[#262626] bg-black/20">
              {/* Profile Photo URL */}
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <FiUser className="w-3.5 h-3.5 text-zinc-550" /> Profile Photo URL
                </label>
                <input {...register("profilePhotoUrl")} placeholder="https://..." className={inputClass} />
                {profilePhotoUrl && (
                  <div className="relative mt-2 h-16 w-16 border border-[#262626] bg-black/40">
                    <Image src={profilePhotoUrl} alt="Profile preview" fill className="object-cover" />
                  </div>
                )}
              </div>

              {/* Hero Photo - UploadThing */}
              <div className="space-y-3">
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <FiAward className="w-3.5 h-3.5 text-zinc-550" /> Hero Photo Banner
                </label>
                {heroPhotoUrl ? (
                  <div className="relative h-24 w-full border border-[#262626] bg-black/30">
                    <Image src={heroPhotoUrl} alt="Hero banner preview" fill className="object-contain" />
                    <button
                      type="button"
                      onClick={() => setValue("heroPhotoUrl", "", { shouldDirty: true })}
                      className="absolute top-2 right-2 border border-red-500 bg-red-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-red-500 hover:bg-red-500/25 transition-all cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex h-16 items-center justify-center border border-dashed border-[#262626] font-mono text-[10px] text-zinc-650 uppercase tracking-wider">
                    No photo uploaded
                  </div>
                )}
                <div className="flex justify-start">
                  <UploadButton
                    endpoint="imageUploader"
                    onBeforeUploadBegin={async (files: File[]) => {
                      toast.loading("Compressing and uploading photo...", { id: "settings-photo-upload" });
                      return compressImages(files);
                    }}
                    onClientUploadComplete={(res) => {
                      const url = res[0]?.ufsUrl ?? res[0]?.url;
                      if (url) {
                        setValue("heroPhotoUrl", url, { shouldDirty: true });
                        toast.success("Hero photo uploaded", { id: "settings-photo-upload" });
                      }
                    }}
                    onUploadError={(error: Error) => {
                      toast.error(`Upload failed: ${error.message}`, { id: "settings-photo-upload" });
                    }}
                    appearance={{ button: { background: "var(--amber)", color: "#000", fontWeight: 700, fontSize: 11, padding: "6px 12px", border: "none", cursor: "pointer" }, allowedContent: { display: "none" } }}
                  />
                </div>
              </div>
            </div>

            {/* Hero Tagline */}
            <div className="space-y-1.5">
              <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <FiTag className="w-3.5 h-3.5 text-zinc-550" /> Hero Tagline
              </label>
              <input {...register("heroTagline")} placeholder="Engineer by logic. Designer by obsession." className={inputClass} />
              {errors.heroTagline ? <p className="font-mono text-[10px] text-red-400">{errors.heroTagline?.message}</p> : null}
            </div>

             {/* About Bio */}
            <div className="space-y-1.5">
              <MarkdownTextarea
                label={
                  <span className="flex items-center gap-1.5">
                    <FiTerminal className="w-3.5 h-3.5 text-zinc-550" /> About Bio
                  </span>
                }
                value={watch("aboutBio") || ""}
                onChange={(v) => setValue("aboutBio", v, { shouldDirty: true })}
                placeholder="Tell visitors about yourself..."
                rows={6}
              />
              {errors.aboutBio ? <p className="font-mono text-[10px] text-red-400">{errors.aboutBio?.message}</p> : null}
            </div>

            {/* Marquee Skills */}
            <div className="space-y-1.5">
              <MarkdownTextarea
                label={
                  <span className="flex items-center gap-1.5">
                    <FiCpu className="w-3.5 h-3.5 text-zinc-550" /> Marquee Skills (comma-separated)
                  </span>
                }
                value={watch("marqueeSkills") || ""}
                onChange={(v) => setValue("marqueeSkills", v, { shouldDirty: true })}
                placeholder="FULL STACK, DEVOPS, C++"
                rows={3}
                customPreview={
                  <div className="w-full pointer-events-none opacity-90 py-1 bg-black/40 border border-[#262626]">
                    <ScrollingMarquee skills={watch("marqueeSkills") || ""} />
                  </div>
                }
              />
              {errors.marqueeSkills ? <p className="font-mono text-[10px] text-red-400">{errors.marqueeSkills?.message}</p> : null}
            </div>

          </div>

          <button
            type="submit"
            disabled={isPending || !isDirty}
            className="border border-[#F59E0B] bg-[#F59E0B]/10 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-[#F59E0B] hover:bg-[#F59E0B]/25 disabled:opacity-30 transition-all cursor-pointer"
          >
            {isPending ? "Saving..." : "Save Settings"}
          </button>
        </form>
      )}

      {/* SOCIAL LINKS TAB */}
      {activeTab === "social" && (
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl space-y-6" noValidate>
          <div className="border border-[#262626] bg-[#0c0c0c] p-6 space-y-5">
            <h3 className="font-mono text-xs font-bold text-[#F59E0B] uppercase tracking-widest border-b border-[#262626] pb-3 mb-4 flex items-center gap-1.5">
              <FiShare2 className="w-4 h-4 text-amber" />
              Social Links
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <FaGithub className="w-3.5 h-3.5 text-zinc-550" /> GitHub URL
                </label>
                <input {...register("socialGithub")} placeholder="https://github.com/username" className={inputClass} />
                {errors.socialGithub ? <p className="font-mono text-[10px] text-red-400">{errors.socialGithub?.message}</p> : null}
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <FaLinkedin className="w-3.5 h-3.5 text-zinc-550" /> LinkedIn URL
                </label>
                <input {...register("socialLinkedin")} placeholder="https://linkedin.com/in/username" className={inputClass} />
                {errors.socialLinkedin ? <p className="font-mono text-[10px] text-red-400">{errors.socialLinkedin?.message}</p> : null}
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <FaTwitter className="w-3.5 h-3.5 text-zinc-550" /> Twitter / X URL
                </label>
                <input {...register("socialTwitter")} placeholder="https://x.com/username" className={inputClass} />
                {errors.socialTwitter ? <p className="font-mono text-[10px] text-red-400">{errors.socialTwitter?.message}</p> : null}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || !isDirty}
            className="border border-[#F59E0B] bg-[#F59E0B]/10 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-[#F59E0B] hover:bg-[#F59E0B]/25 disabled:opacity-30 transition-all cursor-pointer"
          >
            {isPending ? "Saving..." : "Save Settings"}
          </button>
        </form>
      )}

      {/* SECURITY & 2FA TAB */}
      {activeTab === "security" && (
        <div className="max-w-4xl space-y-6">
          {/* Change Password */}
          <form onSubmit={handleChangePassword} className="border border-[#262626] bg-[#0c0c0c] p-6 space-y-5" noValidate>
            <h3 className="font-mono text-xs font-bold text-[#F59E0B] uppercase tracking-widest border-b border-[#262626] pb-3 mb-4 flex items-center gap-1.5">
              <FiLock className="w-4 h-4 text-amber" />
              Change Account Password
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <FiKey className="w-3 h-3 text-zinc-550" /> Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <FiLock className="w-3 h-3 text-zinc-550" /> New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <FiCheckSquare className="w-3 h-3 text-zinc-550" /> Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="border border-[#F59E0B] bg-[#F59E0B]/10 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-[#F59E0B] hover:bg-[#F59E0B]/25 transition-all cursor-pointer mt-2"
            >
              Update Password
            </button>
          </form>

          {/* Two-Factor Authentication Setup */}
          <div className="border border-[#262626] bg-[#0c0c0c] p-6 space-y-5">
            <h3 className="font-mono text-xs font-bold text-[#F59E0B] uppercase tracking-widest border-b border-[#262626] pb-3 mb-4 flex items-center gap-1.5">
              <FiShield className="w-4 h-4 text-amber" />
              Two-Factor Authentication (2FA)
            </h3>

            {twoFactorEnabled ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 border border-[#10B981] bg-[#10B981]/5 p-4 font-mono text-xs text-[#10B981]">
                  <span className="h-2 w-2 bg-[#10B981] animate-pulse" />
                  <span>2FA IS ACTIVE & ENFORCED ON YOUR ACCOUNT</span>
                </div>
                <p className="font-sans text-xs text-zinc-400">
                  Enter a code from your authenticator app below to disable two-factor authentication.
                </p>
                <form onSubmit={handleDisable2FA} className="flex gap-2 items-end">
                  <div className="space-y-1.5 flex-1 max-w-[200px]">
                    <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">6-Digit Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={code2fa}
                      onChange={(e) => setCode2fa(e.target.value)}
                      className={cn(inputClass, "tracking-[0.5em] text-center font-bold text-sm")}
                    />
                  </div>
                  <button
                    type="submit"
                    className="border border-red-500 bg-red-500/10 px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/25 transition-all h-[38px] cursor-pointer"
                  >
                    Disable 2FA
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="border border-[#F59E0B] bg-[#F59E0B]/5 p-4 font-mono text-xs text-[#F59E0B]">
                  <span>2FA IS INACTIVE</span>
                </div>
                <p className="font-sans text-xs text-zinc-400 leading-relaxed">
                  Protect your admin account. Scan the QR code or enter the secret key below into Google Authenticator/Authy, then verify the code to activate.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 items-center border border-[#262626] bg-black/20 p-4">
                  {/* QR code */}
                  <div className="bg-white p-2 border border-[#262626] shrink-0">
                    <img src={qrCodeUrl} alt="2FA Setup QR Code" className="h-40 w-40" />
                  </div>
                  <div className="space-y-3 w-full">
                    <div>
                      <span className="block font-mono text-[9px] font-bold uppercase tracking-wider text-zinc-500">Setup Key</span>
                      <code className="block border border-[#262626] bg-black/30 p-2 font-mono text-xs text-white select-all break-all">
                        {new2faSecret}
                      </code>
                    </div>
                    <div>
                      <span className="block font-mono text-[9px] font-bold uppercase tracking-wider text-zinc-500">Authenticator App URL</span>
                      <span className="block font-mono text-[9px] text-zinc-500 truncate select-all">{otpAuthUrl}</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleEnable2FA} className="flex gap-2 items-end">
                  <div className="space-y-1.5 flex-1 max-w-[200px]">
                    <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">Verification Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={code2fa}
                      onChange={(e) => setCode2fa(e.target.value)}
                      className={cn(inputClass, "tracking-[0.5em] text-center font-bold text-sm")}
                    />
                  </div>
                  <button
                    type="submit"
                    className="border border-[#10B981] bg-[#10B981]/10 px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-[#10B981] hover:bg-[#10B981]/25 transition-all h-[38px] cursor-pointer"
                  >
                    Enable 2FA
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}      {/* SESSIONS & DEVICES TAB */}
      {activeTab === "sessions" && (
        <div className="max-w-4xl space-y-6">
          <div className="border border-[#262626] bg-[#0c0c0c] p-6 space-y-4">
            <div className="border-b border-[#262626] pb-3 mb-4">
              <h3 className="font-mono text-xs font-bold text-[#F59E0B] uppercase tracking-widest flex items-center gap-1.5">
                <FiMonitor className="w-4 h-4 text-amber" />
                Active Logged-in Devices
              </h3>
              <p className="font-sans text-xs text-zinc-500 mt-1">
                A history of sessions and browsers that have authenticated to this admin account.
              </p>
            </div>

            <div className="space-y-3">
              {activeSessions.map((session) => {
                const isCurrent = session.token === currentSessionToken;
                const isExpanded = expandedSession === session.id;
                
                return (
                  <div
                    key={session.id}
                    className={cn(
                      "border border-[#262626] bg-black/30 transition-all",
                      !session.active && "opacity-40"
                    )}
                  >
                    {/* Header Row */}
                    <div
                      onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] select-none"
                    >
                      <div className="flex items-center gap-3">
                        {getDeviceIcon(session.deviceType)}
                        <div className="font-mono text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white uppercase tracking-wider">
                              {session.deviceType || "unknown device"}
                            </span>
                            {isCurrent && (
                              <span className="border border-[#10B981] bg-[#10B981]/15 px-1.5 py-0.5 text-[9px] font-bold text-[#10B981] uppercase tracking-wide">
                                Current Session
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-550 mt-0.5 flex items-center gap-1.5">
                            <span>IP: {session.ipAddress || "127.0.0.1"}</span>
                            <span>·</span>
                            <span>{isCurrent ? "Active Now" : formatDate(session.lastUsedAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {session.active ? (
                          !isCurrent && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRevokeTarget(session.id);
                              }}
                              className="border border-red-500 bg-red-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-red-500 hover:bg-red-500/25 transition-all cursor-pointer"
                            >
                              Revoke
                            </button>
                          )
                        ) : (
                          <span className="text-[10px] text-zinc-650 font-bold uppercase tracking-wider pr-1">Revoked</span>
                        )}
                        <span className="text-zinc-550">
                          {isExpanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                        </span>
                      </div>
                    </div>

                    {/* Expandable Details Grid */}
                    {isExpanded && (
                      <div className="border-t border-[#262626] bg-[#0c0c0c]/80 p-4 font-mono text-[11px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <span className="block text-[9px] font-bold text-zinc-550 uppercase tracking-widest">Operating System</span>
                          <span className="flex items-center gap-1.5 text-zinc-300 mt-1">
                            {getOSIcon(session.os)}
                            <span className="capitalize">{session.os || "unknown"}</span>
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-zinc-550 uppercase tracking-widest">Browser Agent</span>
                          <span className="flex items-center gap-1.5 text-zinc-300 mt-1">
                            {getBrowserIcon(session.browser)}
                            <span className="capitalize">{session.browser || "unknown"}</span>
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-zinc-550 uppercase tracking-widest">Geo Location</span>
                          <span className="flex items-center gap-1.5 text-zinc-300 mt-1">
                            {session.country ? (
                              <>
                                <img
                                  src={`https://flagcdn.com/16x12/${session.country.toLowerCase()}.png`}
                                  alt={session.country}
                                  className="w-4 h-3 object-cover shrink-0 border border-zinc-700/60"
                                />
                                <span>{session.city ? `${session.city}, ` : ""}{session.country.toUpperCase()}</span>
                              </>
                            ) : (
                              <>
                                <FiGlobe className="w-3.5 h-3.5 text-zinc-550" />
                                <span className="italic text-zinc-500">Unknown Location</span>
                              </>
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-zinc-550 uppercase tracking-widest">Established & Expiry</span>
                          <span className="text-zinc-300 block mt-1">
                            {formatDate(session.createdAt)}
                          </span>
                          <span className="text-[10px] text-zinc-500 block mt-0.5">
                            Expires: {formatDate(new Date(new Date(session.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000))}
                            {" "}(in {Math.max(0, Math.ceil((new Date(session.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000)))} days)
                          </span>
                        </div>
                        {session.userAgent && (
                          <div className="md:col-span-2 lg:col-span-4 border-t border-[#262626]/50 pt-2.5">
                            <span className="block text-[9px] font-bold text-zinc-550 uppercase tracking-widest">Raw User Agent String</span>
                            <span className="text-zinc-500 text-[10px] break-all block mt-1 leading-normal">
                              {session.userAgent}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {activeSessions.length === 0 ? (
                <div className="py-8 text-center text-zinc-550 font-mono text-xs uppercase border border-[#262626] bg-black/10">
                  No sessions recorded
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Editorial Confirmation Modal for Session Revocation */}
      <EditorialModal
        isOpen={revokeTarget !== null}
        type="danger"
        title="Revoke Session?"
        description="Are you sure you want to terminate this active device login session? The device will be logged out of the admin panel immediately."
        confirmLabel="Terminate"
        cancelLabel="Keep Session"
        onConfirm={handleRevokeSession}
        onCancel={() => setRevokeTarget(null)}
      />
    </div>
  );
}
