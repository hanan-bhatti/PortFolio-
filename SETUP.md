# SETUP.md - Local Development Setup Guide

This guide walks you through setting up a local development instance of the portfolio application from scratch.

---

## 📋 Prerequisites

Before starting, ensure your system meets the following version dependencies:

| Software / Tool | Required Version | Verify Command |
|---|---|---|
| **Node.js** | `v20.x` or `v22.x` | `node -v` |
| **npm** | `v10.x` or higher | `npm -v` |
| **PostgreSQL** | `v15.x` or higher | `psql --version` |
| **Git** | `v2.x` or higher | `git --version` |

---

## 🛠️ Step-by-Step Installation

### 1. Clone the Codebase
Clone the repository and enter the project directory:
```bash
git clone https://github.com/hanan-bhatti/portfolio-.git
cd portfolio
```

### 2. Configure Environment Variables
Copy the example template file to create your local variables configuration:
```bash
cp .env.example .env
```
Open `.env` and fill in the required fields:
* **`DATABASE_URL`**: Set up a local PostgreSQL database (e.g., `postgresql://postgres:password@localhost:5432/portfolio_dev?sslmode=disable`).
* **`AUTH_SECRET`**: Generate a secure session secret block. In your terminal, run:
  ```bash
  openssl rand -base64 32
  ```
  Copy and paste the output into the `AUTH_SECRET` field.
* **`FINGERPRINT_SALT`**: Input any long random string to salt client fingerprint hashes securely.

*(Note: Optional configurations like Resend API keys or UploadThing tokens can be left blank initially — the app degrades gracefully).*

### 3. Install NPM Dependencies
Install Node modules. Because the project leverages React 19, you must bypass peer dependency limits using the legacy flag:
```bash
npm install --legacy-peer-deps
```
*Note: The `--legacy-peer-deps` flag is required because `@excalidraw/excalidraw` and older Radix UI primitives define peer dependency specifications on React 18, which conflicts with our React 19 framework core. Bypassing this check is completely safe and does not impact application runtime behavior.*

### 4. Push Database Schema
Sync your database tables directly with the Prisma schema structure:
```bash
npm run db:push
```

### 5. Start Local Development Server
Launch the Next.js development server running with Turbopack acceleration:
```bash
npm run dev
```

Visit the routes in your browser:
* **Public Site**: [http://localhost:3000](http://localhost:3000)
* **Admin Portal**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

---

## 🔑 Bootstrapping Admin Account
When you log in for the first time on a fresh database:
1. Navigate to `/admin/login`.
2. Because the database contains no administrator accounts, the portal detects this and presents a **"Setup your credentials" / "Initialize Admin"** setup screen.
3. Choose an email and secure password, then click register to bootstrap your admin account.
4. Once completed, you will be redirected to the Admin Dashboard and guided by the **onboarding tours system**.

---

## 🛟 Common Setup Errors & Fixes

### 1. Prisma Client Generation Failures
* **Symptom**: Compilation errors complaining about missing Prisma client types or model bindings.
* **Fix**: Force prisma client generation manually:
  ```bash
  npx prisma generate
  ```

### 2. Port Conflict (EADDRINUSE)
* **Symptom**: `Error: listen EADDRINUSE: address already in use :::3000`
* **Fix**: Next.js is trying to use port 3000, which is taken by another process. Run:
  ```bash
  npm run dev -- -p 3001
  ```
  Access the app at `http://localhost:3001` instead.

### 3. Database Connection Times Out
* **Symptom**: Prisma logs `P1001: Can't reach database server at localhost:5432`
* **Fix**: Ensure your local PostgreSQL service is running:
  * **Linux (systemd)**: `sudo systemctl start postgresql`
  * **macOS (Homebrew)**: `brew services start postgresql`
  * Check credentials, user permissions, and port definitions in your `.env` connection string.
