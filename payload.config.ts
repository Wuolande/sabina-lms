import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { fullEditor } from "./cms/fields/richtext";
import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
import { s3Storage } from "@payloadcms/storage-s3";
import sharp from "sharp";
import { Users } from "./cms/collections/Users";
import { Media } from "./cms/collections/Media";
import { SiteSettings } from "./cms/globals/SiteSettings";
import { PlatformSettings } from "./cms/globals/PlatformSettings";
import { Languages, Subjects } from "./cms/collections/Subjects";
import { Countries, Timezones } from "./cms/collections/Geo";
import { PrivateFiles } from "./cms/collections/PrivateFiles";
import { TutorProfiles } from "./cms/collections/TutorProfiles";
import { StudentProfiles } from "./cms/collections/StudentProfiles";
import { Schedules } from "./cms/collections/Schedules";
import { Bookings } from "./cms/collections/Bookings";
import { Payments } from "./cms/collections/Payments";
import { Reviews } from "./cms/collections/Reviews";
import { BlogCategories, Pages, Posts } from "./cms/collections/Content";
import { TrainingCourses, TrainingProgress } from "./cms/collections/Academy";
import { HomePage } from "./cms/globals/HomePage";
import { Conversations, EmailLog, EmailTemplates, Messages, Notifications } from "./cms/collections/Messaging";
import { PayoutMethods, Payouts } from "./cms/collections/Payouts";
import { r2Config, r2PublicUrl, r2Ready } from "./cms/storage/r2";
import { migrations } from "./cms/migrations";
import { seedCatalogue } from "./cms/seed/catalogue";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const env = process.env;
const site = (env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "") || undefined;
const isProd = env.NODE_ENV === "production";

/** Addresses allowed to call the API with the admin session cookie (CSRF / CORS allow-list). */
const origins = [
  ...new Set(
    [
      site,
      ...[env.VERCEL_URL, env.VERCEL_BRANCH_URL].filter(Boolean).map((h) => `https://${h}`),
      ...(isProd ? [] : ["http://localhost:3000"]),
    ].filter(Boolean) as string[],
  ),
];

const smtpReady = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

/**
 * Payload: Sabina's backend. Database, accounts, permissions, business rules, files, emails,
 * background jobs and the admin at /admin all live here. The student and tutor portals and the
 * public website read and write through Payload's Local API and REST endpoints.
 */
export default buildConfig({
  serverURL: env.VERCEL_ENV === "preview" ? undefined : site,
  // Payload's own REST API lives under /api/cms so it never collides with the site's /api routes
  // (e.g. /api/subjects, /api/reviews), which the admin's dropdowns would otherwise read by mistake.
  routes: { api: "/api/cms" },
  csrf: origins,
  cors: origins,
  secret: env.PAYLOAD_SECRET || (isProd ? "" : "dev-only-secret-change-me"),
  admin: {
    user: Users.slug,
    avatar: { Component: "/cms/admin/shell/Avatar#Avatar" },
    meta: {
      titleSuffix: " · Sabina Admin",
      robots: "noindex, nofollow",
      description: "Sabina's private admin: tutors, students, lessons, payments and content.",
      icons: [
        { rel: "icon", type: "image/svg+xml", url: "/favicon.svg" },
        { rel: "apple-touch-icon", url: "/apple-touch-icon.png" },
      ],
    },
    dateFormat: "d MMM yyyy, HH:mm",
    livePreview: {
      breakpoints: [
        { label: "Phone", name: "phone", width: 390, height: 844 },
        { label: "Tablet", name: "tablet", width: 820, height: 1180 },
        { label: "Desktop", name: "desktop", width: 1440, height: 900 },
      ],
    },
    components: {
      graphics: { Logo: "/cms/admin/Brand#Logo", Icon: "/cms/admin/Brand#Icon" },
      Nav: "/cms/admin/shell/Nav#Nav",
      beforeLogin: ["/cms/admin/shell/LoginIntro#LoginIntro", "/cms/admin/shell/LoginForm#LoginForm"],
      afterLogin: ["/cms/admin/shell/LoginIntro#LoginFoot"],
      actions: ["/cms/admin/shell/HeaderActions#HeaderActions"],
      views: {
        dashboard: { Component: "/cms/admin/dashboard/DashboardView#DashboardView" },
        reports: { Component: "/cms/admin/reports/ReportsView#ReportsView", path: "/reports" },
        jobs: { Component: "/cms/admin/jobs/JobsView#JobsView", path: "/jobs" },
      },
    },
    importMap: { baseDir: path.resolve(dirname) },
  },
  collections: [Users, TutorProfiles, StudentProfiles, Schedules, Bookings, Reviews, Payments, Payouts, PayoutMethods, Conversations, Messages, Notifications, EmailTemplates, EmailLog, Posts, BlogCategories, Pages, TrainingCourses, TrainingProgress, Subjects, Languages, Countries, Timezones, Media, PrivateFiles],
  globals: [SiteSettings, PlatformSettings, HomePage],
  upload: { limits: { fileSize: 20 * 1024 * 1024 } },
  editor: fullEditor,
  db: postgresAdapter({
    // Payload's tables live in their own "payload" schema in the Supabase Postgres database.
    // The legacy Supabase tables in "public" are left alone and dropped once every phase is done.
    schemaName: "payload",
    pool: {
      connectionString: env.DATABASE_URI || "",
      // Serverless (Vercel) + Supabase transaction pooler: keep the pool small per instance.
      max: isProd ? 5 : 10,
      ssl: /localhost|127\.0\.0\.1/.test(env.DATABASE_URI || "")
        ? false
        : env.DATABASE_CA_CERT
          ? { ca: env.DATABASE_CA_CERT, rejectUnauthorized: true }
          : { rejectUnauthorized: false },
    },
    // Development pushes schema changes automatically; production only applies committed migrations.
    push: !isProd,
    migrationDir: path.resolve(dirname, "cms/migrations"),
    // Production applies pending migrations once, on the first request after a deploy (never during `next build`).
    prodMigrations: env.NEXT_PHASE === "phase-production-build" ? undefined : migrations,
  }),
  email: smtpReady
    ? nodemailerAdapter({
        defaultFromAddress: env.EMAIL_FROM || "no-reply@sabina.education",
        defaultFromName: env.EMAIL_FROM_NAME || "Sabina Education",
        transportOptions: {
          host: env.SMTP_HOST,
          port: Number(env.SMTP_PORT || 587),
          secure: Number(env.SMTP_PORT) === 465,
          auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
        },
      })
    : undefined,
  sharp,
  plugins: [
    // Cloudflare R2 for uploads. Without R2 variables (local development) files go to disk.
    s3Storage({
      enabled: r2Ready(),
      bucket: env.R2_BUCKET || "",
      config: r2Config(),
      collections: {
        media: {
          prefix: "media",
          // Public files are served straight from R2 / its CDN domain, not through the server.
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) => r2PublicUrl(filename, prefix),
        },
      },
    }),
    // Private R2 bucket for identity documents and certificates: always served through Payload's access checks.
    s3Storage({
      enabled: r2Ready() && Boolean(env.R2_PRIVATE_BUCKET),
      bucket: env.R2_PRIVATE_BUCKET || "",
      config: r2Config(),
      collections: { "private-files": { prefix: "private" } },
    }),
  ],
  // Starter subjects and languages on an empty database (never during `next build`).
  onInit: async (payload) => {
    if (env.NEXT_PHASE === "phase-production-build") return;
    await seedCatalogue(payload).catch((err) => payload.logger.error({ err }, "Catalogue seed failed"));
  },
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  graphQL: { disable: true },
  telemetry: false,
});
