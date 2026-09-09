"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Search,
  BookOpen,
  Target,
  GraduationCap,
  Clock,
  DollarSign,
  ShieldCheck,
  Star,
  Calendar,
  Lock,
  UserCheck,
  AlertCircle,
  ExternalLink,
  Binary,
  Atom,
  FlaskConical,
  Dna,
  Code2,
  BarChart3,
  Languages,
  Briefcase,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { BookingModal } from "@/components/booking/BookingModal";
import { tutorService } from "@/services/tutorService";
import { TutorProfile, Subject } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface TutorDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTutorToBook?: (tutor: TutorProfile) => void;
  initialTutors?: TutorProfile[];
  initialSubjects?: Subject[];
}

const DEFAULT_FALLBACK_SUBJECTS: Subject[] = [
  { id: "english", name: "English", slug: "english", category: "Languages", tutorCount: 45 },
  { id: "mathematics", name: "Mathematics", slug: "mathematics", category: "STEM", tutorCount: 38 },
  { id: "physics", name: "Physics", slug: "physics", category: "STEM", tutorCount: 24 },
  { id: "chemistry", name: "Chemistry", slug: "chemistry", category: "STEM", tutorCount: 21 },
  { id: "biology", name: "Biology", slug: "biology", category: "STEM", tutorCount: 19 },
  { id: "spanish", name: "Spanish", slug: "spanish", category: "Languages", tutorCount: 32 },
  { id: "french", name: "French", slug: "french", category: "Languages", tutorCount: 22 },
  { id: "python-coding", name: "Python & Coding", slug: "python-data-science", category: "Coding", tutorCount: 29 },
  { id: "web-dev", name: "Web Development", slug: "web-development", category: "Coding", tutorCount: 26 },
  { id: "ielts-toefl", name: "IELTS & TOEFL Prep", slug: "ielts-toefl-prep", category: "Exam Prep", tutorCount: 35 },
  { id: "sat-prep", name: "SAT & ACT Prep", slug: "sat-act-prep", category: "Exam Prep", tutorCount: 18 },
  { id: "business-finance", name: "Business & Finance", slug: "business-finance", category: "Business", tutorCount: 20 },
];

