"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowRight,
  ShieldCheck,
  Star,
  Video,
  Calendar,
  Sparkles,
  Award,
  Globe,
  CheckCircle2,
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Clock,
  Play,
  FileText,
  ChevronDown,
  Monitor,
  PenTool,
  Check,
  Mic,
  Zap,
  Layers,
  Code,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Rating } from "@/components/ui/Rating";
import { TutorCard } from "@/components/marketplace/TutorCard";
import { BookingModal } from "@/components/booking/BookingModal";
import { CountUp } from "@/components/ui/CountUp";
import { TutorCardSkeleton, SubjectCardSkeleton } from "@/components/ui/Skeleton";
import { tutorService } from "@/services/tutorService";
import { TutorProfile, Subject } from "@/types";

export default function HomePage() {
  const router = useRouter();
  const [featuredTutors, setFeaturedTutors] = React.useState<TutorProfile[]>([]);
  const [popularSubjects, setPopularSubjects] = React.useState<Subject[]>([]);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [bookingTutor, setBookingTutor] = React.useState<TutorProfile | null>(null);
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);
  const [activeTourTab, setActiveTourTab] = React.useState<"video" | "whiteboard" | "notes" | "goals">("video");
  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(0);

  // Dynamic CMS Content State
  const [cms, setCms] = React.useState<any | null>(null);

  // Quick search input
  const [quickQuery, setQuickQuery] = React.useState("");

  // Loading States
  const [isTutorsLoading, setIsTutorsLoading] = React.useState(true);
  const [isSubjectsLoading, setIsSubjectsLoading] = React.useState(true);

  React.useEffect(() => {
    tutorService
      .getFeaturedTutors()
      .then(setFeaturedTutors)
      .finally(() => setIsTutorsLoading(false));

    tutorService
      .getPopularSubjects()
      .then(setPopularSubjects)
      .finally(() => setIsSubjectsLoading(false));

    tutorService.getHomepageContent().then(setCms);
  }, []);

  const handleBook = (tutor: TutorProfile) => {
    setBookingTutor(tutor);
    setIsBookingOpen(true);
  };

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuery.trim()) {
      router.push("/find-tutors");
      return;
    }
    router.push(`/find-tutors?q=${encodeURIComponent(quickQuery.trim())}`);
  };

  const categories = [
    { id: "all", label: "All Disciplines" },
    { id: "Languages", label: "Languages" },
    { id: "STEM", label: "STEM & Mathematics" },
    { id: "Coding", label: "Coding & Tech" },
    { id: "Exam Prep", label: "Exam Prep" },
    { id: "Business", label: "Business & Finance" },
  ];

  const filteredSubjects = selectedCategory === "all"
    ? popularSubjects
    : popularSubjects.filter((s) => s.category.toLowerCase().includes(selectedCategory.toLowerCase()) || selectedCategory.toLowerCase().includes(s.category.toLowerCase()));

  // ── CMS Content Fallbacks ──
  const hero = cms?.heroSection || {
    pretitle: "YOUR JOURNEY BEGINS HERE",
    typewriterHeadlines: [
      "Grow Your Knowledge with Leading Online Courses",
      "Master Any Language with Native 1-on-1 Tutors",
      "Ace Your STEM Exams with Certified Professors",
      "Level Up Your Coding with FAANG Industry Mentors",
      "Pass IELTS & TOEFL with Master Test Prep Coaches",
    ],
    subheading: "Start learning today with top-rated courses and instructors. Take your skills, confidence, and academic journey to new heights with structured 1-on-1 sessions.",
    searchPlaceholder: "Search subject, language or goal (e.g. IELTS, Calculus)...",
    popularTags: [
      { label: "English", slug: "english" },
      { label: "Calculus", slug: "mathematics" },
      { label: "Python", slug: "python-data-science" },
      { label: "IELTS Prep", slug: "ielts-toefl-prep" },
    ],
    socialProofCount: "+2,000 students worldwide",
    socialProofRating: "5.0",
    heroStudentImage: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=700",
    floatingCard1: { value: 20, suffix: "+", label: "Creative Subjects" },
    floatingCard2: { value: 10, suffix: "k+", label: "Students" },
    floatingCard3: { value: 480, suffix: "+", label: "Hours Course Time" },
  };

  const stats = cms?.statsSection || {
    stat1: { value: 250, suffix: "+", decimals: 0, label: "Verified Instructors" },
    stat2: { value: 15000, suffix: "+", decimals: 0, label: "Enrolled Students" },
    stat3: { value: 98.9, suffix: "%", decimals: 1, label: "Lesson Success Rate" },
    stat4: { value: 4.98, suffix: " ★", decimals: 2, label: "Average Student Rating" },
  };

  const catSection = cms?.categoriesSection || {
    pretitle: "POPULAR CATEGORIES",
    title: "Find the perfect tutor for your subject",
    ctaText: "View All 16+ Disciplines",
  };

  const tutSection = cms?.featuredTutorsSection || {
    pretitle: "VERIFIED EDUCATORS",
    title: "Learn 1-on-1 with accredited tutors",
    ctaText: "View All Tutors",
  };

  const classroom = cms?.classroomTourSection || {
    badge: "In-Browser Live LMS • Zero Downloads",
    title: "A live video classroom built for mastery.",
    subtitle: "Experience sub-50ms HD video, collaborative whiteboard with LaTeX formulas, and synchronized PDF lesson notes — directly in your browser.",
  };

  const howItWorks = cms?.howItWorksSection || {
    pretitle: "HOW IT WORKS",
    title: "Simple 3-step learning journey",
    steps: [
      {
        num: "01",
        title: "Discover Your Tutor",
        desc: "Filter by subject specialty, rate, and languages. Watch video introductions to find the right teaching style.",
      },
      {
        num: "02",
        title: "Book in Your Timezone",
        desc: "Choose a 25-min trial or 50-min standard class. All schedules automatically convert to your local clock.",
      },
      {
        num: "03",
        title: "Learn Live & Level Up",
        desc: "Enter our browser classroom with HD video, whiteboard, and downloadable notes. Zero software to download.",
      },
    ],
  };

  const becomeTutor = cms?.becomeTutorSection || {
    badge: "Join Our Global Teaching Faculty",
    title: "Teach what you love. Earn $40 – $120 / hr.",
    subtitle: "Set your own hourly rate, teach motivated 1-on-1 students globally from home, and receive reliable automated weekly payouts. Zero upfront costs.",
    rateRange: "$40 – $120 / hr",
    bulletPoints: [
      "Keep 85% of your earnings",
      "100% flexible schedule",
      "Browser video classroom included",
    ],
    ctaButtonText: "Apply as a Tutor",
    secondaryButtonText: "How It Works for Tutors",
  };

  const faqSection = cms?.faqSection || {
    pretitle: "COMMON QUESTIONS",
    title: "Frequently Asked Questions",
    faqs: [
      {
        q: "How does 1-on-1 online tutoring work on Sabina Edge?",
        a: "You browse verified tutors by subject, specialty, price, and language. Once you find a tutor, book an available time slot converted to your local timezone. When class starts, simply join our dedicated in-browser video classroom with shared whiteboard, notes, and screen sharing.",
      },
      {
        q: "What is the 100% Satisfaction Guarantee?",
        a: "If you are not completely satisfied with your first trial lesson, let us know within 24 hours. We will either issue a full refund or transfer your credit to another tutor of your choice with zero hassle.",
      },
      {
        q: "Do I need to install any external software like Zoom or Skype?",
        a: "No downloads or extra accounts required! The Sabina Edge Classroom runs entirely inside modern web browsers on desktop, tablet, and mobile with crystal-clear HD audio/video and collaborative tools.",
      },
      {
        q: "How do tutor payments and cancellations work?",
        a: "You only pay per lesson booked — there are zero monthly subscription lock-ins. You can reschedule or cancel any lesson free of charge up to 24 hours before the scheduled start time.",
      },
      {
        q: "How are tutors vetted and approved on Sabina Edge?",
        a: "Every tutor undergoes a rigorous 7-step credential verification process, including identity checks, certified university degree review, teaching certifications, and a recorded video interview audit before being approved.",
      },
    ],
  };

  const faqs = faqSection.faqs || [];

  // Typewriter headline animation
  const typewriterTitles = React.useMemo(() => {
    return hero.typewriterHeadlines && hero.typewriterHeadlines.length > 0
      ? hero.typewriterHeadlines
      : ["Grow Your Knowledge with Leading Online Courses"];
  }, [hero.typewriterHeadlines]);

  const [currentTitleIndex, setCurrentTitleIndex] = React.useState(0);
  const [displayText, setDisplayText] = React.useState(typewriterTitles[0] || "");
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    const fullText = typewriterTitles[currentTitleIndex % typewriterTitles.length] || "";
    let timer: NodeJS.Timeout;

    if (!isDeleting && displayText === fullText) {
      // Finished typing full phrase, wait before deleting
      timer = setTimeout(() => setIsDeleting(true), 2400);
    } else if (isDeleting && displayText === "") {
      // Finished deleting, move to next phrase
      setIsDeleting(false);
      setCurrentTitleIndex((prev) => (prev + 1) % typewriterTitles.length);
    } else {
      // Type or delete character by character
      const speed = isDeleting ? 28 : 55;
      timer = setTimeout(() => {
        setDisplayText((prev) =>
          isDeleting
            ? fullText.substring(0, prev.length - 1)
            : fullText.substring(0, prev.length + 1)
        );
      }, speed);
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentTitleIndex, typewriterTitles]);

  return (
    <div className="flex flex-col space-y-24 sm:space-y-32 pb-24 overflow-hidden bg-white">
      
      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION (Dynamic CMS Content)
      ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-6 sm:pt-14 pb-16 lg:pb-24 overflow-hidden">
        {/* Ambient atmospheric gradients */}
        <div className="absolute top-0 right-1/4 -mt-24 w-96 h-96 rounded-full bg-emerald-100/50 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-0 -ml-20 w-80 h-80 rounded-full bg-brand-100/40 blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* ── LEFT COLUMN: Text, CTA, Search and Social Proof ── */}
            <div className="lg:col-span-6 space-y-6 sm:space-y-7 text-left z-10">
              
              {/* Pre-title Tag */}
              <div>
                <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.18em] text-[#059669]">
                  {hero.pretitle}
                </span>
              </div>

              {/* Main Headline with Typewriter Keyboard Effect */}
              <div className="min-h-[130px] sm:min-h-[160px] lg:min-h-[175px] flex items-start">
                <h1 className="text-4xl sm:text-5xl lg:text-[54px] xl:text-[58px] font-extrabold tracking-[-0.03em] text-slate-950 leading-[1.12]">
                  {displayText}
                  <span className="inline-block w-[3.5px] h-[0.85em] bg-[#059669] ml-1.5 rounded-full animate-cursor align-middle" />
                </h1>
              </div>

              {/* Subheading */}
              <p className="text-base sm:text-[17px] text-slate-500 font-normal leading-relaxed max-w-lg">
                {hero.subheading}
              </p>

              {/* Fast Search Command Bar */}
              <form onSubmit={handleQuickSearch} className="relative max-w-md">
                <input
                  type="text"
                  placeholder={hero.searchPlaceholder}
                  value={quickQuery}
                  onChange={(e) => setQuickQuery(e.target.value)}
                  className="w-full h-14 rounded-2xl border border-slate-200 bg-white pl-4 pr-32 text-xs sm:text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 h-10 px-5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-subtle active:scale-95 cursor-pointer"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Search</span>
                </button>
              </form>

              {/* Popular Tags */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="text-slate-400">Popular:</span>
                {hero.popularTags?.map((tag: any, idx: number) => (
                  <Link
                    key={idx}
                    href={`/find-tutors?subject=${tag.slug}`}
                    className="hover:text-emerald-700 bg-slate-100/80 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    {tag.label}
                  </Link>
                ))}
              </div>

              {/* Social Proof: Avatars + Stars */}
              <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                {/* Overlapping Avatar Stack */}
                <div className="flex -space-x-2.5 overflow-hidden">
                  <img
                    className="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover shadow-sm"
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"
                    alt="Student 1"
                  />
                  <img
                    className="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover shadow-sm"
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120"
                    alt="Student 2"
                  />
                  <img
                    className="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover shadow-sm"
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120"
                    alt="Student 3"
                  />
                  <img
                    className="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover shadow-sm"
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120"
                    alt="Student 4"
                  />
                  <img
                    className="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover shadow-sm"
                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=120"
                    alt="Student 5"
                  />
                </div>

                {/* Star Rating & Subtext */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1">
                    <div className="flex text-amber-400">
                      {"★★★★★".split("").map((star, i) => (
                        <span key={i} className="text-base leading-none">★</span>
                      ))}
                    </div>
                    <span className="text-sm font-black text-slate-900 ml-1">{hero.socialProofRating}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-500">
                    {hero.socialProofCount}
                  </p>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Circular Composition + Student Photo + Animated Floating Widgets ── */}
            <div className="lg:col-span-6 relative flex items-center justify-center lg:justify-end min-h-[460px] sm:min-h-[540px]">
              
              {/* Outer Geometric Frame */}
              <div className="relative w-full max-w-[480px] aspect-square flex items-center justify-center">
                
                {/* Subtle Ambient Radial Glow */}
                <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none scale-105" />

                {/* Thin Blue Outer Contour Ring */}
                <div className="absolute inset-0 rounded-full border-2 border-brand-700/70 -rotate-12 scale-105 pointer-events-none transition-transform duration-700 hover:rotate-0" />

                {/* Solid Emerald/Teal Circular Backdrop */}
                <div className="absolute inset-3 rounded-full bg-gradient-to-br from-[#0e5c47] via-[#094837] to-[#053326] shadow-2xl overflow-hidden" />

                {/* Vibrant Yellow Circle Accent (#F9C31C) */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 h-10 w-10 rounded-full bg-[#F9C31C] shadow-md z-20 animate-float" />

                {/* Vibrant Royal Blue Dot Accent (#14209C) */}
                <div className="absolute left-2 bottom-12 h-14 w-14 rounded-full bg-[#14209C] shadow-md z-20 animate-float-alt" />

                {/* Main Hero Student Photo */}
                <div className="relative z-10 h-full w-full flex items-end justify-center overflow-hidden rounded-full pt-4">
                  <img
                    src={hero.heroStudentImage || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=700"}
                    alt="Student with notebook"
                    className="h-full w-auto object-cover scale-110 translate-y-2 select-none hover:scale-115 transition-transform duration-500"
                  />
                </div>

                {/* Floating Card 1 */}
                <div className="absolute -left-4 sm:-left-8 top-16 z-30 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/90 p-3.5 shadow-elevation flex items-center gap-3 animate-float hover:scale-110 transition-all duration-300 group cursor-default">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <strong className="text-base font-black text-slate-900 block leading-tight font-heading">
                      <CountUp to={hero.floatingCard1?.value ?? 20} suffix={hero.floatingCard1?.suffix || "+"} duration={1400} />
                    </strong>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {hero.floatingCard1?.label || "Creative Subjects"}
                    </span>
                  </div>
                </div>

                {/* Floating Card 2 */}
                <div className="absolute -right-2 sm:-right-6 top-8 z-30 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/90 p-4 shadow-elevation flex flex-col items-center justify-center animate-float-slow hover:scale-110 transition-all duration-300 text-center w-28 group cursor-default">
                  <div className="relative h-12 w-12 flex items-center justify-center">
                    <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-100"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-emerald-500 group-hover:text-emerald-600 transition-colors"
                        strokeDasharray="78, 100"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute text-[11px] font-black text-slate-900 font-heading">
                      <CountUp to={hero.floatingCard2?.value ?? 10} suffix={hero.floatingCard2?.suffix || "k+"} duration={1400} />
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
                    {hero.floatingCard2?.label || "Students"}
                  </span>
                </div>

                {/* Floating Card 3 */}
                <div className="absolute -right-4 sm:-right-8 bottom-4 z-30 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/90 p-3.5 shadow-elevation flex items-center gap-3 animate-float-alt hover:scale-110 transition-all duration-300 group cursor-default">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <strong className="text-base font-black text-slate-900 block leading-tight font-heading">
                      <CountUp to={hero.floatingCard3?.value ?? 480} suffix={hero.floatingCard3?.suffix || "+"} duration={1600} />
                    </strong>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {hero.floatingCard3?.label || "Hours Course Time"}
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. STATS & CREDIBILITY BAR (Dynamic CMS CountUp)
      ───────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-6 sm:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <h3 className="text-3xl sm:text-4xl font-black text-slate-950 font-heading">
              <CountUp to={stats.stat1?.value ?? 250} suffix={stats.stat1?.suffix || "+"} duration={1800} />
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-500">
              {stats.stat1?.label || "Verified Instructors"}
            </p>
          </div>

          <div className="space-y-1">
            <h3 className="text-3xl sm:text-4xl font-black text-slate-950 font-heading">
              <CountUp to={stats.stat2?.value ?? 15000} suffix={stats.stat2?.suffix || "+"} duration={2000} />
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-500">
              {stats.stat2?.label || "Enrolled Students"}
            </p>
          </div>

          <div className="space-y-1">
            <h3 className="text-3xl sm:text-4xl font-black text-slate-950 font-heading">
              <CountUp to={stats.stat3?.value ?? 98.9} decimals={stats.stat3?.decimals ?? 1} suffix={stats.stat3?.suffix || "%"} duration={1900} />
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-500">
              {stats.stat3?.label || "Lesson Success Rate"}
            </p>
          </div>

          <div className="space-y-1">
            <h3 className="text-3xl sm:text-4xl font-black text-slate-950 font-heading">
              <CountUp to={stats.stat4?.value ?? 4.98} decimals={stats.stat4?.decimals ?? 2} suffix={stats.stat4?.suffix || " ★"} duration={1800} />
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-500">
              {stats.stat4?.label || "Average Student Rating"}
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. EXPLORE DISCIPLINES & CATEGORIES (Dynamic CMS)
      ───────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.18em] text-[#059669] block">
              {catSection.pretitle}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-[-0.02em] leading-tight mt-1.5">
              {catSection.title}
            </h2>
          </div>

          <Link href="/subjects">
            <Button variant="outline" size="sm" className="font-bold text-xs rounded-xl" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              {catSection.ctaText}
            </Button>
          </Link>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-slate-950 text-white shadow-subtle"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Subjects Grid */}
        {isSubjectsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
              <SubjectCardSkeleton key={idx} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredSubjects.map((sub) => (
              <Link
                key={sub.id}
                href={`/find-tutors?subject=${sub.slug}`}
                className="group rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card hover:shadow-elevation hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-subtle">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <Badge variant="subtle" size="sm" className="font-bold text-[11px] bg-slate-100 text-slate-700">
                      {sub.tutorCount || 25}+ Tutors
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors mt-4">
                    {sub.name}
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mt-0.5">
                    {sub.category}
                  </span>

                  <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                    {sub.description}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
                  <span>From $25/hr</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Explore <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. FEATURED ACCREDITED INSTRUCTORS (Dynamic CMS)
      ───────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.18em] text-[#059669] block">
              {tutSection.pretitle}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-[-0.02em] leading-tight mt-1.5">
              {tutSection.title}
            </h2>
          </div>

          <Link href="/find-tutors">
            <Button variant="default" size="sm" className="font-bold bg-slate-950 hover:bg-slate-800 text-white rounded-xl" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              {tutSection.ctaText}
            </Button>
          </Link>
        </div>

        {isTutorsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((idx) => (
              <TutorCardSkeleton key={idx} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredTutors.map((tutor) => (
              <TutorCard key={tutor.id} tutor={tutor} onBook={handleBook} />
            ))}
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. THE LIVE VIDEO CLASSROOM (Dynamic CMS Product Tour)
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#050B18] py-16 sm:py-24 text-white relative overflow-hidden">
        {/* Ambient radial lighting */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3.5 py-1 rounded-full">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              {classroom.badge}
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white font-heading tracking-tight">
              {classroom.title}
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {classroom.subtitle}
            </p>
          </div>

          {/* Interactive Feature Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { id: "video", label: "1. HD Video & Live Audio", icon: Video },
              { id: "whiteboard", label: "2. Interactive Math & Code Canvas", icon: PenTool },
              { id: "notes", label: "3. Synced Notes & Worksheets", icon: FileText },
              { id: "goals", label: "4. Learning Streaks & ROI", icon: TrendingUp },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTourTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTourTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-emerald-500 text-slate-950 shadow-glow font-extrabold"
                      : "bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* ── VISUAL LIVE CLASSROOM MOCKUP CONTAINER ── */}
          <div className="max-w-5xl mx-auto rounded-3xl border border-slate-800 bg-[#0B132B] shadow-2xl overflow-hidden">
            {/* Browser Top Window Chrome Bar */}
            <div className="bg-slate-900/95 px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
              </div>

              <div className="hidden sm:flex items-center gap-2 bg-slate-950/80 px-4 py-1 rounded-xl border border-slate-800 text-[11px] text-slate-400 font-mono">
                <span className="text-emerald-400 font-bold">🔒</span>
                <span>sabinaedge.com/classroom/les-884920</span>
              </div>

              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5 text-rose-400 bg-rose-950/60 border border-rose-800/80 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                  REC 24:18
                </span>
                <span className="hidden md:inline-flex text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded-full font-mono">
                  ● 1080p 60fps • 24ms
                </span>
              </div>
            </div>

            {/* Simulated Live Classroom Stage */}
            <div className="p-4 sm:p-6 min-h-[380px] sm:min-h-[440px] flex flex-col justify-between bg-gradient-to-b from-slate-950 to-[#0B132B]">
              {/* TAB 1: HD VIDEO & AUDIO STREAM */}
              {activeTourTab === "video" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in flex-1">
                  {/* Large Tutor Video Stream */}
                  <div className="md:col-span-2 relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col justify-between p-4 min-h-[260px]">
                    <img
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800"
                      alt="Tutor Video Stream"
                      className="absolute inset-0 w-full h-full object-cover opacity-80"
                    />
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold text-white border border-white/10 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                        Dr. Elena Rostova (Tutor)
                      </span>
                      <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                        Speaking
                      </span>
                    </div>

                    {/* Speech / Audio Waveform Box */}
                    <div className="relative z-10 bg-slate-950/90 backdrop-blur-md p-3 rounded-xl border border-white/10 space-y-1 max-w-md">
                      <p className="text-xs text-white font-medium">
                        “Let&apos;s apply the chain rule to compute the gradient vector at (x, y) = (2, 3).”
                      </p>
                      <div className="flex items-center gap-1 h-3">
                        <span className="h-2 w-1 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="h-3.5 w-1 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="h-1.5 w-1 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="h-3 w-1 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="h-2 w-1 bg-emerald-400 rounded-full animate-pulse" />
                      </div>
                    </div>
                  </div>

                  {/* Student Picture-in-Picture + Chat Drawer */}
                  <div className="space-y-4 flex flex-col justify-between">
                    {/* Student PiP */}
                    <div className="relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden h-32 p-3 flex flex-col justify-between">
                      <img
                        src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300"
                        alt="Student Video"
                        className="absolute inset-0 w-full h-full object-cover opacity-80"
                      />
                      <div className="relative z-10 flex justify-between">
                        <span className="bg-slate-950/80 px-2 py-0.5 rounded-md text-[10px] font-bold text-white">
                          Alex Rivera (You)
                        </span>
                        <Mic className="h-3.5 w-3.5 text-emerald-400" />
                      </div>
                    </div>

                    {/* Mini Chat Stream */}
                    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 space-y-2.5 flex-1 flex flex-col justify-between text-xs">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Live Classroom Chat
                      </span>
                      <div className="space-y-2">
                        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-[11px]">
                          <strong className="text-emerald-400 block font-semibold">Dr. Elena Rostova:</strong>
                          <span>Check the PDF in tab 3 for practice set 4.</span>
                        </div>
                        <div className="bg-brand-950/40 p-2 rounded-xl border border-brand-800/50 text-[11px]">
                          <strong className="text-[#F9C31C] block font-semibold">You:</strong>
                          <span>Got it! Working on equation 2 now.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: INTERACTIVE WHITEBOARD & CODE CANVAS */}
              {activeTourTab === "whiteboard" && (
                <div className="animate-fade-in flex-1 space-y-4">
                  {/* Canvas Toolbar */}
                  <div className="flex items-center justify-between bg-slate-900 p-2 rounded-2xl border border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500 text-slate-950 px-3 py-1 rounded-xl font-bold flex items-center gap-1">
                        <PenTool className="h-3.5 w-3.5" /> Pen (Active)
                      </span>
                      <span className="hover:bg-slate-800 px-2.5 py-1 rounded-xl text-slate-400 cursor-pointer">
                        Highlighter
                      </span>
                      <span className="hover:bg-slate-800 px-2.5 py-1 rounded-xl text-slate-400 cursor-pointer font-serif">
                        LaTeX Equation ($)
                      </span>
                      <span className="hover:bg-slate-800 px-2.5 py-1 rounded-xl text-slate-400 cursor-pointer">
                        Python Code
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>Grid: 100%</span>
                      <Button variant="outline" size="sm" className="h-7 text-xs border-slate-700 text-white">
                        Export Notes PDF
                      </Button>
                    </div>
                  </div>

                  {/* Math Drawing Canvas Simulation */}
                  <div className="rounded-2xl bg-slate-950 border border-slate-800 p-6 font-mono relative min-h-[260px] flex flex-col justify-center space-y-4">
                    <div className="space-y-2">
                      <div className="text-emerald-400 text-sm font-bold">
                        // Theorem: Fundamental Theorem of Calculus
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-white font-serif bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 inline-block">
                        ∫ [0 to π] x · sin(x) dx = π
                      </div>
                      <p className="text-xs text-slate-400">
                        Annotation by <span className="text-[#F9C31C] font-bold">Dr. Elena Rostova</span>: &quot;Integrate by parts: let u = x and dv = sin(x)dx &rarr; du = dx, v = -cos(x)&quot;
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-2 text-xs text-slate-400 border-t border-slate-800/80">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        2 Users drawing simultaneously
                      </span>
                      <span>•</span>
                      <span>Alex Rivera cursor active on Step 3</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SYNCED NOTES & HOMEWORK WORKSHEETS */}
              {activeTourTab === "notes" && (
                <div className="animate-fade-in flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-slate-900 p-5 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <FileText className="h-4 w-4" /> AP_Calculus_Practice_Set_04.pdf
                      </span>
                      <span className="text-[10px] text-slate-400">2.4 MB • Verified</span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Q1. Directional Derivatives</span>
                        <span className="text-emerald-400 font-bold">✓ Completed</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Q2. Gradient Vector Orthogonality</span>
                        <span className="text-emerald-400 font-bold">✓ Completed</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Q3. Tangent Plane Equations</span>
                        <span className="text-amber-400 font-bold">In Progress</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-900 p-5 border border-slate-800 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-white">Tutor Lesson Feedback</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        “Alex showed outstanding comprehension of multi-variable gradients today. Focus on 3D surface visualizations before our next session on Thursday.”
                      </p>
                    </div>
                    <Button variant="default" size="sm" className="w-full font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl">
                      Download Lesson Summary Notes
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB 4: LEARNING STREAKS & ROI */}
              {activeTourTab === "goals" && (
                <div className="animate-fade-in flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-2xl bg-slate-900 p-5 border border-slate-800 space-y-2 text-center flex flex-col justify-center">
                    <span className="text-3xl">🔥</span>
                    <strong className="text-2xl font-black text-white font-heading">14 Days</strong>
                    <span className="text-xs text-amber-400 font-bold">Learning Streak</span>
                    <p className="text-[11px] text-slate-400">Top 5% student consistency</p>
                  </div>

                  <div className="rounded-2xl bg-slate-900 p-5 border border-slate-800 space-y-3 flex flex-col justify-center">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-white">IELTS 7.5+ Target</span>
                      <span className="text-emerald-400">75%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: "75%" }} />
                    </div>
                    <span className="text-[11px] text-slate-400 block text-center">On track for exam in Nov 2026</span>
                  </div>

                  <div className="rounded-2xl bg-slate-900 p-5 border border-slate-800 space-y-2 text-center flex flex-col justify-center">
                    <strong className="text-2xl font-black text-white font-heading">48.5 hrs</strong>
                    <span className="text-xs text-emerald-400 font-bold">Total Learning Time</span>
                    <p className="text-[11px] text-slate-400">+12% faster mastery</p>
                  </div>
                </div>
              )}

              {/* Bottom Classroom Control Toolbar */}
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="h-9 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer">
                    <Mic className="h-3.5 w-3.5 text-emerald-400" /> Mute
                  </span>
                  <span className="h-9 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer">
                    <Video className="h-3.5 w-3.5 text-emerald-400" /> Camera On
                  </span>
                  <span className="h-9 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white hidden sm:flex items-center gap-1.5 cursor-pointer">
                    <Monitor className="h-3.5 w-3.5 text-slate-300" /> Share Screen
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link href="/find-tutors">
                    <Button variant="default" size="sm" className="font-extrabold bg-[#F9C31C] hover:bg-[#e0ad10] text-slate-950 rounded-xl px-5 cursor-pointer">
                      Try a Live Lesson Now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. HOW IT WORKS (Dynamic CMS 3-Step Roadmap)
      ───────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.18em] text-[#059669] block">
            {howItWorks.pretitle}
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-[-0.02em] leading-tight">
            {howItWorks.title}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(howItWorks.steps || []).map((step: any, idx: number) => {
            const icons = [Search, Calendar, Video];
            const Icon = icons[idx % icons.length];
            return (
              <div
                key={idx}
                className="relative rounded-3xl border border-slate-200/90 bg-white p-8 shadow-card flex flex-col justify-between space-y-6 hover:shadow-elevation transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-subtle font-extrabold text-lg">
                    <Icon className="h-7 w-7" />
                  </div>
                  <span className="text-3xl font-black text-slate-200 font-heading">
                    {step.num}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 font-heading">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. BECOME A TUTOR CALLOUT (Dynamic CMS)
      ───────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#081533] p-8 sm:p-14 text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 border border-slate-800/90 shadow-2xl relative overflow-hidden">
          {/* Subtle background gradient glow */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-4 max-w-2xl text-left relative z-10">
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3.5 py-1 rounded-full">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              {becomeTutor.badge}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white font-heading tracking-tight leading-tight">
              {becomeTutor.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              {becomeTutor.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300 pt-2">
              {(becomeTutor.bulletPoints || []).map((bullet: string, idx: number) => (
                <span key={idx} className="flex items-center gap-1.5 text-emerald-400">
                  <Check className="h-4 w-4 stroke-[3]" /> {bullet}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0 relative z-10">
            <Link href="/onboarding/tutor" className="w-full sm:w-auto">
              <Button
                variant="default"
                size="lg"
                className="w-full sm:w-auto font-extrabold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-8 py-3.5 shadow-glow rounded-xl text-sm cursor-pointer"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                {becomeTutor.ctaButtonText || "Apply as a Tutor"}
              </Button>
            </Link>
            <Link href="/how-it-works" className="w-full sm:w-auto">
              <button
                type="button"
                className="w-full sm:w-auto h-12 px-6 rounded-xl border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-xs sm:text-sm font-bold text-white transition-all text-center flex items-center justify-center cursor-pointer"
              >
                {becomeTutor.secondaryButtonText || "How It Works for Tutors"}
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          8. FREQUENTLY ASKED QUESTIONS (Dynamic CMS FAQs)
      ───────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.18em] text-[#059669] block">
            {faqSection.pretitle}
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-[-0.02em] leading-tight">
            {faqSection.title}
          </h2>
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-card space-y-4 divide-y divide-slate-100">
          {faqs.map((faq: any, idx: number) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="pt-4 first:pt-0">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left py-2 font-bold text-sm sm:text-base text-slate-900 hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform ${
                      isOpen ? "rotate-180 text-emerald-600" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed animate-fade-in pr-4">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Booking Modal */}
      <BookingModal
        tutor={bookingTutor}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </div>
  );
}
