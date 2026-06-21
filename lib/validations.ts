/**
 * @file lib/validations.ts
 * @description Zod validation schemas and TypeScript types defining input verification rules for contacts, posts, projects, skills, experiences, and settings.
 * 
 * @exports
 * - contactSchema / ContactInput: Rules for contact form submissions
 * - postSchema / PostInput: Rules for creating/editing blog posts
 * - projectSchema / ProjectInput: Rules for creating/editing projects
 * - skillSchema / SkillInput: Rules for adding/modifying skills
 * - experienceSchema / ExperienceInput: Rules for experiences/jobs
 * - settingsSchema / SettingsInput: Rules for site settings
 * - aboutSchema / AboutInput: Rules for about-me settings
 */

import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email"),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(200),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const postSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title must not exceed 200 characters"),
  subtitle: z.string().max(200, "Subtitle must not exceed 200 characters").nullable().optional().or(z.literal("").transform(() => null)),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(200, "Slug must not exceed 200 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens"),
  excerpt: z.string().min(10, "Excerpt must be at least 10 characters").max(500, "Excerpt must not exceed 500 characters"),
  content: z.string().min(2, "Content must be at least 2 characters"),
  coverImage: z.string().url("Cover image must be a valid URL").nullable().or(z.literal("").transform(() => null)),
  tags: z.array(z.string().min(1, "Tag cannot be empty").max(50, "Tag must not exceed 50 characters")),
  published: z.boolean(),
});
export type PostInput = z.infer<typeof postSchema>;

export const projectSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(200, "Title must not exceed 200 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(200, "Slug must not exceed 200 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description must not exceed 500 characters"),
  longDesc: z.string().max(10000, "Long description must not exceed 10000 characters").nullable().or(z.literal("").transform(() => null)),
  techStack: z.array(z.string().min(1, "Technology tag cannot be empty").max(50, "Technology tag must not exceed 50 characters")),
  liveUrl: z.string().url("Live URL must be a valid URL").nullable().or(z.literal("").transform(() => null)),
  githubUrl: z.string().url("GitHub URL must be a valid URL").nullable().or(z.literal("").transform(() => null)),
  coverImage: z.string().url("Cover image must be a valid URL").nullable().or(z.literal("").transform(() => null)),
  featured: z.boolean(),
  order: z.number().int().min(0, "Order must be a positive number"),
  resumeBullets: z.string().max(2000, "Resume bullets must not exceed 2000 characters").nullable().or(z.literal("").transform(() => null)),
});
export type ProjectInput = z.infer<typeof projectSchema>;

export const skillSchema = z.object({
  name: z.string().min(1, "Name must be at least 1 character").max(100, "Name must not exceed 100 characters"),
  icon: z.string().nullable(),
  level: z.number().int().min(1, "Level must be at least 1").max(100, "Level cannot exceed 100"),
  category: z.string().min(1, "Category must be at least 1 character").max(100, "Category must not exceed 100 characters"),
  order: z.number().int().min(0, "Order must be a positive number"),
});
export type SkillInput = z.infer<typeof skillSchema>;

export const experienceSchema = z.object({
  role: z.string().min(2, "Role must be at least 2 characters").max(200, "Role must not exceed 200 characters"),
  company: z.string().min(1, "Company name must be at least 1 character").max(200, "Company name must not exceed 200 characters"),
  location: z.string().max(200, "Location must not exceed 200 characters").nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable(),
  current: z.boolean(),
  description: z.string().min(5, "Description must be at least 5 characters").max(5000, "Description must not exceed 5000 characters"),
  order: z.number().int().min(0, "Order must be a positive number"),
});
export type ExperienceInput = z.infer<typeof experienceSchema>;

export const settingsSchema = z.object({
  siteName: z.string().min(1, "Site name must be at least 1 character").max(100, "Site name must not exceed 100 characters"),
  tagline: z.string().max(200, "Tagline must not exceed 200 characters"),
  aboutBio: z.string().max(5000, "Bio must not exceed 5000 characters"),
  profilePhotoUrl: z.string().url("Profile photo must be a valid URL").or(z.literal("")),
  socialGithub: z.string().url("GitHub link must be a valid URL").or(z.literal("")),
  socialLinkedin: z.string().url("LinkedIn link must be a valid URL").or(z.literal("")),
  socialTwitter: z.string().url("Twitter link must be a valid URL").or(z.literal("")),
  socialEmail: z.string().email("Please enter a valid email address").or(z.literal("")),
  heroPhotoUrl: z.string().url("Hero photo must be a valid URL").or(z.literal("")),
  heroTagline: z.string().max(500, "Hero tagline must not exceed 500 characters"),
  statsYears: z.string().min(1, "Years experience is required"),
  statsProjects: z.string().min(1, "Projects built is required"),
  statsContributions: z.string().min(1, "Contributions is required"),
  statsCommits: z.string().min(1, "Commits count is required"),
  marqueeSkills: z.string().max(2000, "Skills list must not exceed 2000 characters"),
  photography_enabled: z.string(),
  photography_title: z.string().max(200),
  photography_description: z.string().max(500),
  analytics_enabled: z.string(),
  cookie_consent_text: z.string().max(2000, "Cookie consent text must not exceed 2000 characters"),
});
export type SettingsInput = z.infer<typeof settingsSchema>;

export const aboutSchema = z.object({
  about_hero_tagline: z.string().max(500, "Hero tagline must not exceed 500 characters"),
  about_avatar_url: z.string().url("Avatar must be a valid URL").or(z.literal("")),
  about_story: z.string().max(10000, "Story content must not exceed 10000 characters"),
  about_currently: z.string().max(10000, "Currently content must not exceed 10000 characters"),
  about_beyond_code: z.string().max(10000, "Beyond code content must not exceed 10000 characters"),
  about_cta_text: z.string().max(200, "CTA text must not exceed 200 characters"),
  about_cta_email: z.string().max(200, "CTA link must not exceed 200 characters"),
  about_stack: z.string().max(5000, "Stack configuration must not exceed 5000 characters"),
});
export type AboutInput = z.infer<typeof aboutSchema>;
