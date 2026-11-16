import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, CreditCard, Search, TrendingUp, Video } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { siteText } from "@/cms/content/server";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "How it works",
  description: "Find a tutor, book a time in your own time zone, and learn live in your browser. Here's how lessons, payments and cancellations work.",
  alternates: { canonical: "/how-it-works" },
};

const ICONS = [Search, Calendar, Video, TrendingUp];

export default async function HowItWorksPage() {
  const t = (await siteText()).howItWorks;

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-12 px-4 py-8 sm:space-y-16 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-3xl space-y-3 text-center sm:space-y-4">
        <Badge variant="subtle" size="sm" className="bg-brand-50 font-bold text-brand-800">
          {t.badge}
        </Badge>
        <h1 className="font-heading text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">{t.title}</h1>
        <p className="text-sm text-slate-600 sm:text-base">{t.intro}</p>
      </div>

      <ol className="grid w-full min-w-0 max-w-full grid-cols-1 gap-4 sm:gap-8 md:grid-cols-2">
        {t.steps.map(({ title, text }, i) => {
          const Icon = ICONS[i % ICONS.length]!;
          return (
          <li key={title} className="w-full min-w-0 max-w-full space-y-3 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card sm:space-y-4 sm:rounded-3xl sm:p-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 font-bold text-brand sm:h-12 sm:w-12 sm:rounded-2xl">
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
            </div>
            <h2 className="font-heading text-lg font-bold text-slate-900 sm:text-xl">
              {i + 1}. {title}
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">{text}</p>
          </li>
          );
        })}
      </ol>

      <section aria-labelledby="pay" className="flex w-full min-w-0 max-w-full flex-col items-start justify-between gap-6 rounded-2xl border border-brand-900 bg-gradient-to-br from-brand-950 to-brand-800 p-5 text-white shadow-xl sm:gap-8 sm:rounded-3xl sm:p-12 md:flex-row md:items-center">
        <div className="w-full min-w-0 max-w-xl space-y-3">
          <Badge variant="secondary" size="sm" className="bg-accent-400 font-bold text-slate-950">
            <CreditCard className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> {t.payBadge}
          </Badge>
          <h2 id="pay" className="font-heading text-xl font-black sm:text-3xl">
            {t.payTitle}
          </h2>
          <p className="text-sm leading-relaxed text-slate-300">
            {t.payText}{" "}
            <Link href="/refund-policy" className="font-semibold text-white underline underline-offset-2">
              Read the refund policy
            </Link>
            .
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto">
          <Link href="/find-tutors" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="h-12 min-h-[44px] w-full bg-accent-400 px-8 font-extrabold text-slate-950 hover:bg-accent-500 sm:w-auto">
              {t.cta}
            </Button>
          </Link>
          <Link href="/match" className="text-center text-sm font-semibold text-slate-300 hover:text-white">
            {t.secondaryCta}
          </Link>
        </div>
      </section>
    </div>
  );
}
