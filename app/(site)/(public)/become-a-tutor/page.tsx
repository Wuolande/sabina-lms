import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, ClipboardCheck, UserRoundPlus, Video, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BecomeTutorEarningsCalculator } from "@/components/tutor/BecomeTutorEarningsCalculator";
import { maybePayload, siteText } from "@/cms/content/server";
import { getPolicies } from "@/cms/tutors/server";
import { PLATFORM_DEFAULTS } from "@/cms/globals/PlatformSettings";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Become a tutor",
  description: "Teach live 1-on-1 lessons online. Set your own rate and hours, teach in our browser classroom, and withdraw your earnings to M-Pesa, PayPal or your bank.",
  alternates: { canonical: "/become-a-tutor" },
};

export default async function BecomeATutorPage() {
  const payload = await maybePayload();
  const [p, all] = await Promise.all([payload ? getPolicies(payload) : Promise.resolve(PLATFORM_DEFAULTS), siteText()]);
  const t = all.becomeTutor;
  const currency = String(p.currency);
  const fee = Number(p.platformFeePercent);
  const REASON_ICONS = [Wallet, CalendarClock, Video];
  const STEP_ICONS = [UserRoundPlus, ClipboardCheck, Video];
  const reasons = t.reasons.map((r, i) => ({ ...r, icon: REASON_ICONS[i % REASON_ICONS.length]! }));
  const steps = t.steps.map((r, i) => ({ ...r, icon: STEP_ICONS[i % STEP_ICONS.length]! }));

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-12 px-4 py-8 sm:space-y-16 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-3xl space-y-4 text-center">
        <Badge variant="secondary" size="sm" className="bg-accent-400 font-bold text-slate-950">
          {t.badge}
        </Badge>
        <h1 className="font-heading text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">{t.title}</h1>
        <p className="text-sm text-slate-600 sm:text-base">{t.intro}</p>
        <div className="pt-4">
          <Link href="/register?role=tutor" className="inline-block w-full sm:w-auto">
            <Button size="lg" className="min-h-[48px] w-full bg-brand px-8 font-extrabold text-white shadow-elevation hover:brightness-90 sm:w-auto">
              {t.cta}
            </Button>
          </Link>
        </div>
      </div>

      <BecomeTutorEarningsCalculator currency={currency} feePercent={fee} minRate={Number(p.tutorMinHourlyRate)} maxRate={Number(p.tutorMaxHourlyRate)} eyebrow={t.calcEyebrow} title={t.calcTitle} cta={t.cta} />

      <section className="w-full min-w-0 space-y-6 sm:space-y-8" aria-labelledby="why">
        <h2 id="why" className="text-center font-heading text-2xl font-black text-slate-900 sm:text-3xl">
          {t.reasonsTitle}
        </h2>
        <div className="grid w-full min-w-0 max-w-full grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
          {reasons.map(({ icon: Icon, title, text }) => (
            <div key={title} className="w-full min-w-0 max-w-full space-y-3 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card sm:p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="w-full min-w-0 space-y-6 sm:space-y-8" aria-labelledby="apply">
        <h2 id="apply" className="text-center font-heading text-2xl font-black text-slate-900 sm:text-3xl">
          {t.stepsTitle}
        </h2>
        <ol className="grid w-full min-w-0 grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="flex min-w-0 gap-4 rounded-2xl bg-slate-50 p-5 sm:p-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-black text-white">{i + 1}</span>
              <div className="min-w-0 space-y-1">
                <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <Icon className="h-4 w-4 text-brand" aria-hidden="true" /> {title}
                </h3>
                <p className="text-sm text-slate-600">{text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="text-center text-sm text-slate-600">
          Questions first?{" "}
          <Link href="/contact" className="font-semibold text-brand underline underline-offset-2">
            Contact us
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
