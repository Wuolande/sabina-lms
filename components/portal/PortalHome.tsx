"use client";
import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, Circle, Clock, GraduationCap, Search, Star, Users, Wallet, BookOpen, type LucideIcon } from "lucide-react";
import { usePortalUser } from "./PortalShell";
import { PHASE_NAMES } from "./nav";
import type { PortalUser } from "./types";
import type { LessonView } from "@/cms/scheduling/server";
import { fmtDay, fmtRange } from "@/lib/time";
import { money } from "@/lib/money";

export type HomeData = { tz: string; upcoming: LessonView[]; upcomingCount: number; hours: number; people: number; requests: number; hasHours: boolean; booked: boolean; earned: number | null; currency: string };

function UpcomingPanel({ data, role }: { data: HomeData; role: "student" | "tutor" }) {
  const href = role === "tutor" ? "/tutor/lessons" : "/student/lessons";
  return (
    <section className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold text-slate-900">Next lessons</h2>
        <Link href={href} className="text-sm font-semibold text-brand-700 hover:underline">
          See all
        </Link>
      </div>
      <ul className="mt-4 space-y-2.5">
        {data.upcoming.map((l) => (
          <li key={l.id}>
            <Link href={href} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 transition hover:bg-brand-50">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-center ring-1 ring-slate-200">
                <span className="block text-[10px] font-semibold uppercase leading-none text-brand-700">{fmtDay(l.startsAt, data.tz, { month: "short" })}</span>
                <span className="block font-heading text-lg font-bold leading-none text-slate-900">{fmtDay(l.startsAt, data.tz, { day: "numeric" })}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-900">
                  {l.kind === "trial" ? "Trial" : (l.subject ?? "Lesson")} · {l.other.name}
                </span>
                <span className="block text-sm text-slate-500">
                  {fmtDay(l.startsAt, data.tz, { weekday: "short" })}, {fmtRange(l.startsAt, l.endsAt, data.tz)}
                  {l.phase === "requested" ? (role === "tutor" ? " · needs reply" : " · awaiting tutor") : ""}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

type Step = { done: boolean; title: string; sub: string; href?: string; cta?: string; phase?: number };

function greeting(tz: string) {
  let h = new Date().getHours();
  try {
    h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: tz }).format(new Date()));
  } catch {
    /* invalid zone: use the device's */
  }
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

const profileDone = (u: PortalUser) => Boolean(u.phone && u.country && u.avatarUrl);

function Stat({ icon: Icon, label, value, note, tone }: { icon: LucideIcon; label: string; value: string; note: string; tone: "brand" | "accent" | "emerald" | "slate" }) {
  const chip = { brand: "bg-brand-50 text-brand-700", accent: "bg-accent-50 text-accent-700", emerald: "bg-emerald-50 text-emerald-700", slate: "bg-slate-100 text-slate-600" }[tone];
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70">
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${chip}`}>
        <Icon size={20} />
      </span>
      <p className="mt-4 text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-heading text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{note}</p>
    </div>
  );
}

function Checklist({ steps }: { steps: Step[] }) {
  const done = steps.filter((s) => s.done).length;
  return (
    <section className="rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70 sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg font-semibold text-slate-900">Get set up</h2>
          <p className="text-sm text-slate-500">
            {done} of {steps.length} done
          </p>
        </div>
        <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100" aria-hidden>
          <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all" style={{ width: `${(done / steps.length) * 100}%` }} />
        </div>
      </div>
      <ol className="mt-5 space-y-2">
        {steps.map((s) => (
          <li key={s.title} className={`flex items-center gap-4 rounded-2xl p-3.5 ${s.done ? "bg-slate-50/70" : "bg-white ring-1 ring-slate-200/80"}`}>
            {s.done ? <CheckCircle2 className="shrink-0 text-emerald-500" size={24} /> : <Circle className="shrink-0 text-slate-300" size={24} />}
            <div className="min-w-0 flex-1">
              <p className={`font-semibold ${s.done ? "text-slate-500 line-through decoration-slate-300" : "text-slate-900"}`}>{s.title}</p>
              <p className="text-sm text-slate-500">{s.sub}</p>
            </div>
            {!s.done && s.href && (
              <Link href={s.href} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100">
                {s.cta ?? "Start"} <ArrowRight size={14} />
              </Link>
            )}
            {!s.done && !s.href && s.phase && (
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500" title={PHASE_NAMES[s.phase]}>
                Opens soon
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

function EmptyPanel({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body: string; action?: { href: string; label: string } }) {
  return (
    <section className="flex flex-col items-center justify-center rounded-3xl bg-white p-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-700">
        <Icon size={26} />
      </span>
      <h2 className="mt-4 font-heading text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 max-w-xs text-sm text-slate-500">{body}</p>
      {action && (
        <Link href={action.href} className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800">
          {action.label} <ArrowRight size={15} />
        </Link>
      )}
    </section>
  );
}

function Hero({ user, line, cta }: { user: PortalUser; line: string; cta?: { href: string; label: string; icon: LucideIcon } }) {
  const Cta = cta?.icon;
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-7 text-white sm:p-9">
      <div aria-hidden className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-accent-400/25 blur-3xl" />
      <div aria-hidden className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-white/70" suppressHydrationWarning>{new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: user.timezone }).format(new Date())}</p>
          <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight sm:text-4xl" suppressHydrationWarning>
            {greeting(user.timezone)}, {user.firstName}
          </h1>
          <p className="mt-2 max-w-lg text-white/75">{line}</p>
        </div>
        {cta && Cta && (
          <Link href={cta.href} className="inline-flex h-12 shrink-0 items-center gap-2 self-start rounded-xl bg-accent-400 px-5 font-semibold text-brand-950 shadow-lg shadow-black/10 transition hover:bg-accent-300 sm:self-auto">
            <Cta size={18} /> {cta.label}
          </Link>
        )}
      </div>
    </section>
  );
}

export function StudentHome({ data }: { data: HomeData }) {
  const user = usePortalUser();
  const steps: Step[] = [
    { done: true, title: "Confirm your email", sub: "Your account is active." },
    { done: profileDone(user), title: "Complete your account", sub: "Add a photo, phone number and country.", href: "/student/settings", cta: "Complete" },
    { done: Boolean(user.goalsSet), title: "Set your learning goals", sub: "Get tutor recommendations that fit you.", href: "/student/profile", cta: "Set goals" },
    { done: data.booked, title: "Find your tutor", sub: "Browse verified tutors by subject and price.", href: data.booked ? undefined : "/find-tutors", cta: "Browse" },
    { done: data.booked, title: "Book your first lesson", sub: data.booked ? "Booked. See you in class!" : "Pick a time that suits you.", href: data.booked ? undefined : "/find-tutors", cta: "Book" },
  ];
  return (
    <div className="space-y-6">
      <Hero user={user} line="Ready to learn something new today? Your lessons, tutors and progress live here." cta={{ href: "/find-tutors", label: "Find a tutor", icon: Search }} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={CalendarDays} label="Upcoming lessons" value={String(data.upcomingCount)} note={data.upcomingCount ? "Booked and confirmed" : "Nothing booked yet"} tone="brand" />
        <Stat icon={Clock} label="Hours learned" value={String(Math.round(data.hours * 10) / 10)} note="Starts with your first lesson" tone="accent" />
        <Stat icon={Users} label="My tutors" value={String(data.people)} note="Tutors you've booked" tone="emerald" />
        <Stat icon={Star} label="Reviews given" value="0" note="Help others choose" tone="slate" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Checklist steps={steps} />
        {data.upcoming.length ? <UpcomingPanel data={data} role="student" /> : <EmptyPanel icon={BookOpen} title="No upcoming lessons" body="When you book a lesson it shows up here with a one-tap button to join the classroom." action={{ href: "/find-tutors", label: "Find a tutor" }} />}
      </div>
    </div>
  );
}

const APP_STEP: Record<string, { done: boolean; sub: string; cta?: string }> = {
  none: { done: false, sub: "Subjects, experience, ID and certificates.", cta: "Start" },
  draft: { done: false, sub: "Subjects, experience, ID and certificates.", cta: "Continue" },
  changes_requested: { done: false, sub: "Our team asked for a few changes.", cta: "Update" },
  submitted: { done: true, sub: "Submitted. We'll email you within 48 hours." },
  approved: { done: true, sub: "Approved." },
  rejected: { done: true, sub: "Not approved. Contact support with questions." },
  suspended: { done: true, sub: "Suspended. Contact support." },
};

export function TutorHome({ data }: { data: HomeData }) {
  const user = usePortalUser();
  const st = user.tutorStatus ?? "none";
  const app = APP_STEP[st] ?? APP_STEP.none!;
  const live = st === "approved";
  const steps: Step[] = [
    { done: true, title: "Confirm your email", sub: "Your account is active." },
    { done: profileDone(user), title: "Complete your account", sub: "Add a photo, phone number and country.", href: "/tutor/settings", cta: "Complete" },
    { done: app.done, title: "Submit your tutor application", sub: app.sub, href: app.done ? undefined : "/tutor/profile", cta: app.cta },
    { done: live, title: "Get verified and go live", sub: live ? "Your profile is live in the marketplace." : "We review applications within 48 hours." },
    { done: data.hasHours, title: "Set your availability", sub: data.hasHours ? "Your weekly hours are set." : "Choose the hours students can book.", href: data.hasHours ? undefined : "/tutor/availability", cta: "Set hours" },
  ];
  return (
    <div className="space-y-6">
      <Hero
        user={user}
        line={live ? "Your profile is live. Students can find you in the marketplace." : st === "submitted" ? "Your application is with our team. We'll email you as soon as it's reviewed." : "Welcome to Sabina. Finish your application and students will be able to find and book you."}
        cta={live && user.tutorSlug ? { href: `/tutors/${user.tutorSlug}`, label: "View my profile", icon: ArrowRight } : st === "none" || st === "draft" || st === "changes_requested" ? { href: "/tutor/profile", label: st === "changes_requested" ? "Update application" : "Continue application", icon: ArrowRight } : undefined}
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Wallet} label="Earned this month" value={data.earned != null ? money(data.earned, data.currency) : "—"} note="After the platform fee" tone="emerald" />
        <Stat icon={CalendarDays} label="Upcoming lessons" value={String(data.upcomingCount)} note={data.requests ? `${data.requests} request${data.requests > 1 ? "s" : ""} to answer` : data.upcomingCount ? "Confirmed lessons" : "Nothing booked yet"} tone="brand" />
        <Stat icon={Users} label="Active students" value={String(data.people)} note="Students who booked you" tone="accent" />
        <Stat icon={Star} label="Rating" value="—" note="After your first reviews" tone="slate" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Checklist steps={steps} />
        {data.upcoming.length ? <UpcomingPanel data={data} role="tutor" /> : <EmptyPanel icon={GraduationCap} title="Your teaching hub" body="Upcoming lessons, new booking requests and messages from students will appear here." action={data.hasHours ? undefined : { href: "/tutor/availability", label: "Set your hours" }} />}
      </div>
    </div>
  );
}
