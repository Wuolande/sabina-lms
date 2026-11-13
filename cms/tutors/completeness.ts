/**
 * What a tutor application needs before it can be submitted. Pure functions, shared by the
 * application form (live checklist) and the submit endpoint (enforcement).
 */
import { richLength } from "../content/rich";
export type ApplicationLike = {
  headline?: string | null;
  about?: unknown;
  languages?: unknown[] | null;
  primarySubject?: unknown;
  subjects?: unknown[] | null;
  levelsTaught?: unknown[] | null;
  hourlyRate?: number | null;
  education?: unknown[] | null;
  certifications?: unknown[] | null;
  identity?: { documentType?: string | null; document?: unknown } | null;
  introVideoUrl?: string | null;
};

export type Requirement = { key: string; label: string; section: SectionKey; ok: boolean; optional?: boolean };
export type SectionKey = "about" | "profile" | "subjects" | "background" | "identity" | "video";

export const ABOUT_MIN = 120;
export const HEADLINE_MIN = 10;

export const VIDEO_RE = /^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/|player\.vimeo\.com\/video\/|customer-[a-z0-9]+\.cloudflarestream\.com\/|iframe\.videodelivery\.net\/|watch\.cloudflarestream\.com\/)/i;

export function requirements(app: ApplicationLike, extra: { hasPhoto: boolean }): Requirement[] {
  const len = (s?: string | null) => (s ?? "").trim().length;
  return [
    { key: "photo", label: "Profile photo", section: "about", ok: extra.hasPhoto },
    { key: "headline", label: `Headline (${HEADLINE_MIN}+ characters)`, section: "profile", ok: len(app.headline) >= HEADLINE_MIN },
    { key: "about", label: `About you (${ABOUT_MIN}+ characters)`, section: "profile", ok: richLength(app.about) >= ABOUT_MIN },
    { key: "languages", label: "At least one language you speak", section: "profile", ok: (app.languages?.length ?? 0) > 0 },
    { key: "subjects", label: "Main subject", section: "subjects", ok: Boolean(app.primarySubject) || (app.subjects?.length ?? 0) > 0 },
    { key: "levels", label: "Levels you teach", section: "subjects", ok: (app.levelsTaught?.length ?? 0) > 0 },
    { key: "rate", label: "Hourly rate", section: "subjects", ok: typeof app.hourlyRate === "number" && app.hourlyRate > 0 },
    { key: "background", label: "A qualification or certificate", section: "background", ok: (app.education?.length ?? 0) + (app.certifications?.length ?? 0) > 0 },
    { key: "identity", label: "Identity document", section: "identity", ok: Boolean(app.identity?.documentType && app.identity?.document) },
    { key: "video", label: "Intro video (recommended)", section: "video", ok: Boolean(app.introVideoUrl && VIDEO_RE.test(app.introVideoUrl)), optional: true },
  ];
}

export const missingRequired = (reqs: Requirement[]) => reqs.filter((r) => !r.ok && !r.optional);
