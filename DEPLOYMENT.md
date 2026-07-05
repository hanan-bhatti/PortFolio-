# DEPLOYMENT.md - Deployment & Hosting Guide

This guide details how to deploy the portfolio application to production.

---

## 1. Hosting Architecture Overview

The system uses a containerized architecture managed in production via **Coolify** behind a **Traefik** reverse proxy running on an **Oracle Cloud Infrastructure (OCI) ARM instance**.

```
                        [ Internet Traffic ]
                                 │
                                 ▼
                     [ Traefik Reverse Proxy ]
                     (SSL termination via Let's Encrypt)
                                 │
                                 ▼
                    [ Portfolio Next.js App ]
                     (Dockerized Container)
                                 │
                   ┌─────────────┴──────────────┐
                   ▼                           ▼
      [ PostgreSQL Database ]           [ Redis / Cache ]
      (Hosted on Neon DB or Docker)    (For caching, if active)
```

---

## 2. Docker Deployment (Self-Hosted)

For self-hosters wishing to host this on virtual private servers (OCI, DigitalOcean, Hetzner, etc.), we package the project inside a multi-stage Docker build.

### Dockerfile
Create a `Dockerfile` at the root of the repository:
```dockerfile
# Multi-stage build
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --legacy-peer-deps

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npx prisma generate
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```
*(Note: To utilize standalone builds, configure `output: "standalone"` inside `next.config.ts` if not already present).*

---

## 3. Coolify + Traefik Deployment Steps

To host the portfolio using Coolify:
1. **Connect Repository**: Link your GitHub account and select your cloned `portfolio` repository.
2. **Select Destination**: Set your destination server (OCI ARM VPS or similar).
3. **Environment Setup**:
   * Add all required environment variables listed in `.env.example`.
   * Ensure `PORT` is set to `3000` and `NEXT_PUBLIC_SITE_URL` points to your public domain (e.g. `https://your-portfolio.com`).
4. **Build Settings**:
   * Set Build Pack to `Docker`.
   * Set Dockerfile path to `./Dockerfile`.
5. **Proxy Configuration**:
   * Coolify will automatically configure Traefik rules to bind requests hitting your domain to port 3000 inside the container, provision SSL, and route HTTP to HTTPS.

---

## 4. Frontend-Only Deployment (Vercel, Netlify)

Can the Next.js frontend be deployed separately from the backend database?
* **Yes**. The architecture fully supports database separation. You can host the Next.js App Router project directly on serverless infrastructure such as **Vercel** or **Netlify**.
* **Instructions**:
  1. Push your code repository to GitHub.
  2. Create a new project on Vercel, linking it to the repository.
  3. Input all environment variables under Vercel Project Settings (ensure `DATABASE_URL` connects to a cloud-accessible PostgreSQL instance like Neon).
  4. Vercel automatically detects Next.js settings, runs prisma generation during builds, and deploys.
