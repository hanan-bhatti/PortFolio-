import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Admin Login", robots: { index: false } };

export default async function AdminLoginPage() {
  const session = await auth();
  if (session?.user) redirect("/admin/dashboard");

  return (
    <div className="animated-gradient flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/40 p-8 backdrop-blur-xl">
        <h1 className="text-center text-2xl font-bold text-white">Admin</h1>
        <p className="mt-1 mb-6 text-center text-sm text-zinc-400">Sign in to manage your portfolio</p>
        <LoginForm />
      </div>
    </div>
  );
}