function SubjectIconBadge({ name, category }: { name?: string; category?: string }) {
  const n = (name || "").toLowerCase();
  const c = (category || "").toLowerCase();

  if (n.includes("math") || n.includes("calc") || n.includes("algeb") || n.includes("geomet")) {
    return (
      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 ring-1 ring-indigo-100">
        <Binary className="w-5 h-5" />
      </div>
    );
  }
  if (n.includes("physic")) {
    return (
      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 ring-1 ring-purple-100">
        <Atom className="w-5 h-5" />
      </div>
    );
  }
  if (n.includes("chem")) {
    return (
      <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 ring-1 ring-teal-100">
        <FlaskConical className="w-5 h-5" />
      </div>
    );
  }
  if (n.includes("bio") || n.includes("dna") || n.includes("genet")) {
    return (
      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 ring-1 ring-emerald-100">
        <Dna className="w-5 h-5" />
      </div>
    );
  }
  if (n.includes("code") || n.includes("python") || n.includes("program") || n.includes("tech") || c.includes("coding")) {
    return (
      <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 ring-1 ring-sky-100">
        <Code2 className="w-5 h-5" />
      </div>
    );
  }
  if (n.includes("ielts") || n.includes("toefl") || n.includes("exam") || n.includes("sat") || c.includes("exam")) {
    return (
      <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 ring-1 ring-rose-100">
        <Target className="w-5 h-5" />
      </div>
    );
  }
  if (n.includes("business") || n.includes("finance") || n.includes("econ") || c.includes("business")) {
    return (
      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 ring-1 ring-amber-100">
        <BarChart3 className="w-5 h-5" />
      </div>
    );
  }
  if (n.includes("english") || n.includes("spanish") || n.includes("french") || n.includes("german") || n.includes("mandarin") || n.includes("lang") || c.includes("lang")) {
    return (
      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 ring-1 ring-blue-100">
        <Languages className="w-5 h-5" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 ring-1 ring-slate-200">
      <BookOpen className="w-5 h-5" />
    </div>
  );
}

const learningGoals = [
  {
    id: "exam",
    title: "Pass an Exam / Test Prep",
    desc: "Targeted prep for IELTS, TOEFL, SAT, AP, GCSE, or school finals",
    icon: Target,
  },
  {
    id: "grades",
    title: "School / University Grades",
    desc: "Master challenging topics, homework assistance & coursework",
    icon: GraduationCap,
  },
  {
    id: "fluency",
    title: "Conversational Fluency",
    desc: "Gain speaking confidence, pronunciation & natural expression",
    icon: BookOpen,
  },
  {
    id: "career",
    title: "Career & Professional Growth",
    desc: "Business communication, technical interview prep & resume skills",
    icon: ShieldCheck,
  },
  {
    id: "beginner",
    title: "Beginner Fundamentals",
    desc: "Starting from scratch with structured step-by-step guidance",
    icon: Sparkles,
  },
];

const proficiencyLevels = [
  { id: "beginner", label: "Beginner", sub: "New to the subject / basic phrases" },
  { id: "intermediate", label: "Intermediate", sub: "Familiar with fundamentals / need polish" },
  { id: "advanced", label: "Advanced / Mastery", sub: "Refining complex nuances & exam readiness" },
];

const schedulePreferences = [
  { id: "morning", label: "Mornings", time: "8:00 AM – 12:00 PM" },
  { id: "afternoon", label: "Afternoons", time: "12:00 PM – 5:00 PM" },
  { id: "evening", label: "Evenings", time: "5:00 PM – 9:00 PM" },
  { id: "weekend", label: "Weekends", time: "Flexible Saturday & Sunday" },
];

const budgetRanges = [
  { id: "any", label: "Any Budget", sub: "Explore all approved tutors" },
  { id: "budget", label: "$15 – $30 / hr", sub: "Budget-friendly certified tutors" },
  { id: "standard", label: "$30 – $55 / hr", sub: "Most popular / seasoned educators" },
  { id: "expert", label: "$55+ / hr", sub: "Senior professors & master coaches" },
];

const categoryTabs = [
  { id: "all", label: "All Disciplines" },
  { id: "Languages", label: "Languages" },
  { id: "STEM", label: "STEM & Math" },
  { id: "Coding", label: "Coding & Tech" },
  { id: "Exam Prep", label: "Exam Prep" },
  { id: "Business", label: "Business & Finance" },
];

export function TutorDiscoveryModal({
  isOpen,
  onClose,
  onSelectTutorToBook,
  initialTutors,
  initialSubjects,
}: TutorDiscoveryModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);

  // Multi-step questionnaire state: 1 (Subject) -> 2 (Goal) -> 3 (Level) -> 4 (Schedule) -> 5 (Budget) -> 6 (Account) -> 7 (Results)
  const [step, setStep] = React.useState<number>(1);

  // Dynamic Subjects & Active Search Filter
  const [subjects, setSubjects] = React.useState<Subject[]>(() => {
    if (initialSubjects && initialSubjects.length > 0) return initialSubjects;
    return DEFAULT_FALLBACK_SUBJECTS;
  });
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [selectedCategoryTab, setSelectedCategoryTab] = React.useState<string>("all");
  const [selectedSubjectSlug, setSelectedSubjectSlug] = React.useState<string>("english");
  const [selectedSubjectName, setSelectedSubjectName] = React.useState<string>("English");

  // Goals, Level, Schedule, Budget
  const [selectedGoal, setSelectedGoal] = React.useState<string>("exam");
  const [selectedLevel, setSelectedLevel] = React.useState<string>("intermediate");
  const [selectedSchedule, setSelectedSchedule] = React.useState<string>("evening");
  const [selectedBudget, setSelectedBudget] = React.useState<string>("standard");

  // Authentication State
  const [currentUser, setCurrentUser] = React.useState<any | null>(null);
  const [authChecking, setAuthChecking] = React.useState(true);
  const [authTab, setAuthTab] = React.useState<"register" | "login">("register");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = React.useState(false);

  // Tutors & Matching State
  const [allTutors, setAllTutors] = React.useState<TutorProfile[]>(initialTutors || []);
  const [matchedTutors, setMatchedTutors] = React.useState<any[]>([]);
  const [isMatchingLoading, setIsMatchingLoading] = React.useState(false);

  // Embedded booking modal state
  const [bookingTutor, setBookingTutor] = React.useState<TutorProfile | null>(null);
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Sync initialSubjects if provided
  React.useEffect(() => {
    if (initialSubjects && initialSubjects.length > 0) {
      setSubjects(initialSubjects);
    }
  }, [initialSubjects]);

  // Sync initialTutors if provided
  React.useEffect(() => {
    if (initialTutors && initialTutors.length > 0) {
      setAllTutors(initialTutors);
    }
  }, [initialTutors]);

  // Check auth & fetch dynamic data on modal open
  React.useEffect(() => {
    if (!isOpen) return;

    setStep(1);
    setSearchQuery("");
    setAuthError(null);
    setAuthChecking(true);

    // 1. Check Session safely
    fetch("/api/auth/session?role=STUDENT")
      .then((res) => (res.ok ? res.json() : { authenticated: false }))
      .then((data) => {
        if (data && data.authenticated && data.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => setCurrentUser(null))
      .finally(() => setAuthChecking(false));

    // 2. Fetch live active subjects from Supabase API
    tutorService
      .getAllSubjects()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSubjects(data);
        }
      })
      .catch((err) => console.error("[TutorDiscoveryModal] Error fetching subjects:", err));

    // 3. Fetch tutors for matching with fallback
    const loadTutors = async () => {
      try {
        if (typeof tutorService?.getAllTutors === "function") {
          const res = await tutorService.getAllTutors();
          if (Array.isArray(res) && res.length > 0) {
            setAllTutors(res);
            return;
          }
        }
        if (typeof tutorService?.getTutors === "function") {
          const res = await tutorService.getTutors({ limit: 50 });
          if (res && Array.isArray(res.tutors) && res.tutors.length > 0) {
            setAllTutors(res.tutors);
            return;
          }
        }
        if (typeof tutorService?.getFeaturedTutors === "function") {
          const featured = await tutorService.getFeaturedTutors();
          if (Array.isArray(featured) && featured.length > 0) {
            setAllTutors(featured);
            return;
          }
        }
      } catch (err) {
        console.error("[TutorDiscoveryModal] Error loading tutors:", err);
      }
    };

    loadTutors();
  }, [isOpen]);

  // Lock body scroll while modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle ESC key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // ── Live Filtered Subjects ──
  const filteredSubjects = React.useMemo(() => {
    let list = Array.isArray(subjects) ? subjects : DEFAULT_FALLBACK_SUBJECTS;

    // Filter by Category Tab
    if (selectedCategoryTab !== "all") {
      list = list.filter((s) => {
        const cat = (s.category || "").toLowerCase();
        const tab = selectedCategoryTab.toLowerCase();
        return cat.includes(tab) || tab.includes(cat);
      });
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (s) =>
          (s.name || "").toLowerCase().includes(q) ||
          (s.category || "").toLowerCase().includes(q) ||
          (s.slug || "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [subjects, selectedCategoryTab, searchQuery]);

  // Check if searchQuery has an exact match in the current filtered list
  const hasExactSearchMatch = React.useMemo(() => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return filteredSubjects.some((s) => (s.name || "").toLowerCase() === q);
  }, [searchQuery, filteredSubjects]);

  const handleSelectSubject = (slug: string, name: string) => {
    setSelectedSubjectSlug(slug);
    setSelectedSubjectName(name);
  };

  // Calculate Matches Algorithm
  const computeMatches = React.useCallback(() => {
    setIsMatchingLoading(true);

    const targetName = (selectedSubjectName || "").trim().toLowerCase();
    const targetSlug = (selectedSubjectSlug || "").trim().toLowerCase();

    const tutorList = Array.isArray(allTutors) && allTutors.length > 0 ? allTutors : (initialTutors || []);

    const scored = tutorList
      .filter((tutor) => tutor && typeof tutor === "object")
      .map((tutor) => {
        let score = 70; // baseline for verified tutor

        // Check subject match
        const tutorSubjects = (Array.isArray(tutor.subjects) ? tutor.subjects : []).map((s: any) =>
          (s?.subject?.name || s?.name || s?.subject?.slug || s?.slug || "").toLowerCase()
        );
        const hasDirectSubject = tutorSubjects.some(
          (s) =>
            s.includes(targetName) ||
            targetName.includes(s) ||
            s.includes(targetSlug) ||
            targetSlug.includes(s)
        );
        if (hasDirectSubject) score += 18;

        // Rating quality
        const rating = Number(tutor.averageRating) || 5.0;
        if (rating >= 4.9) score += 6;
        else if (rating >= 4.7) score += 4;

        // Super tutor or featured
        if (tutor.isSuperTutor) score += 3;
        if (tutor.isFeatured) score += 2;

        // Budget match
        const rate = Number(tutor.hourlyRate) || 40;
        if (selectedBudget === "budget" && rate <= 35) score += 5;
        if (selectedBudget === "standard" && rate >= 25 && rate <= 60) score += 5;
        if (selectedBudget === "expert" && rate >= 50) score += 5;

        const finalPercent = Math.min(99, Math.max(82, score));

        return {
          tutor,
          matchScore: finalPercent,
          highlight: hasDirectSubject
            ? `Specializes in ${selectedSubjectName || tutorSubjects[0] || "your goals"}`
            : "Top-rated educator matching your learning level",
        };
      });

    // Sort by matchScore desc
    scored.sort((a, b) => b.matchScore - a.matchScore);
    setMatchedTutors(scored.slice(0, 4));
    setIsMatchingLoading(false);
  }, [allTutors, initialTutors, selectedSubjectName, selectedSubjectSlug, selectedBudget]);

  // Handle advancing through steps
  const handleNext = () => {
    if (step === 5) {
      // If student is already logged in, skip account creation step (step 6) and compute matches directly
      if (currentUser?.id) {
        computeMatches();
        setStep(7);
      } else {
        setStep(6);
      }
      return;
    }

    if (step === 6) {
      // Complete account step
      computeMatches();
      setStep(7);
      return;
    }

    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (step === 7 && currentUser?.id) {
      setStep(5);
      return;
    }
    setStep((prev) => Math.max(1, prev - 1));
  };

  // Submit Account Registration / Login
  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        setAuthError("Please fill in both email and password.");
        setIsAuthLoading(false);
        return;
      }

      if (password.length < 6) {
        setAuthError("Password must be at least 6 characters.");
        setIsAuthLoading(false);
        return;
      }

      if (authTab === "register") {
        if (!firstName.trim()) {
          setAuthError("Please enter your first name.");
          setIsAuthLoading(false);
          return;
        }

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            password,
            firstName: firstName.trim(),
            lastName: lastName.trim() || "Student",
            role: "STUDENT",
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setAuthError(data.error || "Registration failed. Please check your details or sign in.");
          setIsAuthLoading(false);
          return;
        }

        if (data.user) {
          setCurrentUser(data.user);
        }
      } else {
        // Sign In
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setAuthError(data.error || "Invalid email or password.");
          setIsAuthLoading(false);
          return;
        }

        if (data.user) {
          setCurrentUser(data.user);
        }
      }

      // Successfully authenticated! Advance to results
      computeMatches();
      setStep(7);
    } catch (err: any) {
      setAuthError(err.message || "An unexpected error occurred.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleBookMatchedTutor = (tutor: TutorProfile) => {
    if (onSelectTutorToBook) {
      onSelectTutorToBook(tutor);
      onClose();
    } else {
      setBookingTutor(tutor);
      setIsBookingOpen(true);
    }
  };

  const handleViewAllMatching = () => {
    onClose();
    const query = selectedSubjectSlug || selectedSubjectName;
    router.push(`/find-tutors?subject=${encodeURIComponent(query)}`);
  };

  if (!isOpen || !mounted) return null;

  // Total steps for progress bar
  const totalSteps = currentUser?.id ? 6 : 7;
  const currentStepDisplay = step === 7 ? (currentUser?.id ? 6 : 7) : step;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-sm transition-all duration-200 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="matchmaker-title"
      onClick={onClose}
    >
      {/* ── Flexible Modal Card: Responsive Bottom Sheet on Mobile (<640px) vs Spacious Floating Dialog on Desktop (>=640px) ── */}
      <div
        className="relative w-full max-w-full sm:max-w-3xl lg:max-w-4xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-[100000] flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden border border-slate-200/80 transition-all duration-200 animate-in slide-in-from-bottom sm:zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* ── Header ── */}
        <div className="px-5 sm:px-8 pt-4 sm:pt-6 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#14209C] bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-100/80">
                <Sparkles className="h-3.5 w-3.5 fill-[#14209C]" />
                Tutor Matchmaker
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                Step {currentStepDisplay} of {totalSteps}
              </span>
            </div>
            <h3 id="matchmaker-title" className="text-lg sm:text-2xl font-black text-slate-900 font-heading">
              {step === 1 && "What do you want to learn?"}
              {step === 2 && "What is your main learning goal?"}
              {step === 3 && "What is your current level?"}
              {step === 4 && "When are you free to learn?"}
              {step === 5 && "What is your ideal hourly budget?"}
              {step === 6 && "Create your student account"}
              {step === 7 && "Meet Your Top Matched Tutors"}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
            aria-label="Close matchmaker"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Step Progress Indicator Bar ── */}
        <div className="w-full bg-slate-100 h-1 shrink-0">
          <div
            className="bg-[#14209C] h-1 transition-all duration-300"
            style={{ width: `${(currentStepDisplay / totalSteps) * 100}%` }}
          />
        </div>

        {/* ── Scrollable Body Content ── */}
        <div className="p-5 sm:p-8 overflow-y-auto overscroll-contain flex-1 space-y-6 bg-slate-50/30">

          {/* ─────────────────────────────────────────────────────────────
              STEP 1: DYNAMIC SUBJECT SELECTION & LIVE SEARCH
          ───────────────────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-xs sm:text-sm text-slate-600">
                  Select a discipline or search across our full catalog of certified tutors.
                </p>
                <span className="text-xs font-bold text-[#14209C] bg-brand-50 px-2.5 py-1 rounded-lg shrink-0 self-start sm:self-auto">
                  Selected: {selectedSubjectName}
                </span>
              </div>

              {/* Live Search Input with Clear Button */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search any subject, language or exam (e.g. Calculus, IELTS, Python, French)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-11 pr-10 rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#14209C] placeholder:text-slate-400 font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {categoryTabs.map((tab) => {
                  const isActive = selectedCategoryTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedCategoryTab(tab.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        isActive
                          ? "bg-slate-950 text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Responsive Grid of Subject Tiles (NO TRUNCATION) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {/* Custom Query Card (If searching for something custom) */}
                {searchQuery.trim() && !hasExactSearchMatch && (
                  <button
                    type="button"
                    onClick={() =>
                      handleSelectSubject(
                        `custom-${searchQuery.trim().toLowerCase().replace(/\s+/g, "-")}`,
                        searchQuery.trim()
                      )
                    }
                    className={`col-span-full p-4 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                      selectedSubjectName.toLowerCase() === searchQuery.trim().toLowerCase()
                        ? "border-[#14209C] bg-brand-50/80 ring-2 ring-[#14209C] shadow-sm"
                        : "border-dashed border-brand-300 bg-brand-50/40 hover:bg-brand-50/80"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5 text-[#14209C]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          Learn &quot;{searchQuery.trim()}&quot; with a custom specialist
                        </p>
                        <span className="text-xs text-slate-500">
                          We will match you with expert educators teaching {searchQuery.trim()}
                        </span>
                      </div>
                    </div>
                    {selectedSubjectName.toLowerCase() === searchQuery.trim().toLowerCase() ? (
                      <CheckCircle2 className="w-5 h-5 text-[#14209C] shrink-0" />
                    ) : (
                      <span className="text-xs font-bold text-[#14209C] shrink-0">Select &rarr;</span>
                    )}
                  </button>
                )}

                {/* Filtered Dynamic Subjects */}
                {filteredSubjects.map((sub) => {
                  const isSelected =
                    selectedSubjectSlug === (sub.slug || sub.id) ||
                    selectedSubjectName.toLowerCase() === sub.name.toLowerCase();

                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleSelectSubject(sub.slug || sub.id, sub.name)}
                      className={`p-3.5 sm:p-4 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#14209C] bg-white ring-2 ring-[#14209C] shadow-sm scale-[1.01]"
                          : "border-slate-200/90 hover:border-slate-300 bg-white hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <SubjectIconBadge name={sub.name} category={sub.category} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900 leading-snug">
                            {sub.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">
                              {sub.category}
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="text-[11px] text-emerald-700 font-semibold">
                              {sub.tutorCount || 15}+ tutors
                            </span>
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-[#14209C] shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {filteredSubjects.length === 0 && !searchQuery.trim() && (
                <div className="text-center py-8 bg-white rounded-2xl border border-slate-200">
                  <p className="text-sm font-bold text-slate-700">
                    No subjects found in {selectedCategoryTab}.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 rounded-xl text-xs font-bold"
                    onClick={() => setSelectedCategoryTab("all")}
                  >
                    View All Disciplines
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 2: LEARNING GOAL
          ───────────────────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-xs sm:text-sm text-slate-600">
                Understanding your motivation helps us match you with educators who excel in your specific journey.
              </p>

              <div className="space-y-3 pt-1">
                {learningGoals.map((g) => {
                  const Icon = g.icon;
                  const isSelected = selectedGoal === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedGoal(g.id)}
                      className={`w-full p-4 rounded-2xl border text-left flex items-start gap-4 transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#14209C] bg-white ring-2 ring-[#14209C] shadow-sm scale-[1.005]"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-xl shrink-0 ${
                          isSelected
                            ? "bg-[#14209C] text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900">
                          {g.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {g.desc}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-[#14209C] shrink-0 self-center" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 3: CURRENT LEVEL
          ───────────────────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-xs sm:text-sm text-slate-600">
                What best describes your current grasp of {selectedSubjectName}?
              </p>

              <div className="space-y-3 pt-1">
                {proficiencyLevels.map((lvl) => {
                  const isSelected = selectedLevel === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setSelectedLevel(lvl.id)}
                      className={`w-full p-4 sm:p-5 rounded-2xl border text-left flex items-center justify-between gap-4 transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#14209C] bg-white ring-2 ring-[#14209C] shadow-sm scale-[1.005]"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div>
                        <p className="text-sm sm:text-base font-bold text-slate-900">{lvl.label}</p>
                        <p className="text-xs text-slate-500 mt-1">{lvl.sub}</p>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-[#14209C] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 4: SCHEDULE PREFERENCE
          ───────────────────────────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-xs sm:text-sm text-slate-600">
                When during the day are you usually available for online sessions?
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {schedulePreferences.map((sched) => {
                  const isSelected = selectedSchedule === sched.id;
                  return (
                    <button
                      key={sched.id}
                      type="button"
                      onClick={() => setSelectedSchedule(sched.id)}
                      className={`p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#14209C] bg-white ring-2 ring-[#14209C] shadow-sm"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-400" />
                          {sched.label}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-[#14209C]" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5">{sched.time}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 5: BUDGET
          ───────────────────────────────────────────────────────────── */}
          {step === 5 && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-xs sm:text-sm text-slate-600">
                What hourly lesson rate feels most comfortable for you?
              </p>

              <div className="space-y-3 pt-1">
                {budgetRanges.map((b) => {
                  const isSelected = selectedBudget === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBudget(b.id)}
                      className={`w-full p-4 sm:p-5 rounded-2xl border text-left flex items-center justify-between gap-4 transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#14209C] bg-white ring-2 ring-[#14209C] shadow-sm scale-[1.005]"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div>
                        <p className="text-sm sm:text-base font-bold text-slate-900">{b.label}</p>
                        <p className="text-xs text-slate-500 mt-1">{b.sub}</p>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-[#14209C] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 6: STUDENT ACCOUNT (Guest Only)
          ───────────────────────────────────────────────────────────── */}
          {step === 6 && (
            <form onSubmit={handleAccountSubmit} className="space-y-4 animate-fade-in max-w-lg mx-auto">
              <div className="p-4 rounded-2xl bg-brand-50 border border-brand-100/80 flex items-start gap-3.5">
                <Sparkles className="h-5 w-5 text-[#14209C] shrink-0 mt-0.5" />
                <div className="text-xs text-brand-950">
                  <p className="font-bold">Save your matches &amp; 30% trial discount</p>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    Creating your account ensures your matches are saved and you qualify for our 100% satisfaction guarantee.
                  </p>
                </div>
              </div>

              {/* Tabs: Register vs Login */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab("register");
                    setAuthError(null);
                  }}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
                    authTab === "register"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Create New Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab("login");
                    setAuthError(null);
                  }}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
                    authTab === "login"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Sign In to Existing
                </button>
              </div>

              {authError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{authError}</span>
                </div>
              )}

              {authTab === "register" ? (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        First Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alex"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rivera"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="alex@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="alex@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="default"
                size="lg"
                className="w-full font-bold bg-[#14209C] hover:bg-[#0f1877] text-white rounded-xl shadow-xs h-12 cursor-pointer"
                isLoading={isAuthLoading}
              >
                {authTab === "register" ? "Create Account & View Matches" : "Sign In & View Matches"}
              </Button>
            </form>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 7: MATCHED RESULTS
          ───────────────────────────────────────────────────────────── */}
          {step === 7 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    Recommended Tutors for {selectedSubjectName}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Showing educators matching your level, schedule, and budget
                  </p>
                </div>
                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 100% Satisfaction Guarantee
                </span>
              </div>

              {matchedTutors.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                  <p className="text-base font-bold text-slate-800">
                    No exact tutor found matching these specific filters.
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Explore our comprehensive directory of 250+ verified instructors to find the right fit.
                  </p>
                  <Button
                    variant="default"
                    size="sm"
                    className="mt-4 rounded-xl bg-slate-950 text-white"
                    onClick={handleViewAllMatching}
                  >
                    Browse All Tutors
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {matchedTutors.map(({ tutor, matchScore, highlight }) => {
                    const name = tutor.user?.displayName || (tutor as any).displayName || "Verified Educator";
                    const avatar = tutor.user?.avatarUrl || (tutor as any).avatarUrl;
                    const hourly = tutor.hourlyRate || 40;
                    const trialRate = Math.round((hourly / 2) * 0.7); // 30% intro discount
                    const primarySub = tutor.subjects?.[0]?.subject?.name || tutor.subjects?.[0]?.name || selectedSubjectName;

                    return (
                      <div
                        key={tutor.id}
                        className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <Avatar
                                src={avatar}
                                fallbackName={name}
                                size="md"
                                statusIndicator="online"
                                superTutor={tutor.isSuperTutor}
                                className="shrink-0 ring-2 ring-slate-100"
                              />
                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 text-sm truncate">
                                    {name}
                                  </span>
                                  {tutor.verificationStatus === "APPROVED" && (
                                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 truncate">
                                  {primarySub} · {tutor.headline || "Certified Instructor"}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-slate-600 pt-0.5">
                                  <span className="text-amber-500 font-bold flex items-center gap-0.5">
                                    ★ {tutor.averageRating ? tutor.averageRating.toFixed(1) : "5.0"}
                                  </span>
                                  <span className="text-slate-300">·</span>
                                  <span>{tutor.totalLessons || 120}+ lessons</span>
                                </div>
                              </div>
                            </div>

                            {/* Match Score & Pricing */}
                            <div className="text-right shrink-0">
                              <span className="inline-block text-[11px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full mb-1">
                                {matchScore}% Match
                              </span>
                              <div className="text-sm font-black text-slate-950 font-heading">
                                {formatCurrency(hourly, tutor.currency || "USD")}
                                <span className="text-[10px] text-slate-400 font-normal block">/ 50-min</span>
                              </div>
                            </div>
                          </div>

                          {/* Match Reason Tag */}
                          <div className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-xl text-slate-600">
                            <span className="truncate">{highlight}</span>
                            <span className="font-bold text-emerald-700 shrink-0 ml-2">
                              Trial: {formatCurrency(trialRate, tutor.currency || "USD")}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                          <Link
                            href={`/tutors/${tutor.slug || tutor.id}`}
                            className="flex-1 h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-xs transition-all inline-flex items-center justify-center text-center"
                            onClick={onClose}
                          >
                            View Profile
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleBookMatchedTutor(tutor)}
                            className="flex-1 h-9 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-subtle transition-all cursor-pointer"
                          >
                            <Calendar className="h-3.5 w-3.5 text-slate-300" />
                            <span>Book Lesson</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer Navigation Buttons ── */}
        <div className="px-5 sm:px-8 py-4 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-200 text-xs font-bold cursor-pointer"
              onClick={handleBack}
              leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
            >
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < 6 && (
            <Button
              type="button"
              variant="default"
              size="sm"
              className="rounded-xl bg-[#14209C] hover:bg-[#0f1877] text-white text-xs font-bold shadow-xs px-5 h-10 cursor-pointer"
              onClick={handleNext}
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
            >
              Continue with {selectedSubjectName}
            </Button>
          )}

          {step === 7 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-300 text-xs font-bold text-slate-800 cursor-pointer"
              onClick={handleViewAllMatching}
              rightIcon={<ExternalLink className="h-3.5 w-3.5" />}
            >
              Browse All {selectedSubjectName} Tutors
            </Button>
          )}
        </div>
      </div>

      {/* Embedded Fallback Booking Modal */}
      {bookingTutor && (
        <BookingModal
          tutor={bookingTutor}
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
        />
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
}
