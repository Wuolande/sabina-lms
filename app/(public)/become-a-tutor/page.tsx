import type { Metadata } from "next";
import Link from "next/link";
import {
  DollarSign,
  Globe,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BecomeTutorEarningsCalculator } from "@/components/tutor/BecomeTutorEarningsCalculator";

export const metadata: Metadata = {
  title: "Become a Verified Tutor — Teach Online & Earn Globally",
  description:
    "Apply to become an online tutor on Sabina. Set your own hourly rate, teach motivated global students in our HD browser classroom, and enjoy automated bi-weekly payouts.",
  alternates: {
    canonical: "/become-a-tutor",
  },
};

export default function BecomeATutorPage() {
  return (
    <div className="mx-auto w-full max-w-7xl min-w-0 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 sm:space-y-16">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4 w-full min-w-0">
        <Badge variant="secondary" size="sm" className="bg-accent-400 text-slate-950 font-bold">
          Join 250+ Certified Mentors
        </Badge>
        <h1 className="text-2xl sm:text-5xl font-black text-slate-900 tracking-tight font-heading">
          Teach global students on your terms.
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Set your own hourly rate, build your professional brand, teach through our live browser classroom, and enjoy automated bi-weekly payouts.
        </p>

        <div className="pt-4">
          <Link href="/register?role=TUTOR" className="inline-block w-full sm:w-auto">
            <Button variant="default" size="lg" className="w-full sm:w-auto font-extrabold bg-brand hover:brightness-90 text-white px-8 shadow-elevation min-h-[48px]">
              Start Tutor Application (Free)
            </Button>
          </Link>
        </div>
      </div>

      {/* Interactive Earnings Calculator */}
      <BecomeTutorEarningsCalculator />

      {/* Why teach with Sabina Edge */}
      <div className="space-y-6 sm:space-y-8 w-full min-w-0">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 text-center font-heading">
          Why top educators choose Sabina Edge
        </h2>

        <div className="w-full max-w-full min-w-0 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="w-full max-w-full min-w-0 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-card space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand">
              <DollarSign className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Guaranteed & On-Time Payouts</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Never chase student payments. Students prepay when booking, and funds are automatically transferred directly to your bank account via Stripe Connect.
            </p>
          </div>

          <div className="w-full max-w-full min-w-0 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-card space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand">
              <Video className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Built-in Teaching Tools</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No need for third-party zoom links or extra subscriptions. Enjoy browser-based video, shared whiteboard, student goals, and lesson notes in one unified interface.
            </p>
          </div>

          <div className="w-full max-w-full min-w-0 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-card space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand">
              <Globe className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Global Student Base</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Connect with students eager to learn English, math, science, programming, and foreign languages across North America, Europe, Asia, and the Middle East.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
