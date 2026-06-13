import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Admin Login", robots: { index: false } };

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const session = await auth();
  
  // If user is already logged in with an active session, redirect to dashboard
  if (session?.user) redirect("/admin/dashboard");

  // Read search parameters for reset token
  const resolvedSearchParams = await searchParams;
  const resetToken = typeof resolvedSearchParams.resetToken === "string" ? resolvedSearchParams.resetToken : undefined;

  // Query database admin count to check if dynamic setup is required
  const adminCount = await prisma.adminUser.count();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080808] px-4">
      <div className="w-full max-w-md border border-[#262626] bg-[#0c0c0c] p-8">
        {/* Brand header */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-10 w-10 items-center justify-center border border-[#10B981] bg-[#10B981]/10 text-xs font-bold font-mono text-[#10B981]">
            HB
          </div>
        </div>
        <h1 className="text-center font-syne text-xl font-bold uppercase tracking-wider text-white">
          {adminCount === 0 ? "Initialize Admin" : "Portfolio Admin"}
        </h1>
        <p className="mt-1.5 mb-6 text-center font-mono text-[10px] uppercase tracking-wider text-zinc-500">
          {adminCount === 0 ? "Setup your credentials" : "Secure Authentication Portal"}
        </p>
        <LoginForm adminCount={adminCount} resetToken={resetToken} />
      </div>
    </div>
  );
}
