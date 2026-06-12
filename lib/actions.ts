"use server";

import { revalidatePath } from "next/cache";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { auth, signIn, signOut } from "@/lib/auth";
import {
  postSchema,
  projectSchema,
  settingsSchema,
  type PostInput,
  type ProjectInput,
  type SettingsInput,
} from "@/lib/validations";

export interface ActionResult {
  error?: string;
  id?: string;
}

async function requireAdmin(): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

export async function loginAction(input: { email: string; password: string }): Promise<ActionResult> {
  try {
    await signIn("credentials", {
      email: input.email,
      password: input.password,
      redirectTo: "/admin/dashboard",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) return { error: "Invalid email or password" };
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
  return {};
}
