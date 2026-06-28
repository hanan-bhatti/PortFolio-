/**
 * @file lib/actions.ts
 * @description Next.js Server Actions for admin panel functionalities including user authentication, 2FA setup, blog posts, project management, email replies, message routing, password resets, and session revoking.
 * 
 * @exports
 * - ActionResult: Interface defining standard error and ID responses for actions
 * - loginAction(input): Handles admin credentials and returns authentication result
 * - logoutAction(): Revokes and terminates the current user session
 * - createPostAction(input) / updatePostAction(id, input) / deletePostAction(id) / togglePublishAction(id): Blog post management
 * - createProjectAction(input) / updateProjectAction(id, input) / deleteProjectAction(id) / reorderProjectsAction(orderedIds): Projects grid configuration
 * - markMessageReadAction(id, read) / deleteMessageAction(id) / sendReplyAction(email, replyMessage) / markThreadReadAction(email) / deleteThreadAction(email): Contact inbox operations
 * - saveSettingsAction(input) / saveAboutSettingsAction(input): General and About metadata persistence
 * - enable2FAAction(secret, code) / disable2FAAction(code): Two-factor security configuration
 * - revokeSessionAction(sessionId): Terminates active user browser sessions
 * - requestPasswordResetAction(email) / resetPasswordAction(token, newPassword) / changePasswordAction(currentPassword, newPassword): Admin password flow
 */

"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { auth, signIn, signOut } from "@/lib/auth";
import {
  postSchema,
  projectSchema,
  settingsSchema,
  aboutSchema,
  type PostInput,
  type ProjectInput,
  type SettingsInput,
  type AboutInput,
} from "@/lib/validations";
import { verifyTOTP } from "@/lib/twofactor";
import { sendEmail } from "@/lib/email";
import { getOrCreateShortLink } from "@/lib/shortener";
import { hash, compare } from "bcryptjs";
import crypto from "crypto";

export interface ActionResult {
  error?: string;
  id?: string;
}

async function requireAdmin(): Promise<void> {
  const session = await auth();
  if (!session?.user || !session.sessionToken) throw new Error("Unauthorized");
  
  const dbSession = await prisma.adminSession.findUnique({
    where: { token: session.sessionToken },
  });
  if (!dbSession || !dbSession.active) throw new Error("Unauthorized");
}

export async function loginAction(input: { email: string; password: string; code?: string }): Promise<ActionResult> {
  try {
    await signIn("credentials", {
      email: input.email,
      password: input.password,
      code: input.code || "",
      redirectTo: "/admin/dashboard",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.cause?.err?.message === "2FA_REQUIRED") {
        return { error: "2FA_REQUIRED" };
      }
      if (error.cause?.err?.message === "INVALID_2FA") {
        return { error: "Invalid 2FA code" };
      }
      return { error: "Invalid email or password" };
    }
    throw error;
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/admin/login" });
}

/* ---------- Posts ---------- */

function revalidateBlog(): void {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/admin/posts");
  revalidatePath("/admin/dashboard");
}

export async function createPostAction(input: PostInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  try {
    const post = await prisma.post.create({ data: parsed.data });
    revalidateBlog();
    return { id: post.id };
  } catch {
    return { error: "Could not create post. Is the slug unique?" };
  }
}

export async function updatePostAction(id: string, input: PostInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  try {
    await prisma.post.update({ where: { id }, data: parsed.data });
    revalidateBlog();
    revalidatePath(`/blog/${parsed.data.slug}`);
    return { id };
  } catch {
    return { error: "Could not update post. Is the slug unique?" };
  }
}

export async function deletePostAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.post.delete({ where: { id } });
  revalidateBlog();
  return { id };
}

export async function togglePublishAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return { error: "Post not found" };
  await prisma.post.update({ where: { id }, data: { published: !post.published } });
  revalidateBlog();
  return { id };
}

/* ---------- Projects ---------- */

function revalidateProjects(): void {
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/admin/projects");
  revalidatePath("/admin/dashboard");
}

export async function createProjectAction(input: ProjectInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  try {
    const project = await prisma.project.create({ data: parsed.data });
    revalidateProjects();
    return { id: project.id };
  } catch {
    return { error: "Could not create project. Is the slug unique?" };
  }
}

export async function updateProjectAction(id: string, input: ProjectInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  try {
    await prisma.project.update({ where: { id }, data: parsed.data });
    revalidateProjects();
    revalidatePath(`/projects/${parsed.data.slug}`);
    return { id };
  } catch {
    return { error: "Could not update project. Is the slug unique?" };
  }
}

export async function deleteProjectAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.project.delete({ where: { id } });
  revalidateProjects();
  return { id };
}

export async function reorderProjectsAction(orderedIds: string[]): Promise<ActionResult> {
  await requireAdmin();
  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.project.update({ where: { id }, data: { order: index } }))
  );
  revalidateProjects();
  return {};
}

