"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginAction, requestPasswordResetAction, resetPasswordAction } from "@/lib/actions";
import { FiShield, FiLock, FiMail, FiArrowLeft } from "react-icons/fi";
import { cn } from "@/lib/utils";

interface LoginFormProps {
  adminCount: number;
  resetToken?: string;
}

type ViewState = "login" | "two_factor" | "forgot" | "reset";

export default function LoginForm({ adminCount, resetToken }: LoginFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // View state flow
  const [view, setView] = useState<ViewState>(resetToken ? "reset" : "login");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code2fa, setCode2fa] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    startTransition(async () => {
      const res = await loginAction({ email, password, code: code2fa });
      if (res.error === "2FA_REQUIRED") {
        setView("two_factor");
      } else if (res.error) {
        setError(res.error);
      } else {
        // Success
        router.push("/admin/dashboard");
        router.refresh();
      }
    });
  };

  const handle2faSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code2fa) {
      setError("Please enter the 6-digit code");
      return;
    }

    startTransition(async () => {
      const res = await loginAction({ email, password, code: code2fa });
      if (res.error) {
        setError(res.error);
      } else {
        router.push("/admin/dashboard");
        router.refresh();
      }
    });
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    startTransition(async () => {
      const res = await requestPasswordResetAction(email);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMessage("If that account exists, a reset link has been sent to your email.");
      }
    });
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword) {
      setError("Password cannot be blank");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    startTransition(async () => {
      const res = await resetPasswordAction(resetToken || "", newPassword);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMessage("Password reset successfully. You can now sign in.");
        setView("login");
      }
    });
  };

  const inputClass =
    "w-full border border-[#262626] bg-black/45 px-4 py-3 font-mono text-xs text-white placeholder-zinc-650 outline-none focus:border-[#F59E0B] transition-colors";

  return (
    <div className="space-y-6">
      {/* Alert Notices */}
      {error && (
        <div className="border border-red-500 bg-red-500/5 px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-red-500">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="border border-[#10B981] bg-[#10B981]/5 px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-[#10B981]">
          {successMessage}
        </div>
      )}

      {/* LOGIN VIEW */}
      {view === "login" && (
        <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
          {adminCount === 0 && (
            <div className="border border-[#F59E0B] bg-[#F59E0B]/5 p-4 font-mono text-[10px] font-bold uppercase tracking-wider text-[#F59E0B] leading-relaxed">
              ⚠️ NO ADMIN USER DETECTED. THE EMAIL & PASSWORD ENTERED BELOW WILL BE REGISTERED AS THE MASTER ADMIN.
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">Email Address</label>
            <div className="relative">
              <input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">Password</label>
              {adminCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMessage(null);
                    setView("forgot");
                  }}
                  className="font-mono text-[10px] text-zinc-500 hover:text-[#F59E0B] transition-colors"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full border border-[#10B981] bg-[#10B981]/10 py-3 font-mono text-xs font-bold uppercase tracking-widest text-[#10B981] hover:bg-[#10B981]/25 transition-all disabled:opacity-40"
          >
            {isPending
              ? "Authenticating..."
              : adminCount === 0
              ? "Initialize Master Admin"
              : "Sign In"}
          </button>
        </form>
      )}

      {/* TWO FACTOR VERIFICATION VIEW */}
      {view === "two_factor" && (
        <form onSubmit={handle2faSubmit} className="space-y-4" noValidate>
          <div className="border border-[#F59E0B] bg-[#F59E0B]/5 p-4 font-mono text-[10px] font-bold uppercase tracking-wider text-[#F59E0B]">
            🛡️ TWO-FACTOR AUTHENTICATION IS ENABLED
          </div>
          <p className="font-sans text-xs text-zinc-400 leading-relaxed">
            Please open your authenticator app (Google Authenticator, Authy, etc.) and enter the 6-digit verification code below.
          </p>

          <div className="space-y-1.5">
            <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">Verification Code</label>
            <input
              type="text"
              maxLength={6}
              placeholder="000000"
              value={code2fa}
              onChange={(e) => setCode2fa(e.target.value)}
              className={cn(inputClass, "tracking-[0.5em] text-center font-bold text-sm")}
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setView("login");
              }}
              className="flex-1 border border-zinc-700 bg-zinc-800/40 py-3 font-mono text-xs font-bold uppercase tracking-widest text-zinc-300 hover:bg-zinc-800 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 border border-[#10B981] bg-[#10B981]/15 py-3 font-mono text-xs font-bold uppercase tracking-widest text-[#10B981] hover:bg-[#10B981]/30 transition-all disabled:opacity-40"
            >
              {isPending ? "Verifying..." : "Verify Code"}
            </button>
          </div>
        </form>
      )}

      {/* FORGOT PASSWORD VIEW */}
      {view === "forgot" && (
        <form onSubmit={handleForgotSubmit} className="space-y-4" noValidate>
          <p className="font-sans text-xs text-zinc-400 leading-relaxed">
            Enter your admin email address below. If the account is found, we will send you an email with a link to reset your password.
          </p>

          <div className="space-y-1.5">
            <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">Admin Email</label>
            <input
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setSuccessMessage(null);
                setView("login");
              }}
              className="border border-zinc-700 bg-zinc-800/40 px-4 py-3 font-mono text-xs font-bold uppercase tracking-widest text-zinc-300 hover:bg-zinc-800 transition-all"
            >
              <FiArrowLeft className="inline mr-1" /> Back
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 border border-[#F59E0B] bg-[#F59E0B]/15 py-3 font-mono text-xs font-bold uppercase tracking-widest text-[#F59E0B] hover:bg-[#F59E0B]/30 transition-all disabled:opacity-40"
            >
              {isPending ? "Sending..." : "Request Reset Link"}
            </button>
          </div>
        </form>
      )}

      {/* RESET PASSWORD VIEW */}
      {view === "reset" && (
        <form onSubmit={handleResetSubmit} className="space-y-4" noValidate>
          <div className="border border-[#F59E0B] bg-[#F59E0B]/5 p-4 font-mono text-[10px] font-bold uppercase tracking-wider text-[#F59E0B]">
            🔐 RESET PASSWORD VERIFIED
          </div>
          <p className="font-sans text-xs text-zinc-400 leading-relaxed">
            Please enter your new administrator password. Once updated, you will be redirected to sign in with your new credentials.
          </p>

          <div className="space-y-1.5">
            <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">New Password</label>
            <input
              type="password"
              placeholder="••••••••"
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
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full border border-[#10B981] bg-[#10B981]/15 py-3 font-mono text-xs font-bold uppercase tracking-widest text-[#10B981] hover:bg-[#10B981]/30 transition-all disabled:opacity-40"
          >
            {isPending ? "Updating Password..." : "Update Password"}
          </button>
        </form>
      )}
    </div>
  );
}
