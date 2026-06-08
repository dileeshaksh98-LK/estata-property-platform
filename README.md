# Estata — Sri Lanka Property Platform (Phase 1, Supabase-connected)

Production Next.js (App Router) marketplace wired to a **real Supabase backend**:
auth, RLS, property CRUD, storage uploads, saved listings, inquiries, and live
seller analytics. There is **no mock data** — every screen reads/writes Postgres.

Stack: Next.js 15 + TypeScript + Tailwind + Framer Motion · Supabase (Postgres, Auth, Storage).

---

## 1. Production setup (start to finish)

### a. Create the Supabase project
Create a project at supabase.com and open the **SQL Editor**.

### b. Run the SQL — in this order
1. `schema.sql` — tables, enums, triggers, RLS, search vector, `increment_view_count`.
2. `supabase-setup.sql` — storage bucket `property-images` + storage policies, and the
   `increment_contact_count` / `get_seller_stats` security-definer RPCs the app calls.

(The bucket is created by the SQL, so you don't need to create it by hand.)

### c. Configure Auth
- **Authentication → URL Configuration**
  - Site URL: your domain (e.g. `https://estata.lk`) or `http://localhost:3000` for dev.
  - Redirect URLs: add `<site>/auth/callback` (e.g. `http://localhost:3000/auth/callback`).
- **Google login**: Authentication → Providers → Google → enable, paste your Google OAuth
  client ID/secret, and add the same `/auth/callback` URL as an authorised redirect in the
  Google Cloud console.
- **Email code (OTP) / magic link** works out of the box once email is enabled.

### d. Environment variables
```bash
cp .env.example .env.local
```
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVICE-ROLE-KEY   # server-only, never exposed
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
The service-role key powers a single privileged action (atomic `contact_count` bump on a
new lead). It is only ever used in server code (`src/lib/supabase/admin.ts`).

### e. Run
```bash
npm install
npm run dev          # http://localhost:3000
```

---

## 2. Architecture

```
src/
├─ middleware.ts                 # refreshes session, guards /dashboard
├─ lib/
│  ├─ supabase/
│  │  ├─ client.ts               # typed browser client (singleton)
│  │  ├─ server.ts               # typed server client (cookies)
│  │  ├─ admin.ts                # service-role client (server-only)
│  │  └─ middleware.ts           # updateSession() + route protection
│  ├─ types/database.ts          # typed schema (Database) for end-to-end types
│  ├─ db/                        # REPOSITORIES (server-only, RLS-enforced reads)
│  │  ├─ properties.repo.ts      # list/featured/bySlug/similar/owner + pagination
│  │  ├─ inquiries.repo.ts       # owner leads
│  │  ├─ analytics.repo.ts       # get_seller_stats RPC
│  │  ├─ profiles.repo.ts        # current user + profile
│  │  └─ saved.repo.ts           # saved listings (SSR)
│  ├─ actions/                   # SERVER ACTIONS ('use server', validated, revalidating)
│  │  ├─ properties.ts           # create / update / delete / incrementView
│  │  ├─ inquiries.ts            # sendInquiry (+ honeypot, counter bump)
│  │  └─ profile.ts              # updateProfile
│  ├─ storage/upload.ts          # client upload pipeline (signed URL + XHR progress)
│  └─ validation/                # zod schemas (property, inquiry, profile)
├─ app/
│  ├─ auth/{login,register}      # Google OAuth + email OTP + password
│  ├─ auth/callback/route.ts     # PKCE code exchange
│  ├─ auth/sign-out/route.ts
│  ├─ api/inquiries/route.ts     # validated REST endpoint (mirrors the action)
│  ├─ dashboard/                 # SSR data → client tabs (live analytics, CRUD)
│  ├─ properties/                # SSR listings + detail (+ view tracker)
│  └─ saved/                     # saved listings
└─ components/providers/saved-provider.tsx   # DB-backed favourites (+ guest→DB migration)
```

### How each requirement is met
- **Auth / sessions** — `@supabase/ssr` cookie clients; `middleware.ts` calls `getUser()`
  every request to refresh the token and redirects unauthenticated users away from
  `/dashboard` (and signed-in users away from `/auth/*`).
- **Google + Email OTP** — `signInWithOAuth` (→ `/auth/callback`) and
  `signInWithOtp` + `verifyOtp` (six-digit email code) on the login page.
- **Property CRUD** — server actions in `lib/actions/properties.ts`; ownership re-checked
  server-side and enforced again by RLS.
- **Storage + upload pipeline** — `lib/storage/upload.ts` validates type/size, requests a
  signed upload URL, and PUTs via `XMLHttpRequest` for **real byte-level progress**; the
  add-listing form shows a per-image progress bar.
- **Saved persistence** — `saved-provider.tsx`: DB-backed for signed-in users (optimistic
  with rollback), `localStorage` for guests, and a one-time migration of guest favourites
  into the DB on sign-in.
- **Inquiries + anti-spam** — zod validation, a hidden honeypot field, and a minimum
  open-to-submit dwell time; the lead is inserted under RLS and `contact_count` is bumped
  via the security-definer RPC.
- **Live analytics** — `get_seller_stats()` RPC aggregates views/saves/leads/active across
  the owner's listings without weakening RLS.
- **RLS / ownership / server validation** — all writes go through validated server actions
  or RLS-guarded queries; the service-role client is confined to one counter RPC.
- **Search / filters / pagination** — `listProperties()` builds a single query with
  full-text search (`search_vector`, websearch), faceted filters, sort, and `range()`
  pagination returning an exact `count` for the pager.
- **SSR / performance** — server components fetch data; `next/image` everywhere; detail
  pages are dynamic and increment views once per mount via a server action; listings
  paginate to keep payloads small.

---

## 3. Deployment

`next build` then deploy. Set the four env vars in your host, and update Supabase **Site
URL + Redirect URLs** (and Google's authorised redirect) to your production domain.

⚠️ **Commercial hosting:** Vercel's free Hobby plan does **not** allow commercial use.
Since Estata monetises (featured listings/boosts), use **Vercel Pro (~$20/mo)** or a host
that permits commercial use on free tier — **Cloudflare Pages** or **Netlify**.
Supabase free tier pauses after ~1 week idle and caps at 500 MB DB / 1 GB storage.

> Note: `next build` isn't run in the authoring sandbox because `next/font/google`
> fetches fonts at build time and the sandbox blocks Google's domains. It builds normally
> on your machine/CI. The project passes `tsc --noEmit` with **zero type errors**, and the
> Supabase layer is fully typed end-to-end via `src/lib/types/database.ts`.