/* ---------- Messages ---------- */

export async function markMessageReadAction(id: string, read: boolean): Promise<ActionResult> {
  await requireAdmin();
  await prisma.contactMessage.update({ where: { id }, data: { read } });
  revalidatePath("/admin/messages");
  revalidatePath("/admin/dashboard");
  return { id };
}

export async function deleteMessageAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.contactMessage.delete({ where: { id } });
  revalidatePath("/admin/messages");
  revalidatePath("/admin/dashboard");
  return { id };
}

/* ---------- Settings ---------- */

export async function saveSettingsAction(input: SettingsInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const entries = Object.entries(parsed.data) as Array<[string, string]>;
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.siteSettings.upsert({ where: { key }, update: { value }, create: { key, value } })
    )
  );
  revalidatePath("/", "layout");
  revalidateTag("settings", "max");
  return {};
}

export async function saveAboutSettingsAction(input: AboutInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = aboutSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const entries = Object.entries(parsed.data) as Array<[string, string]>;
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.siteSettings.upsert({ where: { key }, update: { value }, create: { key, value } })
    )
  );
  revalidatePath("/", "layout");
  revalidatePath("/about");
  revalidateTag("settings", "max");
  return {};
}

/* ---------- Inbox Replies ---------- */

export async function sendReplyAction(email: string, replyMessage: string): Promise<ActionResult> {
  await requireAdmin();
  if (!email || !replyMessage.trim()) return { error: "Invalid input" };
  
  try {
    const message = await prisma.contactMessage.create({
      data: {
        name: "Admin",
        email: email,
        subject: "RE: Your Inquiry",
        message: replyMessage,
        isAdminReply: true,
        read: true,
      }
    });

    await sendEmail({
      to: email,
      subject: `RE: Your message on Hanan's Portfolio`,
      text: replyMessage,
    });

    revalidatePath("/admin/messages");
    return { id: message.id };
  } catch (e: any) {
    return { error: e.message || "Failed to send reply" };
  }
}

/* ---------- 2FA Actions ---------- */

export async function enable2FAAction(secret: string, code: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const isValid = verifyTOTP(code, secret);
  if (!isValid) return { error: "Invalid verification code" };
  
  await prisma.adminUser.update({
    where: { id: session.user.id },
    data: {
      twoFactorSecret: secret,
      twoFactorEnabled: true,
    }
  });
  
  revalidatePath("/admin/settings");
  return {};
}

export async function disable2FAAction(code: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const user = await prisma.adminUser.findUnique({
    where: { id: session.user.id }
  });
  if (!user || !user.twoFactorEnabled) return { error: "2FA is not enabled" };
  
  const isValid = verifyTOTP(code, user.twoFactorSecret || "");
  if (!isValid) return { error: "Invalid verification code" };
  
  await prisma.adminUser.update({
    where: { id: session.user.id },
    data: {
      twoFactorSecret: null,
      twoFactorEnabled: false,
    }
  });
  
  revalidatePath("/admin/settings");
  return {};
}

/* ---------- Active Sessions Management ---------- */

export async function revokeSessionAction(sessionId: string): Promise<ActionResult> {
  await requireAdmin();
  
  await prisma.adminSession.update({
    where: { id: sessionId },
    data: { active: false }
  });
  
  revalidatePath("/admin/settings");
  return {};
}

/* ---------- Password Reset Actions ---------- */

export async function requestPasswordResetAction(email: string): Promise<ActionResult> {
  const user = await prisma.adminUser.findUnique({
    where: { email: email.toLowerCase() }
  });
  if (!user) {
    return {};
  }
  
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 3600000); // 1 hour
  
  await prisma.adminUser.update({
    where: { id: user.id },
    data: {
      resetToken: token,
      resetTokenExpiry: expires,
    }
  });
  
  const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin/login?resetToken=${token}`;
  await sendEmail({
    to: user.email,
    subject: "[Portfolio] Password Reset Request",
    text: `You requested a password reset for your portfolio admin account.\n\n` +
          `Please click the link below to reset your password (valid for 1 hour):\n\n${resetUrl}\n\n` +
          `If you didn't request this, you can safely ignore this email.`,
  });
  
  return {};
}

export async function resetPasswordAction(token: string, newPassword: string): Promise<ActionResult> {
  if (!token || !newPassword) return { error: "Invalid request" };
  
  const user = await prisma.adminUser.findUnique({
    where: { resetToken: token }
  });
  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    return { error: "Token is invalid or has expired" };
  }
  
  const hashedPassword = await hash(newPassword, 10);
  await prisma.adminUser.update({
    where: { id: user.id },
    data: {
      passwordHash: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
      sessions: {
        updateMany: {
          where: { active: true },
          data: { active: false }
        }
      }
    }
  });
  
  return {};
}

