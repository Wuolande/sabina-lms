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

## Phase 5: done

- New classroom at `/lessons/[id]` on LiveKit, built from scratch (the 2,900-line legacy page,
  its Supabase services and the Zoom/Meet/ClassIn stubs were removed). Apple-style: black room,
  rounded video tiles, frosted floating controls, system font.
  - Lobby: camera preview, mic/camera toggles, who you're meeting, and a "Join lesson" button
    that unlocks when the classroom opens (15 minutes before, set in Fees & policies).
  - Room: the other person large, yourself picture-in-picture, screen sharing takes the stage,
    speaking ring, chat over the data channel, time left, reconnecting notice.
  - Tutors leave with "Finish lesson" and can add notes for the student.
  - Tokens are issued only to the lesson's student and tutor, only for confirmed lessons, and
    only between opening time and 15 minutes after the end.
- Attendance decides the outcome 30 minutes after a lesson ends: if the tutor joined, the lesson
  is completed (a student who didn't turn up still pays). If the tutor never joined, it's a tutor
  no-show and the student is refunded in full. Tutors can also finish a lesson themselves.
- Lesson page for both sides (`/student|tutor/lessons/[id]`): time, join button, notes, review,
  payment and receipt, and "Report a problem" (up to 48 hours after; shown to staff under
  "Reported problems" in the admin, with a count).
- Reviews: one per completed lesson, 1–5 stars plus an optional comment. They feed the tutor's
  rating and count and appear on the public profile. Tutors reply from `/tutor/reviews`; staff
  can hide a review.
- Tutor stats (lessons taught, students taught) update on completion. New pages: `/tutor/students`
  and `/student/progress` (lessons, hours, tutors, weekly streak, time by subject, tutor notes,
  lessons waiting for a review).
- Cloudflare Stream: tutors can upload their intro video from the application (direct creator
  upload with a progress bar, max 3 minutes / 200 MB) when `CLOUDFLARE_STREAM_ACCOUNT_ID`,
  `CLOUDFLARE_STREAM_API_TOKEN` and `CLOUDFLARE_STREAM_CUSTOMER_CODE` are set. Links still work.
- Browser tests: `tests/e2e/phase5-classroom.spec.ts`.

Not yet: lesson recordings (LiveKit Egress to Stream) and a shared whiteboard. Both can be added
on top of this room later.

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

## Phase 6: done

Messaging, notifications and emails.

- **Messages** (`cms/messages/server.ts`, `/api/messages`, `/student|tutor/messages`): one conversation per
  student–tutor pair. Students can write to any approved tutor (from the profile, "Send a message"); tutors
  can write to students who have booked them or written first. Two-pane inbox on desktop, list → thread on
  phones; new messages arrive by polling (4s in an open thread, 15s for the list). 20 messages a minute max.
- **Contact details** (email, phone, WhatsApp/Telegram/…) are allowed but flag the conversation for staff
  (admin → Communication → Flagged for review, with a badge) and show the sender a short note about
  staying on Sabina. Staff can hide a message or close a conversation.
- **Notifications** (`cms/notify/server.ts`): every transactional email also creates an in-app
  notification (title = email heading, text = preheader, link = button). Bell + unread badges in the portal,
  refreshed every 30s. `/student|tutor/notifications` lists them with "Mark all as read" and email settings
  (new messages, lesson reminders; booking/payment/account emails always go).
- **Emails**: `deliver()` sends and logs every email (admin → Email log: sent / failed / turned off / not
  configured). Admin → Emails lists each one; staff can switch it off or add a note above its button.
  Message emails go at most once per conversation every 30 minutes unless the person has caught up.
- **Reminders**: the day before (20–25h ahead) and about an hour before each confirmed lesson, sent once.
- **Jobs**: housekeeping (expiries, attendance, reminders) runs in three ways: when lesson lists load; in the
  background of portal traffic, at most every 5 minutes per server (`cms/scheduling/housekeeping.ts`); and from
  `/api/cron/housekeeping`, which Vercel calls once a day (`vercel.json`, Hobby-plan compatible; set
  `CRON_SECRET`). For exact timing, set up any external scheduler in **Admin → Settings → Scheduled jobs**: it shows the
  address, lets an admin create or replace the key (or uses `CRON_SECRET` when set), has **Run now**, shows the last
  run and whether your scheduler is calling, and has step-by-step cron-job.org instructions. Schedulers send
  `Authorization: Bearer <key>`, or call `…/api/cron/housekeeping?key=<key>` if they can't add headers.
  Test: `tests/e2e/jobs.spec.ts`.
- Migration: `20261112_170454_messaging_notifications`. Test: `tests/e2e/phase6-messaging.spec.ts`.

## Phase 7: done

Content and academy.

- **Homepage** (admin → Website → Homepage, `cms/globals/HomePage.ts`): every heading, the rotating
  headlines, quick subject links, hero photo, the four numbers, how-it-works steps, the tutor section and the
  FAQ. Empty fields use the defaults in `cms/content/defaults.ts`. `{cancelHours}`, `{trialMinutes}`,
  `{tutorShare}`, `{earlyJoin}` and `{lateRefundSentence}` are replaced with the live platform rules, so copy
  never contradicts the settings. "Show live numbers" swaps the four numbers for real counts (tutors, students,
  lessons taught, average rating). The review rating under the hero only appears after 5 reviews.
- Copy rewritten to match what the product does: no whiteboard, PDF worksheets, "25-minute trials", "keep 85%",
  "$40–120/hr" or invented student counts. Brand is "Sabina" everywhere public (header, footer, manifest).
- **Pages** (`pages`): About, Pricing, Terms, Privacy, Cookies and Refund policy are created from plain-English
  defaults on first visit and edited in the admin; extra pages live at `/pages/<slug>`. Legal drafts need a
  lawyer's review before launch.
- **Blog** (`posts`, `blog-categories`): drafts, scheduled posts (future publish date), featured post,
  categories, reading time, cover image, per-post SEO. `/blog`, `/blog/<slug>` (with JSON-LD and related posts),
  latest 3 on the homepage, `/rss.xml` + `/feed.xml`.
- **SEO** (Site settings → Search and sharing): default title, description, sharing image, X handle, Google/Bing
  verification and an "allow indexing" switch that drives `robots.txt`. `sitemap.xml` lists tutors, subjects,
  posts and pages from Payload.
- Saving the homepage, a page, a post or site settings refreshes the cached public pages straight away.
- **Academy** (`training-courses`, `training-progress`; `/tutor/training`): courses of short lessons (text plus
  optional Stream/YouTube/Vimeo video) and a quiz with a pass mark. Progress is saved per lesson; passing gives
  a printable certificate (`SAB-XXXXXX-XXXX`). A starter course, "Teaching on Sabina", is created on first visit
  with the platform's real rules. Live cohorts from the old academy were not carried over.
- Removed: legacy `/api/homepage`, `/api/blogs`, `/api/pages`, `/api/policies`, old blog components and the old
  academy pages.
- Migration: `20261112_172523_content_academy`. Test: `tests/e2e/phase7-content.spec.ts`.

## Phase 8: done

Dashboards, reports and clean-up. The migration is complete: Sabina runs entirely on Payload.

- **Dashboard**: the migration roadmap is replaced by **Needs attention** (tutor applications, reported
  lesson problems, flagged conversations, payouts to send, lesson requests waiting on tutors, emails that
  failed this week), each linking to the filtered list.
- **Reports** (`/admin/reports`; admin, manager, finance): lesson sales, refunds, Sabina's fee, tutor earnings
  and paid out, lessons completed, tutor no-shows, cancellation rate; a month-by-month table; top tutors; lessons
  by subject and by outcome. Ranges: 30 days, 90 days, 12 months.
- **CSV exports** (`/api/reports/export?type=payments|bookings|payouts&range=`): staff-only, UTF-8 with BOM so
  Excel opens it correctly, and cells starting with `= + - @` are escaped against spreadsheet formula injection.
- **Removed**: Supabase (packages, env vars, `src/` services and repositories, 38 legacy SQL migrations),
  `/admin-legacy`, ~70 legacy `/api/admin/*`, `/api/student/*`, `/api/tutor/*`, `/api/upload/*` routes, legacy
  one-off scripts, unused components and services, the portal's "coming in phase N" placeholders.
- The default hero photo now ships with the site (`public/images/hero-student.png`) instead of the old
  Cloudinary account; Cloudinary is no longer an allowed image host.
- **`typescript.ignoreBuildErrors` is now `false`**: production builds fail on type errors.
- Note for API clients: cookie sign-in is only accepted on same-site requests (Payload's CSRF protection).
  Scripts and other servers should send `Authorization: JWT <token>` from `/api/users/login`.
- Test: `tests/e2e/phase8-admin.spec.ts`. Full suite: `npx playwright test` (desktop + mobile).

## Before launch

- Add production secrets: `DATABASE_URI`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_APP_URL`, R2 (`R2_*`), Stream
  (`CLOUDFLARE_STREAM_*`), LiveKit, Stripe and/or Paystack (+ webhook secrets), SMTP, `CRON_SECRET`.
- Run `npx payload migrate` against the production database (or let the first request apply them).
- Create the first admin at `/admin` (the first account is always an admin).
- Have a lawyer review Terms, Privacy, Cookies and Refund policy (Admin → Website → Pages).
- Try one real video lesson between two devices once LiveKit keys are set.

## Data migration from Supabase: done

The live Supabase project (`Sabina LMS`) now holds Payload's own `payload` schema next to the old `public`
tables, with all migrations recorded, so production starts with nothing left to migrate except the photo copy.

- **Imported** (`cms/seed/legacy-import.ts`, run locally against a fresh database, then applied to Supabase
  as SQL and verified by checksum): 11 accounts (roles, time zones, countries, join dates, email-confirmed
  state), 7 tutor profiles (6 live, 1 waiting for review) with subjects, languages, education, notice periods
  and review notes, 2 tutor schedules, 3 student profiles with goals, the 3 old test bookings (marked as tutor
  no-shows; sandbox payments, no money moved), platform rules (18% fee, $15–250 rates, 24 h cancellation,
  30% trial discount) and the X handle.
- **Imported as drafts** for review: 5 old blog posts, the Careers page and 5 old academy courses. They contain
  claims the platform doesn't support (whiteboard, LaTeX, recordings, "300%"/"400%" figures, invented authors),
  so they are not published.
- **Not imported**: the old homepage copy and the six standard pages (replaced by accurate defaults), the admin
  account's test tutor profile, sandbox payment records, and the secrets stored in `platform_policy_settings`.
- **Passwords**: Supabase bcrypt hashes are kept in a hidden `legacyPasswordHash` field. On first sign-in
  (site or `/admin`) the password is checked against it, saved as a normal Payload password, and the old hash is
  deleted (`cms/auth/legacy.ts`, tested in `tests/e2e/legacy-login.spec.ts`). The unconfirmed account stays
  unconfirmed and can use "resend code".
- **Photos**: 5 profile photos are copied from Cloudinary into the media library (R2) by the migration
  `20261112_194000_import_legacy_files`, which runs on the first production start after deploy. Two tutor
  documents (PDFs) are private on Cloudinary and need Cloudinary API access; they're listed in that tutor's
  internal notes instead.
- The `payload` schema is not exposed through Supabase's REST/GraphQL API (`anon` and `authenticated` have no
  access). The old `public` tables and functions are untouched.

## Admin clean-up: done

- **Payload's REST API moved to `/api/cms`** (`routes.api` in `payload.config.ts`). The site's own routes
  (`/api/subjects`, `/api/languages`, `/api/reviews`, `/api/bookings`, `/api/messages`, `/api/notifications`,
  `/api/payments`) used to shadow Payload's, so admin dropdowns showed "Untitled - ID: n".
- **Countries and time zones** are collections under Settings (`cms/collections/Geo.ts`), seeded from the IANA
  database (`cms/geo/seed-data.ts`). Users, tutor profiles and schedules still store the country name and IANA
  zone as text, but every write is checked against the active lists (`cms/geo/server.ts`). The admin uses a
  searchable picker (`cms/admin/fields/GeoSelect.tsx`); the site uses `useGeo()` + `<Combobox>`. `GET /api/geo`
  serves both lists.
- **Dropdowns**: `components/ui/Combobox.tsx` (search for long lists, keyboard support, groups) replaces native
  `<select>`s on the site; `components/ui/FormSelect.tsx` for GET forms such as the tutor search.
- **Rich text**: tutor About, Teaching style and work-experience descriptions, subject descriptions, student goal
  details and lesson notes are Lexical rich text (`cms/fields/richtext.ts`). The site edits them with
  `components/ui/RichTextEditor.tsx` (bold, italic, underline, lists); anything posted is cleaned by
  `toSafeLexical()` in `cms/content/rich.ts`. `tutor-profiles.aboutText` is a plain-text copy for search.
  Short plain-text fields stay plain: SEO descriptions, summaries/excerpts, one-line subtitles, chat messages
  and review comments.
- **Admin menu filters** use Payload's own query format (`where[or][0][and][0][field][op]=value`); the short
  form was dropped by the list view when opened from the menu.
- **Homepage editor** is filled with the default content on first use (`cms/content/seed-home.ts`). A counter's
  number can be left empty to follow the platform rules (e.g. trial minutes).
- Migration `20261113_040559_rich_text_geo` converts existing text to rich text, adds the new tables, seeds
  countries, time zones and the homepage, and names schedules after their tutor.
