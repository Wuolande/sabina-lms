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

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="subtle" size="sm" className="bg-brand-50 text-brand-800 font-bold">
          Student & Tutor Guide
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          How Sabina Edge powers your learning journey
        </h1>
        <p className="text-base text-slate-600">
          Everything you need to know about finding tutors, scheduling lessons across timezones, attending live video sessions, and achieving mastery.
        </p>
      </div>

      {/* 4 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-card space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 font-bold">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            1. Precision Tutor Discovery
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Filter through our curated network of certified tutors by subject specialty, languages spoken, hourly price range, student ratings, and verified credentials. Watch 1-minute video introductions to hear their accent and teaching style before you book.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-card space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 font-bold">
            <Calendar className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            2. Frictionless Global Scheduling
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Never struggle with timezones again. All tutor schedules are stored canonically in UTC and presented automatically in your local time. Choose between 25-minute intro sessions or 50-minute comprehensive lessons.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-card space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 font-bold">
            <Video className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            3. Dedicated Browser Classroom
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Connect directly in your browser with zero installation. Our classroom features crystal HD audio/video, screen sharing, live chat, shared lesson notes, and uploaded worksheets in a distraction-free learning space.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-card space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 font-bold">
            <TrendingUp className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            4. Measurable Goal Tracking
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Define concrete learning goals (e.g. &apos;IELTS 7.5 Speaking&apos; or &apos;Master Linear Algebra&apos;). After every lesson, receive personalized feedback, homework resources, and monitor your cumulative learning hours and streak.
          </p>
        </div>
      </div>

      {/* Guarantee Section */}
      <div className="rounded-3xl bg-slate-900 p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 border border-slate-800">
        <div className="space-y-3 max-w-xl">
          <Badge variant="secondary" size="sm" className="bg-accent-400 text-slate-950 font-bold">
            100% Satisfaction Guarantee
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-black">
            Not happy with your first lesson? It&apos;s on us.
          </h2>
          <p className="text-sm text-slate-400">
            If your trial lesson does not meet your expectations, we will either transfer your credit to another tutor or issue a full refund with no questions asked.
          </p>
        </div>

        <Link href="/find-tutors">
          <Button variant="secondary" size="lg" className="font-extrabold bg-accent-400 hover:bg-accent-500 text-slate-950 px-8 shrink-0">
            Find Your Tutor Today
          </Button>
        </Link>
      </div>
    </div>
  );
}
