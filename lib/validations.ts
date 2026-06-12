import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email"),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(200),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const postSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z
    .string()
    .min(3)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens"),
  excerpt: z.string().min(10).max(500),
  content: z.string().min(2),
  coverImage: z.string().url().nullable().or(z.literal("").transform(() => null)),
  tags: z.array(z.string().min(1).max(50)),
  published: z.boolean(),
});
export type PostInput = z.infer<typeof postSchema>;

export const projectSchema = z.object({
  title: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens"),
  description: z.string().min(10).max(500),
  longDesc: z.string().max(10000).nullable().or(z.literal("").transform(() => null)),
  techStack: z.array(z.string().min(1).max(50)),
  liveUrl: z.string().url().nullable().or(z.literal("").transform(() => null)),
  githubUrl: z.string().url().nullable().or(z.literal("").transform(() => null)),
  coverImage: z.string().url().nullable().or(z.literal("").transform(() => null)),
  featured: z.boolean(),
  order: z.number().int().min(0),
});
export type ProjectInput = z.infer<typeof projectSchema>;

export const skillSchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().nullable(),
  level: z.number().int().min(1).max(100),
  category: z.string().min(1).max(100),
  order: z.number().int().min(0),
});
export type SkillInput = z.infer<typeof skillSchema>;

export const experienceSchema = z.object({
  role: z.string().min(2).max(200),
  company: z.string().min(1).max(200),
  location: z.string().max(200).nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable(),
  current: z.boolean(),
  description: z.string().min(5).max(5000),
  order: z.number().int().min(0),
});
export type ExperienceInput = z.infer<typeof experienceSchema>;

export const settingsSchema = z.object({
  siteName: z.string().min(1).max(100),
  tagline: z.string().max(200),
  aboutBio: z.string().max(5000),
  profilePhotoUrl: z.string().url().or(z.literal("")),
  socialGithub: z.string().url().or(z.literal("")),
  socialLinkedin: z.string().url().or(z.literal("")),
  socialTwitter: z.string().url().or(z.literal("")),
  socialEmail: z.string().email().or(z.literal("")),
});
export type SettingsInput = z.infer<typeof settingsSchema>;
