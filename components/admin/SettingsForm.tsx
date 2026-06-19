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
} from "@/lib/actions";
import { UploadButton } from "@/lib/uploadthing";
import { compressImages } from "@/lib/image-compress";
import { cn, formatDate } from "@/lib/utils";
import EditorialModal from "./EditorialModal";

interface SessionData {
  id: string;
  token: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
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
    const res = await revokeSessionAction(revokeTarget);
    setRevokeTarget(null);
    if (res.error) {
      toast.error(res.error, { id: toastId });
    } else {
      toast.success("Session terminated", { id: toastId });
      router.refresh();
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
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-6" noValidate>
          <div className="border border-[#262626] bg-[#0c0c0c] p-6 space-y-5">
            <h3 className="font-mono text-xs font-bold text-[#F59E0B] uppercase tracking-widest border-b border-[#262626] pb-3 mb-4">
              General Settings
            </h3>
            {GENERAL_FIELDS.map((field) => (
              <div key={field.name} className="space-y-1.5">
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  {field.label}
                </label>
                <input {...register(field.name)} placeholder={field.placeholder} className={inputClass} />
                {errors[field.name] ? <p className="font-mono text-[10px] text-red-400">{errors[field.name]?.message}</p> : null}
              </div>
            ))}
          </div>

          {/* Sync Stats */}
          <div className="border border-[#262626] bg-[#0c0c0c] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3 mb-2">
              <h3 className="font-mono text-xs font-bold text-[#F59E0B] uppercase tracking-widest">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">Years Experience</label>
                <input {...register("statsYears")} placeholder="3+" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">Projects Built</label>
                <input {...register("statsProjects")} placeholder="20+" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">Contributions</label>
                <input {...register("statsContributions")} placeholder="500+" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">GitHub Commits</label>
                <input {...register("statsCommits")} placeholder="1200+" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Analytics Settings */}
          <div className="border border-[#262626] bg-[#0c0c0c] p-6 space-y-5">
            <h3 className="font-mono text-xs font-bold text-[#F59E0B] uppercase tracking-widest border-b border-[#262626] pb-3 mb-4">
              Analytics Settings
            </h3>
            <div className="space-y-1.5">
              <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">Enable Visitor Tracking</label>
              <select {...register("analytics_enabled")} className={inputClass}>
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">Cookie Banner Consent Text</label>
              <textarea {...register("cookie_consent_text")} placeholder="We use cookies..." rows={3} className={inputClass} />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || !isDirty}
            className="border border-[#F59E0B] bg-[#F59E0B]/10 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-[#F59E0B] hover:bg-[#F59E0B]/25 disabled:opacity-30 transition-all"
          >
            {isPending ? "Saving..." : "Save Settings"}
          </button>
        </form>
      )}

      {/* HERO & BIO TAB */}
      {activeTab === "hero-bio" && (
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-6" noValidate>
          <div className="border border-[#262626] bg-[#0c0c0c] p-6 space-y-5">
            <h3 className="font-mono text-xs font-bold text-[#F59E0B] uppercase tracking-widest border-b border-[#262626] pb-3 mb-4">
              Hero & Biography Settings
            </h3>

            {/* Profile Photo URL */}
            <div className="space-y-1.5">
              <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">Profile Photo URL</label>
              <input {...register("profilePhotoUrl")} placeholder="https://..." className={inputClass} />
              {profilePhotoUrl && (
                <div className="relative mt-2 h-16 w-16 border border-[#262626] bg-black/40">
                  <Image src={profilePhotoUrl} alt="Profile preview" fill className="object-cover" />
                </div>
              )}
            </div>

            {/* Hero Photo - UploadThing */}
            <div className="border border-[#262626] bg-black/20 p-4 space-y-3">
              <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">Hero Photo Banner</label>
              {heroPhotoUrl ? (
                <div className="relative h-40 w-full border border-[#262626] bg-black/30">
                  <Image src={heroPhotoUrl} alt="Hero banner preview" fill className="object-contain" />
                  <button
                    type="button"
                    onClick={() => setValue("heroPhotoUrl", "", { shouldDirty: true })}
                    className="absolute top-2 right-2 border border-red-500 bg-red-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-red-500 hover:bg-red-500/25 transition-all"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex h-20 items-center justify-center border border-dashed border-[#262626] font-mono text-[10px] text-zinc-600 uppercase tracking-wider">
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
                    const url = res[0]?.url;
                    if (url) {
                      setValue("heroPhotoUrl", url, { shouldDirty: true });
                      toast.success("Hero photo uploaded", { id: "settings-photo-upload" });
                    }
                  }}
                  onUploadError={(error: Error) => {
                    toast.error(`Upload failed: ${error.message}`, { id: "settings-photo-upload" });
                  }}
                />
              </div>
            </div>

            {HERO_FIELDS.map((field) => (
              <div key={field.name} className="space-y-1.5">
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  {field.label}
                </label>
                {field.textarea ? (
                  <textarea {...register(field.name)} placeholder={field.placeholder} rows={5} className={inputClass} />
                ) : (
                  <input {...register(field.name)} placeholder={field.placeholder} className={inputClass} />
                )}
                {errors[field.name] ? <p className="font-mono text-[10px] text-red-400">{errors[field.name]?.message}</p> : null}
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={isPending || !isDirty}
            className="border border-[#F59E0B] bg-[#F59E0B]/10 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-[#F59E0B] hover:bg-[#F59E0B]/25 disabled:opacity-30 transition-all"
          >
            {isPending ? "Saving..." : "Save Settings"}
          </button>
        </form>
      )}

      {/* SOCIAL LINKS TAB */}
      {activeTab === "social" && (
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-6" noValidate>
          <div className="border border-[#262626] bg-[#0c0c0c] p-6 space-y-5">
            <h3 className="font-mono text-xs font-bold text-[#F59E0B] uppercase tracking-widest border-b border-[#262626] pb-3 mb-4">
              Social Links
            </h3>
            {SOCIAL_FIELDS.map((field) => (
              <div key={field.name} className="space-y-1.5">
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  {field.label}
                </label>
                <input {...register(field.name)} placeholder={field.placeholder} className={inputClass} />
                {errors[field.name] ? <p className="font-mono text-[10px] text-red-400">{errors[field.name]?.message}</p> : null}
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={isPending || !isDirty}
            className="border border-[#F59E0B] bg-[#F59E0B]/10 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-[#F59E0B] hover:bg-[#F59E0B]/25 disabled:opacity-30 transition-all"
          >
            {isPending ? "Saving..." : "Save Settings"}
          </button>
        </form>
      )}

      {/* SECURITY & 2FA TAB */}
      {activeTab === "security" && (
        <div className="max-w-xl space-y-6">
          {/* Change Password */}
          <form onSubmit={handleChangePassword} className="border border-[#262626] bg-[#0c0c0c] p-6 space-y-5">
            <h3 className="font-mono text-xs font-bold text-[#F59E0B] uppercase tracking-widest border-b border-[#262626] pb-3 mb-4">
              Change Account Password
            </h3>
            <div className="space-y-1.5">
              <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <button
              type="submit"
              className="border border-[#F59E0B] bg-[#F59E0B]/10 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-[#F59E0B] hover:bg-[#F59E0B]/25 transition-all"
            >
              Update Password
            </button>
          </form>

          {/* Two-Factor Authentication Setup */}
          <div className="border border-[#262626] bg-[#0c0c0c] p-6 space-y-5">
            <h3 className="font-mono text-xs font-bold text-[#F59E0B] uppercase tracking-widest border-b border-[#262626] pb-3 mb-4">
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
                    className="border border-red-500 bg-red-500/10 px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/25 transition-all h-[38px]"
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
                    className="border border-[#10B981] bg-[#10B981]/10 px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-[#10B981] hover:bg-[#10B981]/25 transition-all h-[38px]"
                  >
                    Enable 2FA
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SESSIONS & DEVICES TAB */}
      {activeTab === "sessions" && (
        <div className="space-y-6">
          <div className="border border-[#262626] bg-[#0c0c0c] p-6 space-y-4">
            <div className="border-b border-[#262626] pb-3 mb-4">
              <h3 className="font-mono text-xs font-bold text-[#F59E0B] uppercase tracking-widest">
                Active Logged-in Devices
              </h3>
              <p className="font-sans text-xs text-zinc-500 mt-1">
                A history of sessions and browsers that have authenticated to this admin account.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-[#262626] text-zinc-500 uppercase tracking-widest text-[9px] font-bold">
                    <th className="py-3 px-2">Device & OS</th>
                    <th className="py-3 px-2">Browser</th>
                    <th className="py-3 px-2">IP Address</th>
                    <th className="py-3 px-2">Last Active</th>
                    <th className="py-3 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626]">
                  {activeSessions.map((session) => {
                    const isCurrent = session.token === currentSessionToken;
                    return (
                      <tr key={session.id} className={cn("hover:bg-white/[0.01]", !session.active && "opacity-35")}>
                        <td className="py-3 px-2 font-medium text-white flex items-center gap-2">
                          <span className="capitalize">{session.deviceType || "unknown"}</span>
                          <span className="text-[10px] text-zinc-500 uppercase">({session.os || "unknown"})</span>
                        </td>
                        <td className="py-3 px-2 text-zinc-300">{session.browser || "unknown"}</td>
                        <td className="py-3 px-2 text-zinc-400">{session.ipAddress || "127.0.0.1"}</td>
                        <td className="py-3 px-2 text-zinc-500">
                          {isCurrent ? (
                            <span className="border border-[#10B981] bg-[#10B981]/15 px-1.5 py-0.5 text-[9px] font-bold text-[#10B981] uppercase tracking-wide">
                              Active Now
                            </span>
                          ) : (
                            formatDate(session.lastUsedAt)
                          )}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {isCurrent ? (
                            <span className="text-[10px] text-[#10B981] font-bold uppercase tracking-wider pr-2">Current</span>
                          ) : session.active ? (
                            <button
                              type="button"
                              onClick={() => setRevokeTarget(session.id)}
                              className="border border-red-500 bg-red-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-500 hover:bg-red-500/25 transition-all"
                            >
                              Revoke
                            </button>
                          ) : (
                            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider pr-2">Revoked</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {activeSessions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-600 font-mono text-xs">
                        No sessions recorded
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
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
