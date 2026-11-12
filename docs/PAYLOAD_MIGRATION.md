# Sabina on Payload: migration plan

Every backend concern of Sabina moves onto Payload 3: database schema, accounts and roles,
permissions, business rules, file storage, email, background jobs and the admin. The Next.js
frontend (public site, student portal, tutor portal, classroom) stays and reads/writes through
Payload's Local API and REST endpoints.

The site is not live yet, so this is a rebuild, not a data migration. Legacy Supabase code keeps
running until each phase replaces it, and is deleted in phase 8.

## Architecture

| Concern | Before | After |
|---|---|---|
| Accounts | Supabase Auth | Payload `users` collection, roles: admin, manager, finance, support, editor, tutor, student |
| Schema | 53 SQL tables, 38 migrations | Payload collections and globals in the `payload` Postgres schema, Payload migrations |
| Permissions | Row-level security | Payload collection and field access functions (`cms/access`) |
| Business rules | 55 SQL functions, 10 triggers | Payload hooks, plus Postgres constraints for money and scheduling invariants |
| Admin | Custom `/admin` | Payload admin at `/admin` (old one at `/admin-legacy` until phase 8) |
| Files | Cloudinary and Supabase Storage | Cloudflare R2: public bucket and private bucket |
| Video | none / LiveKit only | Cloudflare Stream for recorded video, LiveKit for live lessons |
| Email | Direct Nodemailer calls | Payload email adapter, editable templates |
| Live updates | Supabase Realtime | LiveKit data channels (classroom), server-sent events (messages, notifications) |
| Scheduled work | ad hoc | Payload jobs queue plus Vercel Cron |

### Three experiences, one backend

- **Admin** (`/admin`): Payload admin with the Sabina shell: branded sidebar, ⌘K command palette,
  notifications, dark mode, dashboard. Only staff roles can open it.
- **Tutor portal** (`/tutor`) and **student portal** (`/student`): custom Next.js screens using the
  same design tokens as the admin, powered by Payload. Tutors and students never see the Payload
  admin; a portal is built around their tasks, not around collections. Each phase that touches
  them modernises its screens at the same time.

## Phases

| # | Phase | Scope | Estimate |
|---|---|---|---|
| 0 | Foundation | Payload 3.92, Next 16, admin shell and theme, users, media on R2, migrations | ~3 days |
| 1 | Accounts & roles | Payload login, sign-up, email verification, password reset, route protection for portals | ~4 days |
| 2 | Tutors & catalogue | Subjects, languages, profiles, tutor applications, private documents (R2 private), approval workflow, marketplace | ~5 days |
| 3 | Scheduling & bookings | Availability, time zones, bookings, double-booking guard (hook + DB constraint), calendars | ~5 days |
| 4 | Payments | Stripe and Paystack first (PayPal later), webhooks, invoices, refunds, payouts, commission | ~5 days |
| 5 | Classroom & lessons | LiveKit tokens from Payload, lesson lifecycle, whiteboard/notes/chat over LiveKit data, recordings to Stream, homework, reviews | ~5 days |
| 6 | Messaging & jobs | Conversations, notifications, SSE live updates, email templates, reminders and no-show jobs | ~4 days |
| 7 | Content & academy | Blog, pages, homepage, SEO, redirects, tutor academy (courses on Stream), live cohorts | ~4 days |
| 8 | Dashboards & launch | Reports, payouts board, audit log, impersonation, remove Supabase code, launch checklist | ~4 days |

Every phase ends with a typecheck, a production build and browser tests of the core journeys.

## Cloudflare: storage and video

### R2 (files): in place from phase 0

- `R2_BUCKET` (public): avatars, blog and page images, course thumbnails. Served directly from
  `R2_PUBLIC_URL`. Use a custom domain (e.g. `files.sabina.education`) rather than `r2.dev`, which
  is rate-limited and not meant for production.
- `R2_PRIVATE_BUCKET` (private, phase 2): tutor ID documents, certificates, lesson materials.
  Never public; Payload streams them after checking access.
- No egress fees, which matters for an LMS where the same materials are downloaded repeatedly.

### Stream (video): recommended

Use **Cloudflare Stream** for anything recorded. Don't use it for the live classroom.

| Video | Use |
|---|---|
| Live 1-to-1 / group lessons | **LiveKit** (already integrated). Stream Live is one-to-many broadcast with ~10 s latency, wrong for interactive lessons |
| Lesson recordings | LiveKit Egress writes the recording to R2 → a Payload job imports it into Stream → the student sees it in the lesson page |
| Tutor intro videos | Direct upload from the tutor portal to Stream (Payload issues a one-time upload URL; the file never touches our server) |
| Academy courses | Stream, with signed URLs so only enrolled tutors can watch |
| Live cohort sessions (one-to-many) | Stream Live is a good fit if a cohort grows beyond what a LiveKit room should hold |

Why Stream rather than putting MP4s in R2:
- Automatic adaptive bitrate (HLS/DASH), so videos play well on slow mobile connections.
- Thumbnails, captions and a ready player included.
- Signed URLs and allowed-origins protect paid content.
- Billed per minute stored and minute delivered, so budget for recordings: set a retention policy
  (for example, keep lesson recordings for 90 days unless the student pins one).

Payload integration (phases 5 and 7): a `videos` collection storing Stream's video UID, status,
duration and thumbnail; a webhook endpoint Stream calls when encoding finishes; a field component
in the admin to upload and preview.

## Phase 0: done

- Payload 3.92 with the Postgres adapter in the `payload` schema; Next.js upgraded to 16.4,
  `middleware.ts` renamed to `proxy.ts`.
- Site routes moved into the `app/(site)` route group (URLs unchanged); Payload in `app/(payload)`.
- Old admin moved to `/admin-legacy`; the old media proxy moved from `/api/media/*` to
  `/api/secure-media/*` so `/api/media` belongs to Payload.
- `users` with roles and status (suspended users cannot sign in, public sign-up can never create
  staff accounts, the first account is always an admin), `media` on Cloudflare R2, `site-settings`
  with brand colours and logos.
- Sabina admin shell ported from GreenBoma and rebranded: sidebar with menu sections that fill in
  as collections land, ⌘K palette, "New" menu, notifications, dark mode, custom login, dashboard.
- Initial migration (creates the `payload` schema), tested on an empty database.

### Running locally

```bash
cp .env.example .env.local   # fill DATABASE_URI and PAYLOAD_SECRET at minimum
npm install
npm run dev                  # http://localhost:3000/admin creates the first admin
```

Useful scripts: `npm run generate:types`, `npm run generate:importmap` (after adding admin
components), `npm run migrate:create <name>` (after schema changes, before committing).
