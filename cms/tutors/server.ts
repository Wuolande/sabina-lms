import "server-only";
import type { Payload } from "payload";
import type { TutorProfile, User } from "@/payload-types";
import { PLATFORM_DEFAULTS } from "../globals/PlatformSettings";
import { missingRequired, requirements } from "./completeness";
import type { Lexical } from "../content/rich";

export async function getPolicies(payload: Payload) {
  const g = (await payload.findGlobal({ slug: "platform-settings", overrideAccess: true }).catch(() => null)) as Partial<typeof PLATFORM_DEFAULTS> | null;
  return { ...PLATFORM_DEFAULTS, ...Object.fromEntries(Object.entries(g ?? {}).filter(([, v]) => v !== null && v !== undefined)) } as typeof PLATFORM_DEFAULTS & Record<string, unknown>;
}

/** The tutor's own profile, created as a draft on first visit. */
export async function ownTutorProfile(payload: Payload, user: User): Promise<TutorProfile> {
  // Filtered by the signed-in tutor's own id, so overriding field access here is safe.
  const found = await payload.find({ collection: "tutor-profiles", where: { user: { equals: user.id } }, limit: 1, depth: 1, overrideAccess: true });
  if (found.docs[0]) return found.docs[0];
  let created;
  try {
    created = await payload.create({ collection: "tutor-profiles", data: { user: user.id, status: "draft" } as never, user, overrideAccess: false });
  } catch (err) {
    const again = await payload.find({ collection: "tutor-profiles", where: { user: { equals: user.id } }, limit: 1, depth: 1, overrideAccess: true });
    if (again.docs[0]) return again.docs[0];
    throw err;
  }
  return (await payload.findByID({ collection: "tutor-profiles", id: created.id, depth: 1, overrideAccess: true })) as TutorProfile;
}

const idOf = (v: unknown) => (v && typeof v === "object" ? (v as { id: unknown }).id : v);

/** Application as the form needs it: ids for relations, file names for documents. */
export function serializeApplication(p: TutorProfile) {
  const file = (f: unknown) => (f && typeof f === "object" ? { id: (f as { id: number }).id, filename: (f as { filename?: string }).filename ?? "document", url: (f as { url?: string }).url ?? null } : f ? { id: f as number, filename: "document", url: null } : null);
  return {
    id: p.id,
    status: p.status,
    slug: p.slug,
    displayName: p.displayName,
    headline: p.headline ?? "",
    about: (p.about as Lexical | null) ?? null,
    teachingStyle: (p.teachingStyle as Lexical | null) ?? null,
    introVideoUrl: p.introVideoUrl ?? "",
    languages: (p.languages ?? []).map((l) => ({ language: idOf(l.language) as number, level: l.level })),
    primarySubject: (idOf(p.primarySubject) as number) ?? null,
    subjects: (p.subjects ?? []).map((s) => idOf(s) as number),
    levelsTaught: p.levelsTaught ?? [],
    hourlyRate: p.hourlyRate ?? null,
    offersTrial: p.offersTrial ?? true,
    instantBooking: p.instantBooking ?? true,
    noticeHours: p.noticeHours ?? 12,
    education: (p.education ?? []).map((e) => ({ degree: e.degree, institution: e.institution, field: e.field ?? "", startYear: e.startYear ?? null, endYear: e.endYear ?? null, document: file(e.document), verified: Boolean(e.verified) })),
    certifications: (p.certifications ?? []).map((c) => ({ title: c.title, issuer: c.issuer, year: c.year ?? null, credentialId: c.credentialId ?? "", document: file(c.document), verified: Boolean(c.verified) })),
    experience: (p.experience ?? []).map((x) => ({ role: x.role, organization: x.organization, startYear: x.startYear ?? null, endYear: x.endYear ?? null, description: (x.description as Lexical | null) ?? null })),
    identity: { documentType: p.identity?.documentType ?? null, document: file(p.identity?.document), verified: Boolean(p.identity?.verified) },
    reviewNotes: p.reviewNotes ?? "",
    submittedAt: p.submittedAt ?? null,
  };
}
export type ApplicationData = ReturnType<typeof serializeApplication>;

export const checkApplication = (p: TutorProfile, user: User) => {
  const reqs = requirements({ ...p, subjects: p.subjects as unknown[] } as never, { hasPhoto: Boolean(user.avatar) });
  return { requirements: reqs, missing: missingRequired(reqs) };
};
