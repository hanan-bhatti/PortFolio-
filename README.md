# Portfolio

Production-grade personal portfolio with a 3D organic-blob aesthetic. Built with Next.js 15 (App Router), React Three Fiber, Tailwind CSS v4, TipTap, Prisma + PostgreSQL, NextAuth v5, Uploadthing and Resend.

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**: Copy `.env.example` to `.env` and fill out:
   ```bash
   cp .env.example .env
   ```

3. **Initialize the database**:
   ```bash
   npm run db:push
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. Visit `http://localhost:3000` to view the public site and `http://localhost:3000/admin/login` for the admin portal.

## Features

- **3D Theme**: Morphing GLSL blob background with mouse parallax, unique 3D hero per page (lazy-loaded, SSR-safe, error-bounded, with mobile CSS fallbacks).
- **Public Pages**: Home (typewriter hero), Projects (tag filter + details), About (radial skills + animated timeline), Blog (search, tags, pagination, TipTap rendering, TOC, related posts), Contact (Zod-validated + Resend integration).
- **Admin Portal** (`/admin`): NextAuth-protected dashboard, TipTap post editor, project CRUD with dnd-kit ordering, inbox management, 2FA/TOTP security, and site settings.
- **Strict Quality**: Strict TypeScript (no `any`), Zod-validated input layers, custom JSDoc file headers, and Next.js Turbopack-compatible configuration.

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | *Required* |
| `AUTH_SECRET` | Secret key for NextAuth session signing | *Required* |
| `RESEND_API_KEY` | Resend service API key for emails | *Optional* |
| `CONTACT_EMAIL_TO` | Recipient email for contact messages | *Optional* |
| `CONTACT_EMAIL_FROM` | Sender email address for automated alerts | `onboarding@resend.dev` |
| `UPLOADTHING_TOKEN` | Uploadthing authentication token for files | *Optional* |

## Documentation

- [Project Specifications & Memory](file://./.agents/memory/MEMORY.md)
- [Architecture Decision Records (ADRs)](file://./docs/adr/ADR-001-codebase-cleanup.md)
- [Developer Guidelines (llms.txt)](file://./llms.txt)

## License

MIT
