import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";
import { checkApplication, getPolicies, ownTutorProfile, serializeApplication } from "@/cms/tutors/server";
import { VIDEO_RE } from "@/cms/tutors/completeness";
import type { User } from "@/payload-types";

async function tutor(req: NextRequest) {
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: req.headers });
  return { payload, user: user as User | null };
}

/** GET /api/tutor/application: the tutor's application (created as a draft if needed) plus the form's options. */
export async function GET(req: NextRequest) {
  const { payload, user } = await tutor(req);
  if (!user || user.role !== "tutor") return fail("Only tutors can do this.", 403);
  const [profile, subjects, languages, policies] = await Promise.all([
    ownTutorProfile(payload, user),
    payload.find({ collection: "subjects", where: { isActive: { equals: true } }, sort: "sortOrder", limit: 200, depth: 0, pagination: false }),
    payload.find({ collection: "languages", where: { isActive: { equals: true } }, sort: "name", limit: 200, depth: 0, pagination: false }),
    getPolicies(payload),
  ]);
  return NextResponse.json({
    application: serializeApplication(profile),
    ...checkApplication(profile, user),
    options: {
      subjects: subjects.docs.map((s) => ({ id: s.id, name: s.name, category: s.category })),
      languages: languages.docs.map((l) => ({ id: l.id, name: l.name })),
      policies,
    },
  });
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : undefined);
const num = (v: unknown) => (v === null || v === "" ? null : typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() && !Number.isNaN(Number(v)) ? Number(v) : undefined);
const year = (v: unknown) => {
  const n = num(v);
  return n === null || n === undefined ? null : n >= 1950 && n <= new Date().getFullYear() + 8 ? Math.round(n) : null;
};
const fileId = (v: unknown) => (v && typeof v === "object" ? (v as { id?: number }).id ?? null : typeof v === "number" ? v : null);

/** PATCH /api/tutor/application: save part of the application (autosave). Only whitelisted fields. */
export async function PATCH(req: NextRequest) {
  const { payload, user } = await tutor(req);
  if (!user || user.role !== "tutor") return fail("Only tutors can do this.", 403);
  const profile = await ownTutorProfile(payload, user);
  if (!["draft", "changes_requested", "approved"].includes(profile.status)) {
    return fail(profile.status === "submitted" ? "Your application is being reviewed. You can edit it again once we've replied." : "This profile can't be edited right now.", 409);
  }
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  for (const [k, max] of [["headline", 90], ["about", 2000], ["teachingStyle", 1500]] as const) if (b[k] !== undefined) data[k] = str(b[k], max) ?? "";
  if (b.introVideoUrl !== undefined) {
    const v = String(b.introVideoUrl ?? "").trim();
    if (v && !VIDEO_RE.test(v)) return fail("Use a YouTube, Vimeo or Cloudflare Stream link for your video.");
    data.introVideoUrl = v;
  }
  if (Array.isArray(b.languages)) data.languages = b.languages.slice(0, 8).filter((l: any) => l?.language && l?.level).map((l: any) => ({ language: Number(l.language), level: String(l.level) }));
  if (b.primarySubject !== undefined) data.primarySubject = b.primarySubject ? Number(b.primarySubject) : null;
  if (Array.isArray(b.subjects)) data.subjects = b.subjects.map(Number).filter(Boolean);
  if (Array.isArray(b.levelsTaught)) data.levelsTaught = b.levelsTaught.map(String);
  if (b.hourlyRate !== undefined) data.hourlyRate = num(b.hourlyRate);
  for (const k of ["offersTrial", "instantBooking"] as const) if (typeof b[k] === "boolean") data[k] = b[k];
  if (b.noticeHours !== undefined) data.noticeHours = Math.min(168, Math.max(0, num(b.noticeHours) ?? 12));
  if (Array.isArray(b.education))
    data.education = b.education.slice(0, 8).filter((e: any) => e?.degree?.trim() && e?.institution?.trim()).map((e: any) => ({ degree: str(e.degree, 120), institution: str(e.institution, 160), field: str(e.field, 120) ?? "", startYear: year(e.startYear), endYear: year(e.endYear), document: fileId(e.document) }));
  if (Array.isArray(b.certifications))
    data.certifications = b.certifications.slice(0, 10).filter((c: any) => c?.title?.trim() && c?.issuer?.trim()).map((c: any) => ({ title: str(c.title, 160), issuer: str(c.issuer, 160), year: year(c.year), credentialId: str(c.credentialId, 80) ?? "", document: fileId(c.document) }));
  if (Array.isArray(b.experience))
    data.experience = b.experience.slice(0, 10).filter((x: any) => x?.role?.trim() && x?.organization?.trim()).map((x: any) => ({ role: str(x.role, 120), organization: str(x.organization, 160), startYear: year(x.startYear), endYear: year(x.endYear), description: str(x.description, 500) ?? "" }));
  if (b.identity && typeof b.identity === "object") {
    const id = b.identity as Record<string, unknown>;
    const t = ["passport", "national_id", "drivers_license"].includes(String(id.documentType)) ? String(id.documentType) : null;
    data.identity = { documentType: t, document: fileId(id.document) };
  }

  // Documents must belong to this tutor.
  const docIds = [
    ...((data.education as any[]) ?? []).map((e) => e.document),
    ...((data.certifications as any[]) ?? []).map((c) => c.document),
    (data.identity as any)?.document,
  ].filter(Boolean);
  if (docIds.length) {
    const own = await payload.count({ collection: "private-files", where: { and: [{ id: { in: docIds } }, { owner: { equals: user.id } }] }, overrideAccess: true });
    if (own.totalDocs !== new Set(docIds).size) return fail("One of the documents couldn't be found. Please upload it again.", 400);
  }

  try {
    const updated = await payload.update({ collection: "tutor-profiles", id: profile.id, data, user, overrideAccess: false, depth: 1 });
    return NextResponse.json({ application: serializeApplication(updated), ...checkApplication(updated, user) });
  } catch (err) {
    const e = err as { message?: string; status?: number };
    if (e.status && e.status < 500) return fail(e.message ?? "Couldn't save.", e.status);
    payload.logger.error({ err }, "[tutor/application] save failed");
    return fail("Couldn't save your changes. Please try again.", 500);
  }
}
