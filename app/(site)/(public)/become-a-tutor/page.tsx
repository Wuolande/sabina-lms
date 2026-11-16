import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, ClipboardCheck, UserRoundPlus, Video, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BecomeTutorEarningsCalculator } from "@/components/tutor/BecomeTutorEarningsCalculator";
import { maybePayload, siteChrome } from "@/cms/content/server";
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
  const [p, site] = await Promise.all([payload ? getPolicies(payload) : Promise.resolve(PLATFORM_DEFAULTS), siteChrome()]);
  const currency = String(p.currency);
  const fee = Number(p.platformFeePercent);
  const money = new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 });

  const reasons = [
    { icon: Wallet, title: `Keep ${100 - fee}% of every lesson`, text: `Students pay before the lesson, so there's nothing to chase. Earnings are ready to withdraw ${Number(p.earningsHoldDays)} days after a lesson, to M-Pesa, PayPal or your bank, once you have at least ${money.format(Number(p.minimumPayout))}.` },
    { icon: CalendarClock, title: "Your rate, your hours", text: `Charge between ${money.format(Number(p.tutorMinHourlyRate))} and ${money.format(Number(p.tutorMaxHourlyRate))} an hour and open only the times that suit you. Students see them in their own time zone.` },
    { icon: Video, title: "A classroom that's ready", text: "Video, a shared whiteboard, screen sharing, chat and lesson files in one place in the browser. No Zoom links or extra subscriptions." },
  ];
  const steps = [
    { icon: UserRoundPlus, title: "Create your account", text: "It's free to apply." },
    { icon: ClipboardCheck, title: "Tell us about your teaching", text: "Subjects, qualifications, an ID document and a short intro video." },
    { icon: Video, title: "Get approved and start teaching", text: "Our team reviews every application by hand. Once you're approved, your profile goes live." },
  ];

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-12 px-4 py-8 sm:space-y-16 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-3xl space-y-4 text-center">
        <Badge variant="secondary" size="sm" className="bg-accent-400 font-bold text-slate-950">
          Teach on {site.name}
        </Badge>
        <h1 className="font-heading text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">Teach what you know, on your schedule.</h1>
        <p className="text-sm text-slate-600 sm:text-base">Set your own rate and hours, teach live 1-on-1 lessons in your browser, and get paid for every lesson you teach.</p>
        <div className="pt-4">
          <Link href="/register?role=tutor" className="inline-block w-full sm:w-auto">
            <Button size="lg" className="min-h-[48px] w-full bg-brand px-8 font-extrabold text-white shadow-elevation hover:brightness-90 sm:w-auto">
              Apply to teach
            </Button>
          </Link>
        </div>
      </div>

      <BecomeTutorEarningsCalculator currency={currency} feePercent={fee} minRate={Number(p.tutorMinHourlyRate)} maxRate={Number(p.tutorMaxHourlyRate)} />

      <section className="w-full min-w-0 space-y-6 sm:space-y-8" aria-labelledby="why">
        <h2 id="why" className="text-center font-heading text-2xl font-black text-slate-900 sm:text-3xl">
          Why teach with us
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
          How to apply
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
