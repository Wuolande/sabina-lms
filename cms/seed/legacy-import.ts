/**
 * One-off import of the old Supabase platform into Payload.
 *
 * Reads a snapshot exported from Supabase (users with bcrypt hashes, tutor profiles, hours, students,
 * bookings) and the old content (blog posts, pages, academy courses), and writes them through
 * Payload. Idempotent per record (matched by email / slug / reference). Files are not copied here:
 * avatar URLs are kept on each user (`legacyAvatarUrl`) and moved to R2 by the
 * `import_legacy_files` migration on the first deploy that has R2 configured.
 *
 *   SNAPSHOT=/path/snapshot.json CONTENT=/path/content.json npx payload run cms/seed/legacy-import.ts
 */
import fs from "node:fs";
import { randomBytes } from "node:crypto";
import { getPayload, type Payload } from "payload";
import config from "@payload-config";
import { lexical } from "../content/lexical";

type Snapshot = {
  policy: Record<string, number | boolean | string>;
  seo: { twitter?: string };
  users: { id: string; email: string; first_name: string; last_name: string; country: string | null; timezone: string; status: string; created_at: string; pw: string; confirmed: boolean; roles: string[] }[];
  avatars: Record<string, string>;
  documents: { user_id: string; type: string; title: string; status: string }[];
  tutors: { id: string; user_id: string; slug: string; headline: string; bio: string; hourly_rate: number; years_experience: number; teaching_style: string | null; intro_video_url: string | null; app_status: string; submitted_at: string | null; reviewed_at: string | null; is_featured: boolean; trial: boolean }[];
  educations: { tutor_id: string; degree: string; institution: string; field_of_study: string; start_year: number; end_year: number }[];
  tutor_languages: { tutor_id: string; name: string; code: string; proficiency: string }[];
  tutor_subjects: { tutor_id: string; slug: string; is_primary: boolean }[];
  subject_map: Record<string, string>;
  rules: { tutor_id: string; day: number; start: string; end: string }[];
  settings: { tutor_id: string; buffer: number; notice: number }[];
  students: { user_id: string; target_exam: string | null; level: string | null; weekly_hours: number | null }[];
  bookings: { ref: string; student_id: string; tutor_id: string; subject_slug: string | null; start: string; end: string; minutes: number; price: number; currency: string; gateway: string; note: string | null; created_at: string; student_joined_at: string | null }[];
};
type Content = {
  blogs: { slug: string; title: string; excerpt: string; content: string; author: string; author_title: string; category: string; published_at: string; seo_title: string; seo_description: string }[];
  pages: { slug: string; title: string; intro: string; html: string }[];
  courses: { slug: string; title: string; summary: string; required: boolean; pass: number; order: number; lessons: { title: string; minutes: number; video: string | null; md: string }[]; questions: { question: string; options: string[]; answer: number; explain: string }[] }[];
};
type Block = Parameters<typeof lexical>[0][number];

