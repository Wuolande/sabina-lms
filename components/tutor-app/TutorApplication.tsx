"use client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, ArrowLeft, ArrowRight, BadgeCheck, BookOpen, Camera, CheckCircle2, Circle, Clock, ExternalLink, FileText, GraduationCap, IdCard, Loader2, Plus,
  Send, Sparkles, Trash2, Upload, UserRound, Video, X, type LucideIcon,
} from "lucide-react";
import { Alert, TextInput } from "@/components/auth/fields";
import { Card, Chips, Select, TextArea, Toggle, controlCls } from "@/components/portal/form";
import { UserAvatar, usePortalUser } from "@/components/portal/PortalShell";
import { ABOUT_MIN, HEADLINE_MIN, VIDEO_RE, type Requirement, type SectionKey } from "@/cms/tutors/completeness";
import { videoEmbedUrl } from "@/lib/video";

/* ------------------------------------------------------------------ types */

type Doc = { id: number; filename: string; url: string | null } | null;
type Edu = { degree: string; institution: string; field: string; startYear: number | null; endYear: number | null; document: Doc; verified?: boolean };
type Cert = { title: string; issuer: string; year: number | null; credentialId: string; document: Doc; verified?: boolean };
type Exp = { role: string; organization: string; startYear: number | null; endYear: number | null; description: string };
type App = {
  id: number;
  status: "draft" | "submitted" | "changes_requested" | "approved" | "rejected" | "suspended";
  slug: string | null;
  displayName: string | null;
  headline: string;
  about: string;
  teachingStyle: string;
  introVideoUrl: string;
  languages: { language: number; level: string }[];
  primarySubject: number | null;
  subjects: number[];
  levelsTaught: string[];
  hourlyRate: number | null;
  offersTrial: boolean;
  instantBooking: boolean;
  noticeHours: number;
  education: Edu[];
  certifications: Cert[];
  experience: Exp[];
  identity: { documentType: string | null; document: Doc; verified?: boolean };
  reviewNotes: string;
  submittedAt: string | null;
};
type Options = {
  subjects: { id: number; name: string; category: string }[];
  languages: { id: number; name: string }[];
  policies: { currency: string; platformFeePercent: number; tutorMinHourlyRate: number; tutorMaxHourlyRate: number; trialLessonMinutes: number; trialLessonDiscountPercent: number; maxSubjectsPerTutor: number };
};
type Payload = { application: App; requirements: Requirement[]; missing: Requirement[]; options?: Options };

const SECTIONS: { key: SectionKey | "review"; title: string; sub: string; icon: LucideIcon }[] = [
  { key: "about", title: "Photo & details", sub: "How students see you", icon: UserRound },
  { key: "profile", title: "Teaching profile", sub: "Headline, bio, languages", icon: BookOpen },
  { key: "subjects", title: "Subjects & pricing", sub: "What you teach and your rate", icon: Sparkles },
  { key: "background", title: "Education & experience", sub: "Qualifications and roles", icon: GraduationCap },
  { key: "identity", title: "Identity check", sub: "Kept private", icon: IdCard },
  { key: "video", title: "Intro video", sub: "Recommended", icon: Video },
  { key: "review", title: "Review & submit", sub: "Send for approval", icon: Send },
];

const LEVELS = [
  { value: "primary", label: "Primary school" },
  { value: "secondary", label: "Secondary / high school" },
  { value: "university", label: "University" },
  { value: "adult", label: "Adults & professionals" },
  { value: "exam", label: "Exam preparation" },
];
const LANG_LEVELS = [
  { value: "native", label: "Native" },
  { value: "c2", label: "Fluent (C2)" },
  { value: "c1", label: "Advanced (C1)" },
  { value: "b2", label: "Upper intermediate (B2)" },
  { value: "b1", label: "Intermediate (B1)" },
  { value: "a2", label: "Basic (A1-A2)" },
];
const ID_TYPES = [
  { value: "national_id", label: "National ID" },
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driving licence" },
];

const money = (n: number, currency: string) => new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);

/* ------------------------------------------------------------- helpers */

async function api<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; data: T & { error?: string } }> {
  try {
    const res = await fetch(url, { credentials: "include", ...init });
    const data = (await res.json().catch(() => ({}))) as T & { error?: string };
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: { error: "Couldn't reach Sabina. Check your connection." } as T & { error?: string } };
  }
}

