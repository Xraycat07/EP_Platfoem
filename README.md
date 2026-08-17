# ELP Platform

Lead-to-referral pipeline for Energy Life Performance: capture a solar enquiry, record the
on-site assessment with photos, send a 3-tier quotation, and let the client accept it from a
shareable public link.

Built with Next.js 16 (App Router), Prisma 7 (SQLite), and Auth.js (NextAuth v5).

## Getting started

```bash
npm install
npx prisma migrate deploy   # creates dev.db and applies the schema
npx prisma db seed          # creates demo users + two sample leads
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`.

Demo logins (from the seed script):

- `admin@elp.co.za` / `elp-admin-2026` (admin)
- `rep@elp.co.za` / `elp-rep-2026` (sales rep)

## What's in here

- **Login** — email/password auth (Auth.js credentials provider, JWT sessions). Every
  server action re-checks the session itself, not just the page.
- **Leads pipeline** — `/leads` lists every enquiry with its stage; `/leads/[id]` is the
  working view: lead details, an on-site assessment form, and quotes.
- **Site photos** — the assessment section on a lead's page accepts multiple photos, stored
  under `public/uploads/<assessmentId>/` and linked to that assessment.
- **3-tier quotes** — `/leads/[id]/quote/new` builds an Essential / Independence / Premium
  quote. Saving it generates a public, unauthenticated link at `/quote/<token>` that the
  client can open, compare tiers, and accept or decline — no login required.
- **Sharing** — every quote has a "Copy share link" and "Share on WhatsApp" button, both on
  the internal lead page and on the public quote page itself.
- **Dashboard** — `/dashboard` shows a funnel (New → Qualified → … → Installed) built from
  live lead counts.

## Data

SQLite file at `./dev.db` (project root — see `prisma.config.ts`), not committed. Re-create
it any time with `npx prisma migrate deploy && npx prisma db seed`. Uploaded photos live in
`public/uploads/` and are also gitignored.

## Notes for whoever picks this up next

- Auth is enforced twice by design: `src/proxy.ts` redirects unauthenticated page visits, and
  every Server Action independently calls `requireUser()` — see
  `node_modules/next/dist/docs/01-app/02-guides/data-security.md` for why the second check
  matters (a proxy matcher change can silently stop protecting a route; a Server Action can't).
- This is a Next.js 16 project — several conventions (`proxy.ts` not `middleware.ts`, async
  `params`, the `PageProps`/`LayoutProps` typed helpers, Prisma 7's adapter-based client) are
  newer than most training data. `AGENTS.md` points at the bundled docs in
  `node_modules/next/dist/docs/` — check there before assuming an older API.
