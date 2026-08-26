import Link from "next/link";
import {
  Compass,
  Search,
  BookOpen,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Home,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* ── 1. Animated Badge & Error Visual ── */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-black uppercase tracking-wider text-amber-900 shadow-xs">
            <Compass className="h-4 w-4 text-amber-600 animate-spin" style={{ animationDuration: "8s" }} />
            404 • Page Not Found
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-950 font-heading tracking-tight">
            Lost in the Classroom?
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
            The page, tutor profile, or subject you are looking for doesn&apos;t exist or has moved. Let&apos;s get you back on track with the right educator.
          </p>
        </div>

        {/* ── 2. Primary Navigation Actions ── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="default"
              size="lg"
              className="w-full sm:w-auto font-extrabold bg-slate-950 hover:bg-slate-800 text-white rounded-2xl px-6 shadow-sm cursor-pointer"
              leftIcon={<Home className="h-4 w-4" />}
            >
              Return to Homepage
            </Button>
          </Link>

          <Link href="/find-tutors" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto font-bold border-slate-300 text-slate-800 hover:bg-slate-100 rounded-2xl px-6 cursor-pointer"
              leftIcon={<Search className="h-4 w-4 text-[#14209C]" />}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Find a Tutor
            </Button>
          </Link>
        </div>

        {/* ── 3. Quick Exploration Hub ── */}
        <div className="pt-8 border-t border-slate-200/80 space-y-4 text-left">
          <div className="text-center">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Popular Learning Destinations
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/find-tutors?subjectGroup=languages"
              className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-[#14209C] hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#14209C] group-hover:scale-110 transition-transform">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#14209C]">
                    Languages
                  </h3>
                  <p className="text-[11px] text-slate-500">English, Spanish, French</p>
                </div>
              </div>
            </Link>

            <Link
              href="/find-tutors?subjectGroup=mathematics"
              className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-[#14209C] hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 group-hover:scale-110 transition-transform">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#14209C]">
                    STEM & Math
                  </h3>
                  <p className="text-[11px] text-slate-500">Calculus, Physics, Coding</p>
                </div>
              </div>
            </Link>

            <Link
              href="/become-a-tutor"
              className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-emerald-600 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 group-hover:scale-110 transition-transform">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                    Teach on Sabina
                  </h3>
                  <p className="text-[11px] text-slate-500">Earn up to $120/hr</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* ── 4. Help / Contact Link ── */}
        <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
          <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
          <span>Need help finding a lesson or account support?</span>
          <Link href="/contact" className="font-bold text-[#14209C] hover:underline ml-1">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
