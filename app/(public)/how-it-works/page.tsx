import type { Metadata } from "next";
import Link from "next/link";
import {
  Search,
  Calendar,
  Video,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Clock,
  HeartHandshake,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "How It Works — Global 1-on-1 Online Tutoring",
  description:
    "Learn how Sabina powers your learning journey. Find verified tutors, schedule lessons across timezones, join live HD video classrooms, and achieve academic mastery.",
  alternates: {
    canonical: "/how-it-works",
  },
};

export default function HowItWorksPage() {
  return (
    <div className="mx-auto w-full max-w-7xl min-w-0 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 sm:space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4 w-full min-w-0">
        <Badge variant="subtle" size="sm" className="bg-brand-50 text-brand-800 font-bold">
          Student & Tutor Guide
        </Badge>
        <h1 className="text-2xl sm:text-5xl font-black text-slate-900 tracking-tight font-heading">
          How Sabina Edge powers your learning journey
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Everything you need to know about finding tutors, scheduling lessons across timezones, attending live video sessions, and achieving mastery.
        </p>
      </div>

      {/* 4 Pillars */}
      <div className="w-full max-w-full min-w-0 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
        <div className="w-full max-w-full min-w-0 rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-8 shadow-card space-y-3 sm:space-y-4">
          <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-brand-50 text-brand font-bold shrink-0">
            <Search className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-heading">
            1. Precision Tutor Discovery
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Filter through our curated network of certified tutors by subject specialty, languages spoken, hourly price range, student ratings, and verified credentials. Watch 1-minute video introductions to hear their accent and teaching style before you book.
          </p>
        </div>

        <div className="w-full max-w-full min-w-0 rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-8 shadow-card space-y-3 sm:space-y-4">
          <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-brand-50 text-brand font-bold shrink-0">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-heading">
            2. Frictionless Global Scheduling
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Never struggle with timezones again. All tutor schedules are stored canonically in UTC and presented automatically in your local time. Choose between 25-minute intro sessions or 50-minute comprehensive lessons.
          </p>
        </div>

        <div className="w-full max-w-full min-w-0 rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-8 shadow-card space-y-3 sm:space-y-4">
          <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-brand-50 text-brand font-bold shrink-0">
            <Video className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-heading">
            3. Dedicated Browser Classroom
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Connect directly in your browser with zero installation. Our classroom features crystal HD audio/video, screen sharing, live chat, shared lesson notes, and uploaded worksheets in a distraction-free learning space.
          </p>
        </div>

        <div className="w-full max-w-full min-w-0 rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-8 shadow-card space-y-3 sm:space-y-4">
          <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-brand-50 text-brand font-bold shrink-0">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-heading">
            4. Measurable Goal Tracking
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Define concrete learning goals (e.g. &apos;IELTS 7.5 Speaking&apos; or &apos;Master Linear Algebra&apos;). After every lesson, receive personalized feedback, homework resources, and monitor your cumulative learning hours and streak.
          </p>
        </div>
      </div>

      {/* Guarantee Section */}
      <div className="w-full max-w-full min-w-0 rounded-2xl sm:rounded-3xl bg-slate-900 p-5 sm:p-12 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 sm:gap-8 border border-slate-800 shadow-xl">
        <div className="space-y-3 max-w-xl w-full min-w-0">
          <Badge variant="secondary" size="sm" className="bg-accent-400 text-slate-950 font-bold">
            100% Satisfaction Guarantee
          </Badge>
          <h2 className="text-xl sm:text-3xl font-black font-heading">
            Not happy with your first lesson? It&apos;s on us.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            If your trial lesson does not meet your expectations, we will either transfer your credit to another tutor or issue a full refund with no questions asked.
          </p>
        </div>

        <Link href="/find-tutors" className="w-full sm:w-auto">
          <Button variant="secondary" size="lg" className="w-full sm:w-auto font-extrabold bg-accent-400 hover:bg-accent-500 text-slate-950 px-8 shrink-0 h-12 min-h-[44px]">
            Find Your Tutor Today
          </Button>
        </Link>
      </div>
    </div>
  );
}
