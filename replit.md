# replit.md

## Overview

This is an **Auto Ad System** — a web application that automates sending messages to Discord channels on a timed schedule. Users configure Discord tokens, messages, target channel IDs, delay intervals, and optional image URLs. The system provides a real-time terminal-style log viewer showing automation status. The UI has a cyberpunk/hacker aesthetic with neon green on black, scanline effects, and monospace fonts.

The app is access-controlled: only whitelisted Google accounts can log in, and the owner (`platisthere@gmail.com`) has elevated privileges for admin controls.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework:** React 18 with TypeScript
- **Routing:** Wouter (lightweight client-side router)
- **State/Data Fetching:** TanStack React Query for server state management with polling (2-second interval for automation status)
- **Forms:** React Hook Form with Zod resolvers for validation
- **UI Components:** shadcn/ui (new-york style) built on Radix UI primitives
- **Styling:** Tailwind CSS with CSS variables for theming. Custom cyberpunk theme (black background, neon green accents, scanline overlay, sharp corners with `--radius: 0px`)
- **Fonts:** Fira Code and JetBrains Mono (monospace)
- **Build Tool:** Vite with React plugin
- **Path Aliases:** `@/` → `client/src/`, `@shared/` → `shared/`, `@assets/` → `attached_assets/`

### Backend
- **Framework:** Express 5 on Node.js with TypeScript (run via `tsx`)
- **HTTP Server:** Node `http.createServer` wrapping Express
- **API Pattern:** JSON REST API under `/api/` prefix. Routes defined in `shared/routes.ts` with Zod schemas for request/response validation
- **File Uploads:** Multer for image upload handling, stored in `client/public/uploads/`
- **Instance Lock:** File-based lock (`instance.lock`) prevents multiple server instances from running simultaneously
- **Browser Restriction:** Chrome-only middleware blocks non-Chrome browsers

### Authentication & Authorization
- **Auth Provider:** Replit OpenID Connect (OIDC) via Passport.js — currently set up for Replit Auth but the project has Google OAuth requirements specified in `attached_assets/`
- **Session Management:** Express sessions stored in PostgreSQL via `connect-pg-simple`, 1-week TTL
- **Whitelist:** Server-side email whitelist via `ALLOWED_EMAILS` environment variable. Non-whitelisted users are blocked after authentication
- **Owner Role:** `platisthere@gmail.com` is the owner. Owner-only UI elements are completely hidden (not disabled) for non-owners. Backend enforces owner checks independently of frontend
- **Auth Hook:** `useAuth()` custom hook on frontend queries `/api/auth/user` and handles login/logout flows

### Shared Code (`shared/`)
- **Schema:** Drizzle ORM schema definitions in `shared/schema.ts` — `configs` table (automation configurations per user) and auth tables (`sessions`, `users`)
- **Routes:** API contract definitions with Zod schemas in `shared/routes.ts`
- **Types:** Shared TypeScript types (`Config`, `InsertConfig`, `StartRequest`, `LogEntry`, `StatusResponse`)

### Data Storage
- **Database:** PostgreSQL via Drizzle ORM with `node-postgres` driver
- **ORM:** Drizzle ORM with Zod schema generation (`drizzle-zod`)
- **Migrations:** Drizzle Kit with `drizzle-kit push` for schema sync (no migration files approach)
- **Storage Pattern:** `DatabaseStorage` class implementing `IStorage` interface in `server/storage.ts`

### Key Database Tables
- **`configs`** — Stores automation configurations (token, message, channel IDs, delay, image URLs) scoped per user email
- **`sessions`** — Express session store for authentication persistence
- **`users`** — User profiles from authentication provider

### Build System
- **Dev:** `tsx server/index.ts` with Vite dev server middleware (HMR enabled)
- **Production Build:** Custom `script/build.ts` — Vite builds frontend to `dist/public/`, esbuild bundles server to `dist/index.cjs`. Select dependencies are bundled (allowlisted) to reduce cold start syscalls
- **Start:** `node dist/index.cjs` in production

### Core Features
- Start/stop Discord message automation with configurable delays
- Save/load/delete automation configurations (per-user)
- Real-time log terminal with auto-scroll
- Image upload support for message attachments
- Polling-based status updates (every 2 seconds)

## External Dependencies

### Required Services
- **PostgreSQL Database** — Required. Connection via `DATABASE_URL` environment variable
- **Replit OIDC / Auth Provider** — Authentication via `ISSUER_URL` (defaults to Replit OIDC). Uses `REPL_ID` for client identification

### Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (required)
- `SESSION_SECRET` — Secret for Express session encryption (required)
- `ALLOWED_EMAILS` — Comma-separated whitelist of authorized email addresses
- `ISSUER_URL` — OIDC issuer URL (defaults to `https://replit.com/oidc`)
- `REPL_ID` — Replit environment identifier

### Key NPM Packages
- **Server:** express, drizzle-orm, pg, passport, openid-client, express-session, connect-pg-simple, multer, zod, memoizee
- **Client:** react, wouter, @tanstack/react-query, react-hook-form, @hookform/resolvers, zod, framer-motion, shadcn/ui (Radix primitives), tailwindcss, lucide-react
- **Build:** vite, esbuild, tsx, drizzle-kit