export async function changePasswordAction(currentPassword: string, newPassword: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const user = await prisma.adminUser.findUnique({
    where: { id: session.user.id }
  });
  if (!user) return { error: "User not found" };
  
  const valid = await compare(currentPassword, user.passwordHash);
  if (!valid) return { error: "Incorrect current password" };
  
  const hashedPassword = await hash(newPassword, 10);
  await prisma.adminUser.update({
    where: { id: session.user.id },
    data: {
      passwordHash: hashedPassword,
    }
  });
  
  return {};
}

export async function markThreadReadAction(email: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.contactMessage.updateMany({
    where: {
      email: { equals: email, mode: "insensitive" },
      isAdminReply: false,
      read: false,
    },
    data: { read: true }
  });
  revalidatePath("/admin/messages");
  revalidatePath("/admin/dashboard");
  return {};
}

export async function deleteThreadAction(email: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.contactMessage.deleteMany({
    where: {
      email: { equals: email, mode: "insensitive" }
    }
  });
  revalidatePath("/admin/messages");
  revalidatePath("/admin/dashboard");
  return {};
}

export async function dispatchCampaignAction(postId: string, subject: string): Promise<ActionResult> {
  await requireAdmin();

  if (!postId || !subject) {
    return { error: "Post ID and Subject are required." };
  }

  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return { error: "Post not found." };
    }

    // Get all unique subscribers
    const subscribers = await prisma.postNotifyRequest.findMany({
      select: { id: true, email: true },
      distinct: ["email"],
    });

    if (subscribers.length === 0) {
      return { error: "No subscribers found." };
    }

    // Create Campaign
    const campaign = await prisma.emailCampaign.create({
      data: {
        postId,
        subject,
        sentCount: subscribers.length,
      },
    });

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://hanan-bhatti.site").replace(/\/$/, "");

    // Generate unique read more tracking link for this campaign
    const campaignLinkCode = await getOrCreateShortLink(
      `${siteUrl}/blog/${post.slug}?utm_source=email_campaign&utm_medium=email&utm_campaign=${campaign.id}`,
      "link"
    );
    const readMoreUrl = `${siteUrl}/s/${campaignLinkCode}`;

    // Sender from environment variable requested
    const fromSender = process.env.BLOG_EMAIL_FROM || "Portfolio <marketing@hanan-bhatti.site>";

    // Send emails in parallel
    await Promise.all(
      subscribers.map(async (sub) => {
        const trackingPixel = `<img src="${siteUrl}/api/newsletter/track/open?c=${campaign.id}&e=${encodeURIComponent(sub.email)}" width="1" height="1" style="display:none;" />`;
        
        const htmlBody = `
          <div style="background-color: #0c0c0c; color: #ffffff; font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; border: 1px solid #262626;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="font-weight: 800; letter-spacing: 0.1em; color: #F59E0B; margin: 0; font-family: 'Syne', sans-serif;">NEW BLOG POST</h2>
            </div>
            ${post.coverImage ? `<div style="margin-bottom: 25px; border: 1px solid #262626; overflow: hidden;"><img src="${post.coverImage}" alt="${post.title}" style="width: 100%; height: auto; display: block;" /></div>` : ''}
            <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 15px; color: #ffffff;">${post.title}</h1>
            ${post.subtitle ? `<h3 style="font-size: 16px; font-weight: normal; color: #a1a1aa; margin-top: 0; margin-bottom: 20px;">${post.subtitle}</h3>` : ''}
            <p style="font-size: 14px; line-height: 1.6; color: #a1a1aa; margin-bottom: 30px;">${post.excerpt || 'Read the latest post on my portfolio.'}</p>
            <div style="text-align: center; margin-bottom: 40px;">
              <a href="${readMoreUrl}" style="display: inline-block; background-color: #F59E0B; color: #000000; text-decoration: none; padding: 12px 30px; font-weight: bold; font-size: 13px; letter-spacing: 0.1em; border: 1px solid #F59E0B;">READ MORE →</a>
            </div>
            <div style="border-top: 1px solid #262626; padding-top: 20px; text-align: center; font-size: 11px; color: #71717a;">
              <p>You received this because you subscribed to updates on my portfolio site.</p>
              <p>&copy; ${new Date().getFullYear()} Hanan Bhatti. All rights reserved.</p>
            </div>
            ${trackingPixel}
          </div>
        `;

        await sendEmail({
          to: sub.email,
          from: fromSender,
          subject: subject,
          text: `New post: ${post.title}. Read it here: ${readMoreUrl}`,
          html: htmlBody,
        });
      })
    );

    revalidatePath("/admin/newsletter");
    return { id: campaign.id };
  } catch (error: any) {
    console.error("Failed to dispatch email campaign:", error);
    return { error: error.message || "An unexpected error occurred." };
  }
}

export async function deleteSubscriberAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await prisma.postNotifyRequest.delete({ where: { id } });
    revalidatePath("/admin/newsletter");
    return {};
  } catch (error: any) {
    return { error: error.message };
  }
}
