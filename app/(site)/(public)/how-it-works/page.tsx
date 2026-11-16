import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, CreditCard, Search, TrendingUp, Video } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { maybePayload, siteChrome } from "@/cms/content/server";
import { getPolicies } from "@/cms/tutors/server";
import { PLATFORM_DEFAULTS } from "@/cms/globals/PlatformSettings";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "How it works",
  description: "Find a tutor, book a time in your own time zone, and learn live in your browser. Here's how lessons, payments and cancellations work.",
  alternates: { canonical: "/how-it-works" },
};

const list = (n: number[]) => (n.length < 2 ? String(n[0] ?? "") : `${n.slice(0, -1).join(", ")} or ${n[n.length - 1]}`);

export default async function HowItWorksPage() {
  const payload = await maybePayload();
  const [p, site] = await Promise.all([payload ? getPolicies(payload) : Promise.resolve(PLATFORM_DEFAULTS), siteChrome()]);
  const minutes = [...((p.regularLessonMinutes as number[]) ?? [])].sort((a, b) => a - b);
  const trial = Number(p.trialLessonMinutes);
  const cancel = Number(p.cancellationRefundHours);
  const late = Number(p.lateCancellationRefundPercent ?? 0);

  const steps = [
    { icon: Search, title: "Find your tutor", text: "Filter by subject, level, price and language. Read reviews from other students and watch tutors' intro videos. Not sure where to start? Answer a few questions and we'll suggest three tutors." },
    { icon: Calendar, title: "Book a time", text: `Times show in your own time zone. Start with a ${trial}-minute trial lesson at a lower price, or book a ${list(minutes)}-minute lesson. Some tutors also offer packages of lessons at a discount.` },
    { icon: Video, title: "Learn live in your browser", text: `Open the lesson from your account up to ${Number(p.classroomEarlyJoinMinutes)} minutes before it starts. Video, a shared whiteboard, screen sharing, chat and lesson files are all in one place, with nothing to install.` },
    { icon: TrendingUp, title: "Keep track of progress", text: "Set learning goals, do the homework your tutor sets, and see their notes after each lesson. Parents can follow along with a private progress link." },
  ];

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-12 px-4 py-8 sm:space-y-16 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-3xl space-y-3 text-center sm:space-y-4">
        <Badge variant="subtle" size="sm" className="bg-brand-50 font-bold text-brand-800">
          For students and parents
        </Badge>
        <h1 className="font-heading text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">How {site.name} works</h1>
        <p className="text-sm text-slate-600 sm:text-base">From finding a tutor to your first lesson in a few minutes.</p>
      </div>

      <ol className="grid w-full min-w-0 max-w-full grid-cols-1 gap-4 sm:gap-8 md:grid-cols-2">
        {steps.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="w-full min-w-0 max-w-full space-y-3 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card sm:space-y-4 sm:rounded-3xl sm:p-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 font-bold text-brand sm:h-12 sm:w-12 sm:rounded-2xl">
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
            </div>
            <h2 className="font-heading text-lg font-bold text-slate-900 sm:text-xl">
              {i + 1}. {title}
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">{text}</p>
          </li>
        ))}
      </ol>

      <section aria-labelledby="pay" className="flex w-full min-w-0 max-w-full flex-col items-start justify-between gap-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 text-white shadow-xl sm:gap-8 sm:rounded-3xl sm:p-12 md:flex-row md:items-center">
        <div className="w-full min-w-0 max-w-xl space-y-3">
          <Badge variant="secondary" size="sm" className="bg-accent-400 font-bold text-slate-950">
            <CreditCard className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Payments and cancellations
          </Badge>
          <h2 id="pay" className="font-heading text-xl font-black sm:text-3xl">
            Pay per lesson. Cancel up to {cancel} hours before for a full refund.
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">
            You pay when you book, by card or M-Pesa where it&apos;s available. There&apos;s no subscription. If you cancel later than {cancel} hours before, {late > 0 ? `${late}% of the price is refunded` : "the lesson isn't refunded"}. If your tutor cancels or doesn&apos;t turn up, you get a full refund automatically.{" "}
            <Link href="/refund-policy" className="font-semibold text-white underline underline-offset-2">
              Read the refund policy
            </Link>
            .
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto">
          <Link href="/find-tutors" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="h-12 min-h-[44px] w-full bg-accent-400 px-8 font-extrabold text-slate-950 hover:bg-accent-500 sm:w-auto">
              Find a tutor
            </Button>
          </Link>
          <Link href="/match" className="text-center text-sm font-semibold text-slate-300 hover:text-white">
            Or get matched in 1 minute
          </Link>
        </div>
      </section>
    </div>
  );
}
