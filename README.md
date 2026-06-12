# Portfolio

Production-grade personal portfolio with a 3D organic-blob aesthetic. Built with Next.js 15 (App Router), React Three Fiber, Tailwind CSS v4, TipTap, Prisma + PostgreSQL, NextAuth v5, Uploadthing and Resend.

## Features

- **3D theme**: morphing GLSL blob background with mouse parallax, unique 3D hero per page (lazy-loaded, SSR-safe, error-bounded, CSS fallback on mobile)
- **Public pages**: Home (typewriter hero), Projects (tag filter + detail pages), About (radial skills + animated timeline), Blog (search, tags, pagination, TipTap rendering with lowlight syntax highlighting, TOC, view counter, related posts), Contact (Zod-validated form + Resend email)
- **Admin** (`/admin`, NextAuth credentials): dashboard with stats, full TipTap post editor (toolbar, images, YouTube, tables, code blocks, character count, live preview), project CRUD with dnd-kit drag ordering, contact inbox, site settings
- Strict TypeScript (no `any`), React Hook Form + Zod on every form, Geist Sans/Mono via `next/font`

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Configure environment** — copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — PostgreSQL connection string
   - `AUTH_SECRET` — `openssl rand -base64 32`
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` — admin login (bcrypt hash)
   - `RESEND_API_KEY`, `CONTACT_EMAIL_TO`, `CONTACT_EMAIL_FROM` — contact emails
   - `UPLOADTHING_TOKEN` — image uploads
3. **Generate an admin password hash**
   ```bash
   node -e "require('bcryptjs').hash('your-password', 10).then(console.log)"
   ```
4. **Push the schema**
   ```bash
   npm run db:push
   ```
5. **Run**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` and `http://localhost:3000/admin/login`.

## Deployment (Vercel)

1. Import the repo in Vercel.
2. Add all environment variables from `.env.example`.
3. Use a hosted PostgreSQL (Neon, Supabase, etc.) for `DATABASE_URL`.
4. Deploy — `prisma generate` runs automatically before build.

## Structure

```
app/
  (public)/        # user-facing pages
  admin/           # protected admin pages (+ /admin/login)
  api/             # contact, posts, projects, uploadthing, auth
components/
  3d/              # R3F scenes, lazy wrappers, error boundary
  admin/           # admin UI (editor, tables, forms)
  blog/            # blog cards, TOC, parallax cover
  forms/           # public forms
  ui/              # shared UI
lib/               # prisma, auth, actions, validations, tiptap
prisma/            # schema
```