function DocUpload({ kind, value, onChange, disabled, label = "Upload document" }: { kind: string; value: Doc; onChange: (d: Doc) => void; disabled?: boolean; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function upload(file: File) {
    setBusy(true);
    setErr("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", kind);
    const { ok, data } = await api<{ id: number; filename: string; url: string | null }>("/api/tutor/documents", { method: "POST", body: fd });
    setBusy(false);
    if (ok) onChange({ id: data.id, filename: data.filename, url: data.url });
    else setErr(data.error ?? "Upload failed.");
  }
  return (
    <div className="space-y-1.5">
      <input ref={ref} type="file" accept="application/pdf,image/jpeg,image/png,image/webp,image/heic" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      {value ? (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-3.5 py-2.5 ring-1 ring-emerald-200">
          <FileText size={18} className="shrink-0 text-emerald-700" />
          {value.url ? (
            <a href={value.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-sm font-medium text-emerald-900 underline-offset-2 hover:underline">
              {value.filename}
            </a>
          ) : (
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-emerald-900">{value.filename}</span>
          )}
          {!disabled && (
            <button type="button" onClick={() => onChange(null)} className="grid h-8 w-8 place-items-center rounded-lg text-emerald-800 hover:bg-emerald-100" aria-label="Remove document">
              <X size={16} />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => ref.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-brand-300 hover:bg-brand-50/40 hover:text-brand-700 disabled:opacity-60"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {busy ? "Uploading…" : label}
          <span className="font-normal text-slate-400">PDF or photo, max 10 MB</span>
        </button>
      )}
      {err && <p className="text-[13px] text-red-600">{err}</p>}
    </div>
  );
}

function RowCard({ children, onRemove, disabled, verified }: { children: ReactNode; onRemove: () => void; disabled?: boolean; verified?: boolean }) {
  return (
    <div className="relative space-y-4 rounded-2xl bg-slate-50/70 p-4 ring-1 ring-slate-200/70 sm:p-5">
      <div className="absolute right-3 top-3 flex items-center gap-2">
        {verified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
            <BadgeCheck size={13} /> Verified
          </span>
        )}
        {!disabled && (
          <button type="button" onClick={onRemove} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-white hover:text-red-600" aria-label="Remove">
            <Trash2 size={17} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function SectionHead({ icon: Icon, title, sub }: { icon: LucideIcon; title: string; sub: string }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700">
        <Icon size={22} />
      </span>
      <div>
        <h2 className="font-heading text-xl font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{sub}</p>
      </div>
    </div>
  );
}

const yearNum = (v: string) => (v.trim() === "" ? null : Number(v.replace(/\D/g, "").slice(0, 4)) || null);

/* ------------------------------------------------------------ status banner */

function StatusBanner({ app }: { app: App }) {
  const live = app.status === "approved";
  const map: Record<App["status"], { tone: string; icon: LucideIcon; title: string; body: ReactNode }> = {
    draft: { tone: "bg-brand-50 ring-brand-200 text-brand-950", icon: Sparkles, title: "Complete your tutor application", body: "Fill in each section, then submit. Our team reviews applications within 48 hours." },
    submitted: { tone: "bg-amber-50 ring-amber-200 text-amber-950", icon: Clock, title: "Application under review", body: "Thanks! We're checking your details and documents. We'll email you as soon as there's a decision. Your application is locked while we review it." },
    changes_requested: { tone: "bg-orange-50 ring-orange-200 text-orange-950", icon: AlertTriangle, title: "A few changes are needed", body: app.reviewNotes || "Please review your application and submit again." },
    approved: { tone: "bg-emerald-50 ring-emerald-200 text-emerald-950", icon: BadgeCheck, title: "Your profile is live", body: "Students can find and book you. Changes you save here appear on your public profile straight away." },
    rejected: { tone: "bg-red-50 ring-red-200 text-red-950", icon: AlertTriangle, title: "Application not approved", body: app.reviewNotes || "Unfortunately we couldn't approve your application. Contact support if you have questions." },
    suspended: { tone: "bg-red-50 ring-red-200 text-red-950", icon: AlertTriangle, title: "Profile suspended", body: app.reviewNotes || "Your profile is hidden from students. Please contact support." },
  };
  const m = map[app.status];
  const Icon = m.icon;
  return (
    <div className={`flex flex-col gap-4 rounded-3xl p-5 ring-1 sm:flex-row sm:items-center sm:p-6 ${m.tone}`}>
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/70">
        <Icon size={24} />
      </span>
      <div className="min-w-0 flex-1">
        <h1 className="font-heading text-lg font-bold">{m.title}</h1>
        <p className="mt-0.5 whitespace-pre-line text-sm opacity-80">{m.body}</p>
      </div>
      {live && app.slug && (
        <Link href={`/tutors/${app.slug}`} target="_blank" className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-200 hover:bg-emerald-100">
          View public profile <ExternalLink size={15} />
        </Link>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ main */

export function TutorApplication() {
  const user = usePortalUser();
  const router = useRouter();
  const [state, setState] = useState<Payload | null>(null);
  const [options, setOptions] = useState<Options | null>(null);
  const [draft, setDraft] = useState<App | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [step, setStep] = useState<(typeof SECTIONS)[number]["key"]>("about");
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [avatar, setAvatar] = useState(user.avatarUrl);
  const [photoBusy, setPhotoBusy] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<Payload>("/api/tutor/application").then(({ ok, data }) => {
      if (!ok) return setLoadErr(data.error ?? "Couldn't load your application.");
      setState(data);
      setOptions(data.options ?? null);
      setDraft(data.application);
      // Open the first incomplete section.
      const first = SECTIONS.find((s) => data.missing.some((m) => m.section === s.key));
      if (data.application.status === "draft" && first) setStep(first.key);
    });
  }, []);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 3500);
    return () => clearTimeout(t);
  }, [flash]);

  const locked = !draft || ["submitted", "rejected", "suspended"].includes(draft.status);
  const reqs = state?.requirements ?? [];
  const sectionDone = (key: string) => {
    const r = reqs.filter((x) => x.section === key);
    return r.length > 0 && r.every((x) => x.ok);
  };
  const missing = state?.missing ?? [];
  const doneCount = SECTIONS.filter((s) => s.key !== "review" && sectionDone(s.key)).length;
  const idx = SECTIONS.findIndex((s) => s.key === step);

  const set = <K extends keyof App>(k: K, v: App[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));
  const go = (k: (typeof SECTIONS)[number]["key"]) => {
    setStep(k);
    requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  /** Fields each section saves. */
  function bodyFor(key: string): Record<string, unknown> {
    if (!draft) return {};
    switch (key) {
      case "profile":
        return { headline: draft.headline, about: draft.about, teachingStyle: draft.teachingStyle, languages: draft.languages };
      case "subjects":
        return { primarySubject: draft.primarySubject, subjects: draft.subjects, levelsTaught: draft.levelsTaught, hourlyRate: draft.hourlyRate, offersTrial: draft.offersTrial, instantBooking: draft.instantBooking, noticeHours: draft.noticeHours };
      case "background":
        return { education: draft.education, certifications: draft.certifications, experience: draft.experience };
      case "identity":
        return { identity: draft.identity };
      case "video":
        return { introVideoUrl: draft.introVideoUrl };
      default:
        return {};
    }
  }

  async function save(andNext = true) {
    if (!draft || locked) return;
    const body = bodyFor(step);
    if (Object.keys(body).length) {
      setSaving(true);
      const { ok, data } = await api<Payload>("/api/tutor/application", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      setSaving(false);
      if (!ok) return setFlash({ tone: "error", text: data.error ?? "Couldn't save." });
      setState(data);
      setDraft(data.application);
      setFlash({ tone: "success", text: "Saved" });
    }
    if (andNext && idx < SECTIONS.length - 1) go(SECTIONS[idx + 1]!.key);
  }

  async function submit() {
    setSaving(true);
    const { ok, data } = await api<Payload & { missing?: string[] }>("/api/tutor/application/submit", { method: "POST" });
    setSaving(false);
    if (!ok) return setFlash({ tone: "error", text: data.error ?? "Couldn't submit." });
    setState(data as Payload);
    setDraft((data as Payload).application);
    go("review");
    router.refresh();
  }

  async function uploadPhoto(file: File) {
    setPhotoBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    const { ok, data } = await api<{ avatarUrl: string }>("/api/account/avatar", { method: "POST", body: fd });
    setPhotoBusy(false);
    if (!ok) return setFlash({ tone: "error", text: data.error ?? "Couldn't upload that photo." });
    setAvatar(data.avatarUrl);
    // Refresh the checklist (photo requirement).
    const fresh = await api<Payload>("/api/tutor/application");
    if (fresh.ok) setState(fresh.data);
    router.refresh();
  }

  const subjectsByCat = useMemo(() => {
    const m = new Map<string, { id: number; name: string }[]>();
    for (const s of options?.subjects ?? []) m.set(s.category, [...(m.get(s.category) ?? []), s]);
    return m;
  }, [options]);

  if (loadErr) return <Alert>{loadErr}</Alert>;
  if (!draft || !options || !state)
    return (
      <div className="grid place-items-center py-24 text-slate-500" role="status">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );

  const p = options.policies;
  const earn = draft.hourlyRate ? draft.hourlyRate * (1 - p.platformFeePercent / 100) : 0;
  const trialPrice = draft.hourlyRate ? (draft.hourlyRate * p.trialLessonMinutes) / 60 * (1 - p.trialLessonDiscountPercent / 100) : 0;
  const embed = videoEmbedUrl(draft.introVideoUrl);
  const videoInvalid = Boolean(draft.introVideoUrl && !VIDEO_RE.test(draft.introVideoUrl));
  const isLive = draft.status === "approved";

  return (
    <div className="scroll-mt-24 space-y-6" ref={top}>
      <StatusBanner app={draft} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Steps: vertical on desktop, horizontal scroll on phones */}
        <nav aria-label="Application sections" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="hidden rounded-3xl bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70 lg:block">
            <div className="px-3 pb-3 pt-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Progress</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all" style={{ width: `${(doneCount / (SECTIONS.length - 1)) * 100}%` }} />
                </div>
                <span className="text-sm font-semibold text-slate-700">
                  {doneCount}/{SECTIONS.length - 1}
                </span>
              </div>
            </div>
            <ol className="space-y-1">
              {SECTIONS.map((s) => {
                const on = s.key === step;
                const done = s.key !== "review" && sectionDone(s.key);
                return (
                  <li key={s.key}>
                    <button
                      type="button"
                      onClick={() => go(s.key)}
                      aria-current={on ? "step" : undefined}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${on ? "bg-brand-50 ring-1 ring-brand-200" : "hover:bg-slate-50"}`}
                    >
                      {done ? <CheckCircle2 size={20} className="shrink-0 text-emerald-500" /> : <Circle size={20} className={`shrink-0 ${on ? "text-brand-600" : "text-slate-300"}`} />}
                      <span className="min-w-0">
                        <b className={`block truncate text-sm ${on ? "text-brand-900" : "text-slate-800"}`}>{s.title}</b>
                        <span className="block truncate text-xs text-slate-500">{s.sub}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
            {SECTIONS.map((s, i) => {
              const on = s.key === step;
              const done = s.key !== "review" && sectionDone(s.key);
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => go(s.key)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold ring-1 ${on ? "bg-brand-700 text-white ring-brand-700" : done ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-white text-slate-600 ring-slate-200"}`}
                >
                  {done ? <CheckCircle2 size={15} /> : <span className="text-xs opacity-70">{i + 1}</span>}
                  {s.title}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="min-w-0 space-y-4">
          <Card>
            {step === "about" && (
              <>
                <SectionHead icon={UserRound} title="Photo & details" sub="A friendly, clear photo makes students far more likely to book." />
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                  <UserAvatar user={{ ...user, avatarUrl: avatar }} size={112} />
                  <div className="space-y-3">
                    <ul className="space-y-1 text-sm text-slate-600">
                      <li>• Face the camera, head and shoulders, good light</li>
                      <li>• Just you, no sunglasses or logos</li>
                    </ul>
                    <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="hidden" onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
                    <button type="button" disabled={photoBusy} onClick={() => photoRef.current?.click()} className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                      {photoBusy ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />} {avatar ? "Change photo" : "Upload photo"}
                    </button>
                  </div>
                </div>
                <dl className="mt-8 grid gap-4 rounded-2xl bg-slate-50 p-4 text-sm ring-1 ring-slate-200/60 sm:grid-cols-3">
                  <div>
                    <dt className="text-slate-500">Public name</dt>
                    <dd className="font-semibold text-slate-900">{draft.displayName ?? user.name}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Country</dt>
                    <dd className="font-semibold text-slate-900">{user.country || "Not set"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Time zone</dt>
                    <dd className="font-semibold text-slate-900">{user.timezone.replace(/_/g, " ")}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-sm text-slate-500">
                  Change your name, country or time zone in{" "}
                  <Link href="/tutor/settings" className="font-semibold text-brand-700 hover:underline">
                    account settings
                  </Link>
                  . Students only see your first name and last initial.
                </p>
              </>
            )}

            {step === "profile" && (
              <div className="space-y-5">
                <SectionHead icon={BookOpen} title="Teaching profile" sub="This is what students read before booking you." />
                <TextInput label="Headline" maxLength={90} disabled={locked} value={draft.headline} onChange={(e) => set("headline", e.target.value)} placeholder="e.g. Patient KCSE Maths tutor with 8 years' experience" hint={`Keep it to one line (${HEADLINE_MIN}-90 characters).`} />
                <TextArea label="About you" rows={6} maxLength={2000} minHint={ABOUT_MIN} disabled={locked} value={draft.about} onChange={(e) => set("about", e.target.value)} placeholder="Who you are, your background, and why you love teaching." hint="Write in the first person." />
                <TextArea label="Your teaching style (optional)" rows={4} maxLength={1500} disabled={locked} value={draft.teachingStyle} onChange={(e) => set("teachingStyle", e.target.value)} placeholder="What does a typical lesson with you look like? How do you adapt to each student?" />
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-800">Languages you speak</p>
                  {draft.languages.map((l, i) => (
                    <div key={i} className="flex gap-2">
                      <select aria-label="Language" disabled={locked} className={`${controlCls} h-12 flex-1`} value={l.language || ""} onChange={(e) => set("languages", draft.languages.map((x, j) => (j === i ? { ...x, language: Number(e.target.value) } : x)))}>
                        <option value="">Choose a language</option>
                        {options.languages.map((o) => (
                          <option key={o.id} value={o.id} disabled={draft.languages.some((x, j) => j !== i && x.language === o.id)}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                      <select aria-label="Level" disabled={locked} className={`${controlCls} h-12 w-44 sm:w-56`} value={l.level} onChange={(e) => set("languages", draft.languages.map((x, j) => (j === i ? { ...x, level: e.target.value } : x)))}>
                        {LANG_LEVELS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      {!locked && (
                        <button type="button" onClick={() => set("languages", draft.languages.filter((_, j) => j !== i))} className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-red-600" aria-label="Remove language">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                  {!locked && draft.languages.length < 8 && (
                    <button type="button" onClick={() => set("languages", [...draft.languages, { language: 0, level: draft.languages.length ? "c1" : "native" }])} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
                      <Plus size={16} /> Add a language
                    </button>
                  )}
                </div>
              </div>
            )}

            {step === "subjects" && (
              <div className="space-y-6">
                <SectionHead icon={Sparkles} title="Subjects & pricing" sub={`Choose up to ${p.maxSubjectsPerTutor} subjects and set your hourly rate.`} />
                <Select
                  label="Main subject"
                  disabled={locked}
                  value={draft.primarySubject ?? ""}
                  onChange={(e) => {
                    const v = e.target.value ? Number(e.target.value) : null;
                    setDraft((d) => (d ? { ...d, primarySubject: v, subjects: v && !d.subjects.includes(v) ? [v, ...d.subjects].slice(0, p.maxSubjectsPerTutor) : d.subjects } : d));
                  }}
                  hint="Students searching this subject see you first."
                >
                  <option value="">Choose your main subject</option>
                  {[...subjectsByCat.entries()].map(([cat, list]) => (
                    <optgroup key={cat} label={cat.replace("-", " ").replace(/^\w/, (c) => c.toUpperCase())}>
                      {list.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </Select>
                <Chips
                  label="Other subjects you teach"
                  disabled={locked}
                  max={p.maxSubjectsPerTutor}
                  options={options.subjects.map((s) => ({ value: s.id, label: s.name }))}
                  value={draft.subjects}
                  onChange={(v) => setDraft((d) => (d ? { ...d, subjects: d.primarySubject && !v.includes(d.primarySubject) ? [d.primarySubject, ...v] : v } : d))}
                  hint={`${draft.subjects.length}/${p.maxSubjectsPerTutor} chosen. Your main subject is always included.`}
                />
                <Chips label="Levels you teach" disabled={locked} options={LEVELS} value={draft.levelsTaught} onChange={(v) => set("levelsTaught", v)} />

                <div className="grid gap-4 rounded-2xl bg-gradient-to-br from-brand-50 to-white p-5 ring-1 ring-brand-100 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <TextInput
                    label={`Hourly rate (${p.currency})`}
                    type="number"
                    inputMode="decimal"
                    min={p.tutorMinHourlyRate}
                    max={p.tutorMaxHourlyRate}
                    disabled={locked}
                    value={draft.hourlyRate ?? ""}
                    onChange={(e) => set("hourlyRate", e.target.value === "" ? null : Number(e.target.value))}
                    hint={`Between ${money(p.tutorMinHourlyRate, p.currency)} and ${money(p.tutorMaxHourlyRate, p.currency)} per 60-minute lesson.`}
                  />
                  <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200/70">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">You earn per hour</p>
                    <p className="mt-1 font-heading text-3xl font-bold text-slate-900">{draft.hourlyRate ? money(earn, p.currency) : "—"}</p>
                    <p className="mt-1 text-xs text-slate-500">After Sabina&apos;s {p.platformFeePercent}% fee, which covers payments, the classroom and marketing.</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Toggle
                    label="Offer a trial lesson"
                    sub={draft.hourlyRate ? `${p.trialLessonMinutes} min for ${money(trialPrice, p.currency)} (${p.trialLessonDiscountPercent}% off). Trials win more students.` : `${p.trialLessonMinutes}-minute discounted first lesson.`}
                    checked={draft.offersTrial}
                    onChange={(v) => set("offersTrial", v)}
                    disabled={locked}
                  />
                  <Toggle label="Instant booking" sub="Students book open slots without waiting for you to accept." checked={draft.instantBooking} onChange={(v) => set("instantBooking", v)} disabled={locked} />
                </div>
                <Select label="Minimum notice before a lesson" disabled={locked} value={draft.noticeHours} onChange={(e) => set("noticeHours", Number(e.target.value))}>
                  {[2, 6, 12, 24, 48].map((h) => (
                    <option key={h} value={h}>
                      {h} hours
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {step === "background" && (
              <div className="space-y-8">
                <SectionHead icon={GraduationCap} title="Education & experience" sub="Add at least one qualification or certificate. Upload a copy so we can verify it; only our review team sees documents." />

                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900">Education</h3>
                  {draft.education.map((e, i) => {
                    const up = (patch: Partial<Edu>) => set("education", draft.education.map((x, j) => (j === i ? { ...x, ...patch } : x)));
                    return (
                      <RowCard key={i} disabled={locked} verified={e.verified} onRemove={() => set("education", draft.education.filter((_, j) => j !== i))}>
                        <div className="grid gap-4 pr-10 sm:grid-cols-2">
                          <TextInput label="Degree or diploma" disabled={locked} value={e.degree} onChange={(ev) => up({ degree: ev.target.value })} placeholder="BEd Mathematics" />
                          <TextInput label="Institution" disabled={locked} value={e.institution} onChange={(ev) => up({ institution: ev.target.value })} placeholder="Kenyatta University" />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
                          <TextInput label="Field of study" disabled={locked} value={e.field} onChange={(ev) => up({ field: ev.target.value })} />
                          <TextInput label="Start year" inputMode="numeric" disabled={locked} value={e.startYear ?? ""} onChange={(ev) => up({ startYear: yearNum(ev.target.value) })} />
                          <TextInput label="End year" inputMode="numeric" disabled={locked} value={e.endYear ?? ""} onChange={(ev) => up({ endYear: yearNum(ev.target.value) })} />
                        </div>
                        <DocUpload kind="degree" disabled={locked} value={e.document} onChange={(d) => up({ document: d })} label="Upload certificate or transcript" />
                      </RowCard>
                    );
                  })}
                  {!locked && (
                    <button type="button" onClick={() => set("education", [...draft.education, { degree: "", institution: "", field: "", startYear: null, endYear: null, document: null }])} className="inline-flex items-center gap-1.5 rounded-xl px-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
                      <Plus size={16} /> Add education
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900">Teaching certificates</h3>
                  {draft.certifications.map((c, i) => {
                    const up = (patch: Partial<Cert>) => set("certifications", draft.certifications.map((x, j) => (j === i ? { ...x, ...patch } : x)));
                    return (
                      <RowCard key={i} disabled={locked} verified={c.verified} onRemove={() => set("certifications", draft.certifications.filter((_, j) => j !== i))}>
                        <div className="grid gap-4 pr-10 sm:grid-cols-2">
                          <TextInput label="Certificate" disabled={locked} value={c.title} onChange={(ev) => up({ title: ev.target.value })} placeholder="TSC registration, TEFL, CELTA…" />
                          <TextInput label="Issued by" disabled={locked} value={c.issuer} onChange={(ev) => up({ issuer: ev.target.value })} />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <TextInput label="Year" inputMode="numeric" disabled={locked} value={c.year ?? ""} onChange={(ev) => up({ year: yearNum(ev.target.value) })} />
                          <TextInput label="Credential ID (optional)" disabled={locked} value={c.credentialId} onChange={(ev) => up({ credentialId: ev.target.value })} />
                        </div>
                        <DocUpload kind="certificate" disabled={locked} value={c.document} onChange={(d) => up({ document: d })} label="Upload certificate" />
                      </RowCard>
                    );
                  })}
                  {!locked && (
                    <button type="button" onClick={() => set("certifications", [...draft.certifications, { title: "", issuer: "", year: null, credentialId: "", document: null }])} className="inline-flex items-center gap-1.5 rounded-xl px-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
                      <Plus size={16} /> Add certificate
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900">Work experience (optional)</h3>
                  {draft.experience.map((x, i) => {
                    const up = (patch: Partial<Exp>) => set("experience", draft.experience.map((y, j) => (j === i ? { ...y, ...patch } : y)));
                    return (
                      <RowCard key={i} disabled={locked} onRemove={() => set("experience", draft.experience.filter((_, j) => j !== i))}>
                        <div className="grid gap-4 pr-10 sm:grid-cols-2">
                          <TextInput label="Role" disabled={locked} value={x.role} onChange={(ev) => up({ role: ev.target.value })} placeholder="Mathematics teacher" />
                          <TextInput label="Organisation" disabled={locked} value={x.organization} onChange={(ev) => up({ organization: ev.target.value })} />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <TextInput label="Start year" inputMode="numeric" disabled={locked} value={x.startYear ?? ""} onChange={(ev) => up({ startYear: yearNum(ev.target.value) })} />
                          <TextInput label="End year" inputMode="numeric" disabled={locked} value={x.endYear ?? ""} onChange={(ev) => up({ endYear: yearNum(ev.target.value) })} placeholder="Leave empty if current" />
                        </div>
                        <TextArea label="What you did (optional)" rows={3} maxLength={500} disabled={locked} value={x.description} onChange={(ev) => up({ description: ev.target.value })} />
                      </RowCard>
                    );
                  })}
                  {!locked && (
                    <button type="button" onClick={() => set("experience", [...draft.experience, { role: "", organization: "", startYear: null, endYear: null, description: "" }])} className="inline-flex items-center gap-1.5 rounded-xl px-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
                      <Plus size={16} /> Add a role
                    </button>
                  )}
                </div>
              </div>
            )}

            {step === "identity" && (
              <div className="space-y-6">
                <SectionHead icon={IdCard} title="Identity check" sub="We verify every tutor to keep students safe. Your document is encrypted, never shown publicly and only seen by our review team." />
                <fieldset className="space-y-2" disabled={locked}>
                  <legend className="text-sm font-semibold text-slate-800">Document type</legend>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {ID_TYPES.map((t) => (
                      <label key={t.value} className={`flex cursor-pointer items-center gap-2.5 rounded-xl p-3.5 text-sm font-semibold ring-1 transition ${draft.identity.documentType === t.value ? "bg-brand-50 text-brand-900 ring-brand-300" : "bg-white text-slate-700 ring-slate-200 hover:ring-slate-300"}`}>
                        <input type="radio" name="idtype" className="h-4 w-4 accent-brand-700" checked={draft.identity.documentType === t.value} onChange={() => set("identity", { ...draft.identity, documentType: t.value })} />
                        {t.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <DocUpload kind="identity" disabled={locked} value={draft.identity.document} onChange={(d) => set("identity", { ...draft.identity, document: d })} label="Upload a clear photo or scan" />
                {draft.identity.verified && (
                  <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                    <BadgeCheck size={16} /> Identity verified
                  </p>
                )}
              </div>
            )}

            {step === "video" && (
              <div className="space-y-5">
                <SectionHead icon={Video} title="Intro video" sub="Tutors with a video get far more bookings. Record 1-2 minutes: say hello, introduce your subject and how you teach." />
                <TextInput
                  label="Video link"
                  type="url"
                  disabled={locked}
                  value={draft.introVideoUrl}
                  onChange={(e) => set("introVideoUrl", e.target.value.trim())}
                  placeholder="https://youtu.be/…"
                  error={videoInvalid ? "Use a YouTube, Vimeo or Cloudflare Stream link." : null}
                  hint="Upload to YouTube as “Unlisted” and paste the link here. Direct uploads are coming soon."
                />
                {embed && !videoInvalid && (
                  <div className="aspect-video overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-slate-200">
                    <iframe src={embed} title="Intro video preview" className="h-full w-full" allow="encrypted-media; picture-in-picture" allowFullScreen />
                  </div>
                )}
              </div>
            )}

            {step === "review" && (
              <div className="space-y-6">
                <SectionHead icon={Send} title={isLive ? "Your profile" : "Review & submit"} sub={isLive ? "Everything below is live on your public profile." : "Check everything is complete, then send your application for review."} />
                <ul className="divide-y divide-slate-100 rounded-2xl ring-1 ring-slate-200/70">
                  {reqs.map((r) => (
                    <li key={r.key} className="flex items-center gap-3 px-4 py-3">
                      {r.ok ? <CheckCircle2 size={20} className="shrink-0 text-emerald-500" /> : <Circle size={20} className={`shrink-0 ${r.optional ? "text-slate-300" : "text-amber-500"}`} />}
                      <span className={`flex-1 text-sm ${r.ok ? "text-slate-600" : "font-semibold text-slate-900"}`}>{r.label}</span>
                      {!r.ok && !locked && (
                        <button type="button" onClick={() => go(r.section)} className="text-sm font-semibold text-brand-700 hover:underline">
                          Add
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {(draft.status === "draft" || draft.status === "changes_requested") && (
                  <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-600">{missing.length ? `${missing.length} required item${missing.length > 1 ? "s" : ""} left before you can submit.` : "Everything's ready. We'll review within 48 hours."}</p>
                    <button
                      type="button"
                      onClick={submit}
                      disabled={saving || missing.length > 0}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 font-semibold text-white shadow-[0_8px_24px_-8px_rgba(20,32,156,0.55)] hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                    >
                      {saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      {draft.status === "changes_requested" ? "Submit again" : "Submit application"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Footer navigation */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => idx > 0 && go(SECTIONS[idx - 1]!.key)}
              disabled={idx === 0}
              className="inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-white disabled:invisible"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <div className="flex items-center gap-3">
              {flash && (
                <span role="status" className={`text-sm font-semibold ${flash.tone === "success" ? "text-emerald-700" : "text-red-600"}`}>
                  {flash.tone === "success" ? "✓ " : ""}
                  {flash.text}
                </span>
              )}
              {step !== "review" &&
                (locked ? (
                  <button type="button" onClick={() => go(SECTIONS[idx + 1]!.key)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50">
                    Next <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => save(true)}
                    disabled={saving || (step === "video" && videoInvalid)}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
                  >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    {isLive ? "Save changes" : step === "about" ? "Continue" : "Save & continue"} {!saving && <ArrowRight size={16} />}
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