/** Very small HTML → outline converter for the old blog/page HTML (h2, h3, p, ul/li, strong). */
function htmlBlocks(html: string): Block[] {
  const text = (s: string) => s.replace(/<strong>(.*?)<\/strong>/g, "**$1**").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  const out: Block[] = [];
  for (const m of html.matchAll(/<(h2|h3|p|ul)[^>]*>([\s\S]*?)<\/\1>/g)) {
    if (m[1] === "ul") out.push(["ul", [...m[2]!.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((li) => text(li[1]!))]);
    else out.push([m[1] as "h2" | "h3" | "p", text(m[2]!)]);
  }
  return out.length ? out : [["p", text(html)]];
}

/** Very small Markdown → outline converter for the old academy lessons. */
function mdBlocks(md: string): Block[] {
  const out: Block[] = [];
  let list: { kind: "ul" | "ol"; items: string[] } | null = null;
  const flush = () => {
    if (list) out.push([list.kind, list.items]);
    list = null;
  };
  const inline = (s: string) => s.replace(/`([^`]+)`/g, "$1").replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1$2").trim();
  for (const raw of md.split("\n")) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    const ul = line.match(/^[-*]\s+(.*)$/);
    const ol = line.match(/^\d+\.\s+(.*)$/);
    if (h) {
      flush();
      if (h[1] === "#") continue; // the lesson title already shows as the heading
      out.push([h[1] === "##" ? "h2" : "h3", inline(h[2]!.replace(/:$/, ""))]);
    } else if (ul || ol) {
      const kind = ul ? "ul" : "ol";
      if (!list || list.kind !== kind) {
        flush();
        list = { kind, items: [] };
      }
      list.items.push(inline((ul ?? ol)![1]!));
    } else {
      flush();
      out.push(["p", inline(line)]);
    }
  }
  flush();
  return out.length ? out : [["p", md.trim()]];
}

const LEVEL: Record<string, string> = { NATIVE: "native", FLUENT: "c2", ADVANCED: "c1", INTERMEDIATE: "b1", BASIC: "a2" };
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const NOTE = "Imported from the old platform.";

export async function importLegacy(payload: Payload, snap: Snapshot, content: Content) {
  const log = (m: string) => payload.logger.info(`[legacy] ${m}`);
  const sql = async (q: string, params: unknown[]) => {
    const pool = (payload.db as unknown as { pool: { query: (q: string, p: unknown[]) => Promise<unknown> } }).pool;
    await pool.query(q, params);
  };

  /* ---- platform rules and SEO ---- */
  await payload.updateGlobal({
    slug: "platform-settings",
    data: {
      platformFeePercent: Number(snap.policy.platformFeePercent),
      cancellationRefundHours: Number(snap.policy.cancellationRefundHours),
      classroomEarlyJoinMinutes: Number(snap.policy.classroomEarlyJoinMinutes),
      tutorMinHourlyRate: Number(snap.policy.tutorMinHourlyRate),
      tutorMaxHourlyRate: Number(snap.policy.tutorMaxHourlyRate),
      instantBookingEnabled: Boolean(snap.policy.instantBookingEnabled),
      trialLessonDiscountPercent: Number(snap.policy.trialLessonDiscountPercent),
      currency: String(snap.policy.currency),
    } as never,
    overrideAccess: true,
  });
  if (snap.seo.twitter) {
    const site = (await payload.findGlobal({ slug: "site-settings", overrideAccess: true })) as { seo?: Record<string, unknown> };
    await payload.updateGlobal({ slug: "site-settings", data: { seo: { ...(site.seo ?? {}), twitter: snap.seo.twitter } } as never, overrideAccess: true });
  }
  log("platform settings");

  /* ---- users (admin first, so it's the first account and acts as the creator of the others) ---- */
  const userIds = new Map<string, number>();
  const ordered = [...snap.users].sort((a, b) => Number(b.roles.includes("ADMIN") || b.roles.includes("SUPER_ADMIN")) - Number(a.roles.includes("ADMIN") || a.roles.includes("SUPER_ADMIN")));
  let admin: { id: number; role: string; collection: "users" } | null = null;
  for (const u of ordered) {
    const email = u.email.toLowerCase().trim();
    const existing = (await payload.find({ collection: "users", where: { email: { equals: email } }, limit: 1, depth: 0, overrideAccess: true })).docs[0];
    const role = u.roles.includes("SUPER_ADMIN") || u.roles.includes("ADMIN") ? "admin" : u.roles.includes("TUTOR") ? "tutor" : "student";
    const data = {
      email,
      firstName: u.first_name ? u.first_name.charAt(0).toUpperCase() + u.first_name.slice(1) : "",
      lastName: u.last_name ? u.last_name.charAt(0).toUpperCase() + u.last_name.slice(1) : "",
      role,
      status: "active",
      timezone: u.timezone || "UTC",
      country: u.country ?? undefined,
      legacyId: u.id,
      legacyPasswordHash: u.pw,
      legacyAvatarUrl: snap.avatars[u.id] ?? null,
      _verified: u.confirmed,
    };
    const doc: { id: number } = existing
      ? await payload.update({ collection: "users", id: existing.id, data: data as never, overrideAccess: true, user: admin ?? undefined, context: { skipAudit: true } })
      : await payload.create({ collection: "users", data: { ...data, password: randomBytes(24).toString("base64url") } as never, overrideAccess: true, disableVerificationEmail: true, user: admin ?? undefined, context: { skipAudit: true } });
    if (!admin && role === "admin") admin = { id: doc.id, role: "admin", collection: "users" };
    // Keep the original join date and verification state (create hooks set both).
    await sql(`update payload.users set created_at = $2, _verified = $3, role = $4 where id = $1`, [doc.id, u.created_at, u.confirmed, role]);
    userIds.set(u.id, doc.id);
  }
  log(`${userIds.size} users`);

  /* ---- catalogue lookups ---- */
  const subjectBySlug = new Map<string, number>();
  for (const s of (await payload.find({ collection: "subjects", limit: 500, pagination: false, depth: 0, overrideAccess: true })).docs) subjectBySlug.set(String(s.slug), s.id);
  const subjectFor = (legacySlug: string | null) => (legacySlug ? (subjectBySlug.get(snap.subject_map[legacySlug] ?? legacySlug) ?? null) : null);
  const languageId = async (name: string, code: string) => {
    const found = (await payload.find({ collection: "languages", where: { code: { equals: code } }, limit: 1, depth: 0, overrideAccess: true })).docs[0];
    if (found) return found.id;
    return (await payload.create({ collection: "languages", data: { name, code, nativeName: name, isActive: true } as never, overrideAccess: true })).id;
  };

  /* ---- tutor profiles and schedules ---- */
  const tutorIds = new Map<string, number>();
  for (const t of snap.tutors) {
    const userId = userIds.get(t.user_id);
    const owner = snap.users.find((u) => u.id === t.user_id);
    if (!userId || !owner) continue;
    if (owner.roles.includes("ADMIN") || owner.roles.includes("SUPER_ADMIN")) {
      log(`skipped tutor profile ${t.slug}: it belongs to the admin account`);
      continue;
    }
    const langs = [];
    for (const l of snap.tutor_languages.filter((x) => x.tutor_id === t.id)) langs.push({ language: await languageId(l.name, l.code), level: LEVEL[l.proficiency] ?? "c1" });
    const subs = snap.tutor_subjects.filter((s) => s.tutor_id === t.id);
    const subjectIds = subs.map((s) => subjectFor(s.slug)).filter((x): x is number => Boolean(x));
    const primary = subjectFor(subs.find((s) => s.is_primary)?.slug ?? subs[0]?.slug ?? null);
    const docs = snap.documents.filter((d) => d.user_id === t.user_id);
    const setting = snap.settings.find((s) => s.tutor_id === t.id);
    const approved = t.app_status === "APPROVED";
    const first = owner.first_name.charAt(0).toUpperCase() + owner.first_name.slice(1);
    const data = {
      user: userId,
      status: approved ? "approved" : t.app_status === "SUBMITTED" ? "submitted" : "draft",
      displayName: `${first} ${owner.last_name.charAt(0).toUpperCase()}.`,
      slug: t.slug,
      headline: t.headline,
      about: t.bio || null,
      teachingStyle: t.teaching_style,
      hourlyRate: t.hourly_rate,
      offersTrial: t.trial,
      instantBooking: true,
      noticeHours: setting?.notice ?? 12,
      introVideoUrl: t.intro_video_url || null,
      languages: langs,
      subjects: subjectIds,
      primarySubject: primary,
      education: snap.educations.filter((e) => e.tutor_id === t.id).map((e) => ({ degree: e.degree.trim(), institution: e.institution.trim(), field: e.field_of_study.trim(), startYear: e.start_year, endYear: e.end_year })),
      country: owner.country,
      timezone: owner.timezone,
      isFeatured: t.is_featured,
      submittedAt: t.submitted_at,
      approvedAt: approved ? t.reviewed_at : null,
      internalNotes: [
        NOTE,
        `Old profile ID: ${t.id}. ${t.years_experience} years' experience stated.`,
        ...(docs.length ? ["Documents checked on the old platform (files stay on the old Cloudinary account; ask the tutor to upload them again if needed):", ...docs.map((d) => `- ${d.title} (${d.status.toLowerCase()})`)] : []),
      ].join("\n"),
      reviewHistory: [{ action: approved ? "approved" : "submitted", notes: NOTE, at: t.reviewed_at ?? t.submitted_at ?? new Date().toISOString() }],
    };
    const existing = (await payload.find({ collection: "tutor-profiles", where: { user: { equals: userId } }, limit: 1, depth: 0, overrideAccess: true })).docs[0];
    const doc = existing
      ? await payload.update({ collection: "tutor-profiles", id: existing.id, data: data as never, overrideAccess: true, context: { skipTutorChecks: true } })
      : await payload.create({ collection: "tutor-profiles", data: data as never, overrideAccess: true, context: { skipTutorChecks: true } });
    tutorIds.set(t.id, doc.id);

    const rules = snap.rules.filter((r) => r.tutor_id === t.id);
    if (rules.length) {
      const sched = { user: userId, timezone: owner.timezone || "UTC", weekly: rules.map((r) => ({ day: r.day, start: r.start, end: r.end })), noticeHours: setting?.notice ?? 12, bufferMinutes: setting?.buffer ?? 10, instantBooking: true };
      const s = (await payload.find({ collection: "schedules", where: { user: { equals: userId } }, limit: 1, depth: 0, overrideAccess: true })).docs[0];
      if (s) await payload.update({ collection: "schedules", id: s.id, data: sched as never, overrideAccess: true });
      else await payload.create({ collection: "schedules", data: sched as never, overrideAccess: true });
    }
  }
  log(`${tutorIds.size} tutor profiles`);

  /* ---- student profiles ---- */
  for (const s of snap.students) {
    const userId = userIds.get(s.user_id);
    if (!userId) continue;
    const goalText = s.target_exam ?? null;
    const subject = goalText && /business english/i.test(goalText) ? subjectBySlug.get("business-english") : null;
    const data = {
      user: userId,
      level: s.level ? s.level.toLowerCase() : undefined,
      goal: goalText ? (/hobby|personal/i.test(goalText) ? "hobby" : "exam") : undefined,
      goalDetails: goalText,
      subjects: subject ? [subject] : [],
      pace: s.weekly_hours && s.weekly_hours >= 4 ? "2-3" : "1",
      onboardedAt: goalText ? new Date().toISOString() : null,
    };
    const existing = (await payload.find({ collection: "student-profiles", where: { user: { equals: userId } }, limit: 1, depth: 0, overrideAccess: true })).docs[0];
    if (existing) await payload.update({ collection: "student-profiles", id: existing.id, data: data as never, overrideAccess: true });
    else await payload.create({ collection: "student-profiles", data: data as never, overrideAccess: true });
  }
  log(`${snap.students.length} student profiles`);

  /* ---- past bookings (sandbox payments; the tutor never joined) ---- */
  const fee = Number(snap.policy.platformFeePercent);
  for (const b of snap.bookings) {
    const student = userIds.get(b.student_id);
    const tutor = tutorIds.get(b.tutor_id);
    const tutorOwner = snap.tutors.find((t) => t.id === b.tutor_id);
    const tutorUser = tutorOwner ? userIds.get(tutorOwner.user_id) : undefined;
    if (!student || !tutor || !tutorUser) continue;
    const exists = await payload.count({ collection: "bookings", where: { reference: { equals: b.ref } }, overrideAccess: true });
    if (exists.totalDocs) continue;
    await payload.create({
      collection: "bookings",
      data: {
        reference: b.ref,
        status: "no_show",
        noShowBy: "tutor",
        paymentStatus: "waived",
        startsAt: b.start,
        endsAt: b.end,
        student,
        tutor,
        tutorUser,
        subject: subjectFor(b.subject_slug),
        kind: b.minutes <= 30 ? "trial" : "regular",
        minutes: b.minutes,
        price: b.price,
        currency: b.currency,
        platformFeePercent: fee,
        studentNote: b.note,
        studentTimezone: "UTC",
        studentJoinedAt: b.student_joined_at,
        history: [{ action: `${NOTE} Test booking paid in ${b.gateway} sandbox mode (no real money). The tutor didn't join.`, at: b.created_at }],
      } as never,
      overrideAccess: true,
      context: { skipBookingChecks: true },
    });
  }
  log(`${snap.bookings.length} bookings`);

  /* ---- blog posts, pages and courses: imported as drafts for review ---- */
  const categoryId = async (name: string) => {
    const slug = slugify(name);
    const found = (await payload.find({ collection: "blog-categories", where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })).docs[0];
    return found ? found.id : (await payload.create({ collection: "blog-categories", data: { name, slug }, overrideAccess: true })).id;
  };
  for (const p of content.blogs) {
    if ((await payload.count({ collection: "posts", where: { slug: { equals: p.slug } }, overrideAccess: true })).totalDocs) continue;
    await payload.create({
      collection: "posts",
      data: {
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        body: lexical(htmlBlocks(p.content)),
        status: "draft",
        publishedAt: p.published_at,
        category: await categoryId(p.category),
        authorTitle: `${p.author}, ${p.author_title}`.slice(0, 120),
        seo: { title: p.seo_title.slice(0, 70), description: p.seo_description.slice(0, 200) },
      } as never,
      overrideAccess: true,
    });
  }
  for (const p of content.pages) {
    if ((await payload.count({ collection: "pages", where: { slug: { equals: p.slug } }, overrideAccess: true })).totalDocs) continue;
    await payload.create({ collection: "pages", data: { title: p.title, slug: p.slug, intro: p.intro, body: lexical(htmlBlocks(p.html)), kind: "company", status: "draft" } as never, overrideAccess: true });
  }
  for (const c of content.courses) {
    if ((await payload.count({ collection: "training-courses", where: { slug: { equals: c.slug } }, overrideAccess: true })).totalDocs) continue;
    await payload.create({
      collection: "training-courses",
      data: {
        title: c.title,
        slug: c.slug,
        summary: c.summary.slice(0, 240),
        status: "draft",
        required: c.required,
        order: c.order,
        lessons: c.lessons.map((l) => ({ title: l.title, minutes: l.minutes, video: l.video, body: lexical(mdBlocks(l.md)) })),
        quiz: { passMark: c.pass, questions: c.questions.map((q) => ({ question: q.question, options: q.options.map((text) => ({ text })), answer: q.answer, explain: q.explain })) },
      } as never,
      overrideAccess: true,
    });
  }
  log(`${content.blogs.length} posts, ${content.pages.length} pages, ${content.courses.length} courses (as drafts)`);
}

// `npx payload run cms/seed/legacy-import.ts`
if (process.env.SNAPSHOT && process.env.CONTENT) {
  const payload = await getPayload({ config });
  await importLegacy(payload, JSON.parse(fs.readFileSync(process.env.SNAPSHOT, "utf8")), JSON.parse(fs.readFileSync(process.env.CONTENT, "utf8")));
  payload.logger.info("[legacy] done");
  process.exit(0);
}
