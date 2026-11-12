import type { ReactNode } from "react";
import { SabinaLogo } from "@/components/brand/SabinaMark";

const QUOTES: Record<string, { quote: string; who: string; role: string }> = {
  student: { quote: "My tutor explains maths the way my brain actually works. My grades went from C to A in one term.", who: "Wanjiku M.", role: "Form 4 student" },
  tutor: { quote: "Sabina handles bookings, payments and the classroom. I just teach, and I'm paid on time every week.", who: "David O.", role: "Physics tutor" },
};

/**
 * Split-screen layout for sign-in and sign-up: the form on the left, a brand panel on the right
 * (hidden on phones, where the form takes the full width).
 */
export function AuthShell({ children, audience = "student", footer }: { children: ReactNode; audience?: "student" | "tutor"; footer?: ReactNode }) {
  const q = QUOTES[audience];
  return (
    <div className="min-h-dvh grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] bg-white">
      <div className="flex flex-col px-5 py-6 sm:px-10 lg:px-16">
        <header className="flex items-center justify-between">
          <SabinaLogo />
        </header>
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[420px]">{children}</div>
        </main>
        <footer className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
          {footer}
          <span>© {new Date().getFullYear()} Sabina Education</span>
          <a href="/privacy" className="hover:text-slate-700">Privacy</a>
          <a href="/terms" className="hover:text-slate-700">Terms</a>
        </footer>
      </div>

      <aside className="relative hidden lg:flex overflow-hidden m-3 rounded-[28px] bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 text-white">
        <div aria-hidden className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent-400/25 blur-3xl" />
        <div aria-hidden className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-brand-400/30 blur-3xl" />
        <div aria-hidden className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          <div className="space-y-6 max-w-md">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide uppercase ring-1 ring-white/15">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400" /> Live 1-to-1 lessons
            </span>
            <h2 className="font-heading text-4xl xl:text-5xl font-bold leading-[1.08] tracking-tight">
              {audience === "tutor" ? "Teach on your schedule. Get paid on time." : "Learn from verified tutors, live."}
            </h2>
            <p className="text-white/75 text-lg leading-relaxed">
              {audience === "tutor"
                ? "Set your hours and rates. Students book, pay and join the classroom in one place."
                : "Book a lesson in minutes, meet in our built-in classroom, and track your progress."}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-md">
            {[
              ["100%", "Verified tutors"],
              ["HD", "Live classroom"],
              ["24/7", "Book any time"],
            ].map(([n, l]) => (
              <div key={l} className="rounded-2xl bg-white/[0.07] ring-1 ring-white/10 p-4 backdrop-blur-sm">
                <div className="font-heading text-2xl font-bold">{n}</div>
                <div className="text-xs text-white/70 mt-0.5">{l}</div>
              </div>
            ))}
          </div>

          <figure className="max-w-md rounded-3xl bg-white/[0.08] ring-1 ring-white/15 p-6 backdrop-blur-md">
            <blockquote className="text-[15px] leading-relaxed text-white/90">“{q.quote}”</blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-400 font-bold text-brand-950">{q.who[0]}</span>
              <span>
                <b className="block text-sm">{q.who}</b>
                <span className="text-xs text-white/65">{q.role}</span>
              </span>
            </figcaption>
          </figure>
        </div>
      </aside>
    </div>
  );
}
