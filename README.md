# Hanan Bhatti Portfolio

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.8-2D3748?logo=prisma)](https://www.prisma.io/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![wakatime](https://wakapi.hanan-bhatti.site/api/badge/hannanbhatti2006@gmail.com/interval:any/project:portfolio)](https://wakapi.hanan-bhatti.site)

> **Copyright (C) 2026 Abdul Hannan Bhatti.**  
> This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. See [LICENSE](./LICENSE) for full details.

A production-grade, highly interactive personal portfolio web application utilizing a dark-mode, neo-brutalist flat grid layout with sharp terminal-inspired borders and high-contrast amber highlights. Built with Next.js (App Router), Prisma, NextAuth, UploadThing, and Resend, featuring custom Canvas 2D interactive visuals and a WebGL liquid-glass shader accent on the navbar.

A live demo is available at: [https://hanan-bhatti.site](https://hanan-bhatti.site)

---

## ⚡ Tech Stack

| Technology / Library | Version | Description |
|---|---|---|
| **Next.js** | `^16.2.9` | React Framework (App Router, Turbopack, Standalone SSR/SSG) |
| **React** | `^19.0.0` | Client Rendering & state pipeline |
| **Prisma** | `^7.8.0` | Database ORM |
| **PostgreSQL** | *N/A* | Persistent database layer |
| **NextAuth** | `^5.0.0-beta.25` | Secure Session/Admin Authentication |
| **UploadThing** | `^7.7.4` | Image asset uploading |
| **Resend** | `^4.0.0` | Email dispatch (inbox reply & newsletter alerts) |
| **driver.js** | `^1.6.0` | In-app interactive onboarding tour framework |
| **canvas-confetti** | `^1.9.4` | First-time action celebration engine |
| **three / @react-three/fiber** | `^0.171.0` / `^9.0.0` | WebGL liquid-glass shader accent (navbar only) |

---

## 🚀 Quick Start

Follow these steps to run the portfolio locally on your machine in under 5 minutes:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/hanan-bhatti/PortFolio-.git
   cd PortFolio-
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill out your variables:
   ```bash
   cp .env.example .env
   ```
   *Note: Set `DATABASE_URL` to your local PostgreSQL connection string, and generate a session secret for `AUTH_SECRET` (see instructions in [.env.example](./.env.example)).*

3. **Install Dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```
   *Note: `--legacy-peer-deps` is required due to a peer dependency mismatch between `@excalidraw/excalidraw`'s bundled Radix UI packages and React 19. This is safe and does not affect functionality.*

4. **Initialize Database Schema**:
   Deploy the database schema using Prisma:
   ```bash
   npm run db:push
   ```

5. **Start Dev Server**:
   Start the Next.js development server with Turbopack support:
   ```bash
   npm run dev
   ```

6. **Access App & Portal**:
   * **Public Website**: [http://localhost:3000](http://localhost:3000)
   * **Admin Panel Login**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)  
     *(If logging in for the first time, registration/admin creation occurs dynamically on this screen).*

---

## 📑 Features

* **Neo-Brutalist Visual Design**: A flat-accented theme featuring a dark background (`#0a0a0a`), high-contrast amber highlights, geometric grid layouts, and interactive cursor spotlight masks over heading texts.
* **Canvas Interactive Portrait**: The homepage features an interactive canvas-rendered pixelation portrait that dynamically shifts resolution and blends amber tints based on cursor distance and hover easing.
* **Blog CMS & Analytics**: Complete TipTap-based rich text editor with built-in visitor metrics tracking search logs, reader-intent emoji reactions, helpful votes, Exit Intent triggers, and email campaign newsletters.
* **Portfolio & Resume Timeline**: Structured project filters, drag-and-drop order sorting, education/career timeline, and a resume layout capable of tracking PDF downloads and geolocation metrics.
* **Personal Sandbox Workspace**: An admin-only workspace featuring a sandbox node board to draw layouts, take notes, create inline checklists, and store bookmark previews.
* **In-App Onboarding**: Two-layered interactive onboarding tours powered by `driver.js` that guide new developers through every admin panel route on their first visit, equipped with self-healing element detection polling that waits for DOM nodes to mount (solving React Suspense and client routing hydration timing limits).
* **Contextual InfoTooltips**: Granular tooltip help text overlays implemented across every input field and form tab (Settings, About, Resume, Certifications, Posts, Projects, Skills, Experience, Photography) to explain navigation and data inputs.
* **Database-Backed Action Celebrations**: A congratulatory popover reward system utilizing `canvas-confetti` when a user publishes their first blog post, portfolio project, photography slide, skill entry, or career milestone, tracked securely via postgres boolean flags in the `AdminUser` model to guarantee cross-browser consistency.
* **Session Auditing**: Complete dashboard session listing tracking browser user-agent, geolocation country flags, IP addresses, and enabling immediate session revocation.

---

## 📚 Core Documentation Map

We have prepared comprehensive documentation files to orient self-hosters and open-source contributors:

1. **[SETUP.md](./SETUP.md)**: A complete, step-by-step local development setup walkthrough including prerequisite versions, seeding, and common error troubleshooting.
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Explains the internal structure accompanied by Mermaid diagrams covering the system overview, Prisma ERD, Auth workflows, UploadThing pipelines, and visitor analytics.
3. **[DEPLOYMENT.md](./DEPLOYMENT.md)**: Guidelines on hosting the portfolio, reverse proxy configurations (Coolify/Traefik), and standalone frontend deployment options (Vercel).
4. **[CONTRIBUTING.md](./CONTRIBUTING.md)**: Rules for contributing to the repository, coding style (ESLint configs), and formatting conventions.
5. **[SECURITY.md](./SECURITY.md)**: Safe disclosure protocols for reporting vulnerability issues.
6. **[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)**: Standard contributor code of conduct guidelines.
7. **[CHANGELOG.md](./CHANGELOG.md)**: Histographical list of notable project releases and updates.
