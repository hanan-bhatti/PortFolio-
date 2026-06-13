import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare, hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyTOTP } from "@/lib/twofactor";
import { headers } from "next/headers";
import { parseUserAgent } from "@/lib/ua";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  code: z.string().optional(),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        code: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials): Promise<{ id: string; email: string; name: string } | null> {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password, code } = parsed.data;

        // Dynamic First User Registration
        const adminCount = await prisma.adminUser.count();
        if (adminCount === 0) {
          const hashedPassword = await hash(password, 10);
          const firstAdmin = await prisma.adminUser.create({
            data: {
              email: email.toLowerCase(),
              passwordHash: hashedPassword,
            },
          });
          return { id: firstAdmin.id, email: firstAdmin.email, name: "Admin" };
        }

        const user = await prisma.adminUser.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user) return null;

        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;

        // 2FA TOTP Checks
        if (user.twoFactorEnabled) {
          if (!code) {
            throw new Error("2FA_REQUIRED");
          }
          const is2faValid = verifyTOTP(code, user.twoFactorSecret || "");
          if (!is2faValid) {
            throw new Error("INVALID_2FA");
          }
        }

        return { id: user.id, email: user.email, name: "Admin" };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // User logged in! Let's generate and track their session
        const sessionToken = crypto.randomUUID();
        
        let userAgent = "";
        let ip = "127.0.0.1";
        try {
          const reqHeaders = await headers();
          userAgent = reqHeaders.get("user-agent") || "";
          ip = reqHeaders.get("x-forwarded-for")?.split(",")[0] || reqHeaders.get("x-real-ip") || "127.0.0.1";
        } catch {
          // Headers not available in some static optimization builds
        }

        const parsedUA = parseUserAgent(userAgent);

        // Persist session to database
        await prisma.adminSession.create({
          data: {
            token: sessionToken,
            userId: user.id!,
            ipAddress: ip,
            userAgent,
            deviceType: parsedUA.deviceType,
            browser: parsedUA.browser,
            os: parsedUA.os,
            active: true,
          },
        });

        // Send alert email to admin
        await sendEmail({
          to: user.email!,
          subject: "[Portfolio] New Admin Login Detected",
          text: `A new session was established on your portfolio admin panel.\n\n` +
                `Device: ${parsedUA.deviceType} (${parsedUA.os})\n` +
                `Browser: ${parsedUA.browser}\n` +
                `IP Address: ${ip}\n` +
                `Time: ${new Date().toLocaleString()}\n\n` +
                `If this wasn't you, please log in and revoke this session in Admin Settings immediately.`,
        });

        token.sessionToken = sessionToken;
        token.userId = user.id;
      }

      // Check if session token has been revoked in DB
      if (token.sessionToken) {
        try {
          const dbSession = await prisma.adminSession.findUnique({
            where: { token: token.sessionToken as string },
          });
          if (!dbSession || !dbSession.active) {
            // Revoked session
            return {};
          }
          // Update last used timestamp
          await prisma.adminSession.update({
            where: { id: dbSession.id },
            data: { lastUsedAt: new Date() },
          });
        } catch {
          // Database connection/query errors
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.sessionToken) {
        session.sessionToken = token.sessionToken as string;
      }
      if (token.userId && session.user) {
        session.user.id = token.userId as string;
      }
      return session;
    },
    authorized({ auth: session, request }) {
      const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
      const isLoginPage = request.nextUrl.pathname === "/admin/login";
      if (isAdminRoute && !isLoginPage) {
        // Must be logged in and have valid session
        return Boolean(session?.user);
      }
      return true;
    },
  },
});

declare module "next-auth" {
  interface Session {
    sessionToken?: string;
    user: {
      id?: string;
      email?: string;
      name?: string;
    };
  }
}
