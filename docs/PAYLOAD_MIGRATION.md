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

## Phase 1: done

- One account system on Payload for staff, tutors and students. Supabase Auth is no longer used.
- Email confirmation (branded email with a one-click link), password reset (one-hour link, signs
  the person in), lockout after 5 failed sign-ins, honeypot and per-IP rate limits on every form.
- `/api/auth/*` rebuilt on Payload: login, register, logout (ends the server-side session),
  session, verify-email, resend-code, forgot-password, reset-password.
- `proxy.ts` checks the Payload session token for `/student`, `/tutor` and their APIs;
  pages and APIs re-check the session through Payload.
- Redesigned sign-in, sign-up (learn/teach), check-your-inbox, forgot and reset screens.
- New student and tutor portal shell: sidebar, account menu, phone bottom bar, drawer.
  Sections not rebuilt yet show a "being rebuilt, returns in phase N" panel.
- Student and tutor home pages with a set-up checklist; account settings (photo, name, phone,
  country, time zone, password, sign out) on Payload.
- Browser tests: `tests/e2e/phase1-accounts.spec.ts` (desktop and phone).

Not yet moved: the onboarding screens (`/onboarding/*`, phase 2), the public tutor marketplace
(phase 2), and the legacy admin at `/admin-legacy`, which no longer has a sign-in and is removed in phase 8.

## Phase 2: done

- Catalogue in Payload: subjects (22 seeded, editable), languages (16), Fees & policies settings.
- Tutor profiles: one document per tutor, used as the application while it's reviewed and as the
  public profile once approved. Identity documents, review notes, document files and the account
  link are hidden from the public by field-level access.
- Private documents collection on the private R2 bucket; only the owner and the review team
  (admin, manager, support) can download files.
- Tutor application at `/tutor/profile`: 7 steps (photo, profile, subjects & pricing, education,
  identity, intro video, review), live checklist, price limits from Fees & policies, document
  uploads, locked while under review, editable again after "changes requested" or approval.
- Admin review: "Tutor applications" in the sidebar with a count, and Approve / Request changes /
  Reject / Suspend on each tutor, with a message to the tutor, history, and emails.
- Public marketplace `/find-tutors` (search, subject, level, language, price, trial filters, sort,
  pagination, all in the URL), tutor profiles `/tutors/[slug]` with structured data, `/subjects`
  and `/subjects/[slug]`; homepage featured tutors and subjects come from Payload.
- Students: save tutors (`/student/favorites`), learning goals with recommendations
  (`/student/profile`). Old onboarding URLs redirect to these screens.
- `scripts/seed-demo-tutors.mjs` creates demo tutors through the real flow (development only).
- Browser tests: `tests/e2e/phase2-tutors.spec.ts`.

## Phase 3: done

- Schedules (one per tutor): weekly hours in the tutor's own time zone, time off, minimum notice,
  a break between lessons, and instant booking on or off. Kept apart from the tutor profile so an
  approved tutor can change hours without reopening their application.
- Bookings: student, tutor, subject, trial or regular (30/60/90 min), times in UTC, price and fee
  snapshot, status (requested, confirmed, declined, cancelled, expired, completed, no-show),
  cancellation details and history. Payment status stays "unpaid" until phase 4.
- Open times are calculated on the server from weekly hours, time off, notice, the booking window
  (Fees & policies: "Students can book up to N days ahead"), existing bookings and the student's
  own lessons. Daylight-saving changes are handled.
- Double booking is prevented: each booking is created inside a database transaction holding
  advisory locks on the tutor and the student, then checked again for overlaps. Times outside the
  tutor's hours, inside the notice period, or past the booking window are refused.
- One trial per student and tutor. Instant booking confirms straight away; otherwise the tutor
  accepts or declines, and requests nobody answers expire at the lesson time.
- Cancelling: either side before the lesson starts; a tutor cancelling a confirmed lesson must give
  a reason; a student cancelling inside the free-cancellation window is flagged as late.
- Emails to both sides for booked, requested, accepted, declined and cancelled lessons, with times
  in each person's own zone.
- Screens: booking page `/tutors/[slug]/book`; tutor `/tutor/availability`, `/tutor/calendar`
  (week view with open hours), `/tutor/lessons` (requests, upcoming, past, cancelled); student
  `/student/lessons` and `/student/calendar`. Home pages show real numbers and the next lessons.
  Admin: Bookings and Tutor schedules, plus lesson numbers on the dashboard.
- Browser tests: `tests/e2e/phase3-booking.spec.ts` (including two students racing for one slot).

## Phase 4: done

- Pay to book: a booking first holds the time ("awaiting payment", 15 minutes by default) while
  the student pays. A successful payment confirms it (instant booking) or sends the tutor a
  request. Unpaid holds release the time automatically. If a payment arrives after the hold ran
  out, the lesson is still booked when the time is free; otherwise the money goes straight back.
- Providers, each switched on by its secret key and called over its REST API:
  - **Stripe Checkout** for cards, Apple Pay and Google Pay. Webhook `/api/payments/webhook/stripe`.
  - **Paystack** for M-Pesa, other mobile money and African cards. Webhook `/api/payments/webhook/paystack`.
  - Webhook signatures are verified (Stripe: HMAC-SHA256 with a 10-minute tolerance; Paystack:
    HMAC-SHA512). The return page also asks the provider directly in case a webhook is slow.
  - **Test payment**: a simulated checkout, offered only outside production when no keys are set
    (or with `PAYMENTS_DEV_MODE=on`). It lets the whole flow be tried and tested end to end.
- Refunds follow the rules: full refund when the tutor declines or cancels, when a request expires
  unanswered, or when the student cancels before the free-cancellation window. Late
  cancellations refund the percentage set in Fees & policies (0% by default). Refunds go back
  through the original provider and are emailed.
- Payments, Payouts and Payout details collections (admin › Money). Settings › Fees & policies
  gains hold time, late-cancellation refund %, days before earnings clear (2) and minimum payout.
- Students: `/student/payments` (history, totals) and printable receipts. Emailed receipts.
- Tutors: `/tutor/earnings`: available, clearing, upcoming and paid-out balances; per-lesson
  earnings after the platform fee; M-Pesa, bank or PayPal payout details; "Request payout" for
  everything available. Finance marks a payout paid in the admin (with a transfer reference) and
  the tutor is emailed.
- Admin dashboard: revenue for the period and payouts waiting to be sent.
- Browser tests: `tests/e2e/phase4-payments.spec.ts`.

To go live: add `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` and/or `PAYSTACK_SECRET_KEY`, and
register the webhook URLs above in each dashboard. PayPal can be added later as a third provider.

### Running locally

```bash
cp .env.example .env.local   # fill DATABASE_URI and PAYLOAD_SECRET at minimum
npm install
npm run dev                  # http://localhost:3000/admin creates the first admin
```

Browser tests (with the app running, and `AUTH_RATE_LIMIT=off` in `.env.local` so repeated
sign-ups aren't blocked; that switch is ignored in production):

```bash
npm run test:e2e
```

Useful scripts: `npm run generate:types`, `npm run generate:importmap` (after adding admin
components), `npm run migrate:create <name>` (after schema changes, before committing).
