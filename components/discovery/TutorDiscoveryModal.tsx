"use client";

import * as React from "react";
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
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { BookingModal } from "@/components/booking/BookingModal";
import { tutorService } from "@/services/tutorService";
import { TutorProfile } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface TutorDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTutorToBook?: (tutor: TutorProfile) => void;
  initialTutors?: TutorProfile[];
}

const popularSubjects = [
  { id: "english", name: "English", icon: "🇬🇧", category: "Languages" },
  { id: "mathematics", name: "Mathematics", icon: "📐", category: "STEM" },
  { id: "physics", name: "Physics", icon: "⚛️", category: "STEM" },
  { id: "chemistry", name: "Chemistry", icon: "🧪", category: "STEM" },
  { id: "spanish", name: "Spanish", icon: "🇪🇸", category: "Languages" },
  { id: "python-data-science", name: "Python & Coding", icon: "💻", category: "Coding" },
  { id: "ielts-toefl-prep", name: "IELTS & TOEFL Prep", icon: "🎯", category: "Exam Prep" },
  { id: "biology", name: "Biology", icon: "🧬", category: "STEM" },
  { id: "business-finance", name: "Business & Finance", icon: "📊", category: "Business" },
  { id: "french", name: "French", icon: "🇫🇷", category: "Languages" },
];

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

export function TutorDiscoveryModal({
  isOpen,
  onClose,
  onSelectTutorToBook,
  initialTutors,
}: TutorDiscoveryModalProps) {
  const router = useRouter();

  // Multi-step questionnaire state: 1 (Subject) -> 2 (Goal) -> 3 (Level) -> 4 (Schedule) -> 5 (Budget) -> 6 (Account) -> 7 (Results)
  const [step, setStep] = React.useState<number>(1);
  const [selectedSubject, setSelectedSubject] = React.useState<string>("english");
  const [customSubjectQuery, setCustomSubjectQuery] = React.useState<string>("");
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

  // Tutors & Matching State (initialized with initialTutors to prevent empty state / errors)
  const [allTutors, setAllTutors] = React.useState<TutorProfile[]>(initialTutors || []);
  const [matchedTutors, setMatchedTutors] = React.useState<any[]>([]);
  const [isMatchingLoading, setIsMatchingLoading] = React.useState(false);

  // Embedded booking modal state
  const [bookingTutor, setBookingTutor] = React.useState<TutorProfile | null>(null);
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);

  // Check auth & fetch tutors on modal open
  React.useEffect(() => {
    if (!isOpen) return;

    setStep(1);
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

    // 2. Fetch Tutors for Matching with full defensive fallbacks
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

  // Calculate Matches Algorithm
  const computeMatches = React.useCallback(() => {
    setIsMatchingLoading(true);

    const activeSubjectName = customSubjectQuery.trim()
      ? customSubjectQuery.trim().toLowerCase()
      : (selectedSubject || "").toLowerCase();

    const tutorList = Array.isArray(allTutors) && allTutors.length > 0 ? allTutors : (initialTutors || []);

    const scored = tutorList
      .filter((tutor) => tutor && typeof tutor === "object")
      .map((tutor) => {
        let score = 70; // baseline for verified tutor

        // Check subject match
        const tutorSubjects = (Array.isArray(tutor.subjects) ? tutor.subjects : []).map((s: any) =>
          (s?.subject?.name || s?.name || "").toLowerCase()
        );
        const hasDirectSubject = tutorSubjects.some((s) => s.includes(activeSubjectName) || activeSubjectName.includes(s));
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
            ? `Specializes in ${tutorSubjects[0] || "your goals"}`
            : "Top-rated educator matching your learning level",
        };
      });

    // Sort by matchScore desc
    scored.sort((a, b) => b.matchScore - a.matchScore);
    setMatchedTutors(scored.slice(0, 4));
    setIsMatchingLoading(false);
  }, [allTutors, initialTutors, customSubjectQuery, selectedSubject, selectedBudget]);

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
          setAuthError(data.error || "Registration failed. Please check your details.");
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
    const query = customSubjectQuery.trim() || selectedSubject;
    router.push(`/find-tutors?subject=${encodeURIComponent(query)}`);
  };

  if (!isOpen) return null;

  // Total steps for progress bar
  const totalSteps = currentUser?.id ? 6 : 7;
  const currentStepDisplay = step === 7 ? (currentUser?.id ? 6 : 7) : step;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="matchmaker-title"
    >
      {/* Frosted Glass Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Adaptive Responsive Modal: Bottom Drawer on Mobile (<640px) vs Centered Floating Dialog (>=640px) */}
      <div className="relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden animate-fade-in-scale">
        
        {/* Mobile Drag Indicator Handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* ── Header ── */}
        <div className="px-5 sm:px-7 pt-4 sm:pt-6 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#14209C] bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-100/80">
                <Sparkles className="h-3.5 w-3.5 fill-[#14209C]" />
                Tutor Matchmaker
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                Step {currentStepDisplay} of {totalSteps}
              </span>
            </div>
            <h3 id="matchmaker-title" className="text-lg sm:text-xl font-black text-slate-900 font-heading">
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
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none"
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
        <div className="p-5 sm:p-7 overflow-y-auto overscroll-contain flex-1 space-y-6">

          {/* ─────────────────────────────────────────────────────────────
              STEP 1: SUBJECT SELECTION
          ───────────────────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-xs sm:text-sm text-slate-500">
                Select a popular subject or type any topic to find verified specialists.
              </p>

              {/* Quick Search */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Or type a custom subject (e.g. Organic Chemistry, French, AP Calc)..."
                  value={customSubjectQuery}
                  onChange={(e) => setCustomSubjectQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
                />
              </div>

              {/* Grid of Subject Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {popularSubjects.map((sub) => {
                  const isSelected =
                    !customSubjectQuery && selectedSubject === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        setSelectedSubject(sub.id);
                        setCustomSubjectQuery("");
                      }}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                        isSelected
                          ? "border-[#14209C] bg-brand-50/60 ring-2 ring-[#14209C] shadow-xs"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <span className="text-2xl">{sub.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {sub.name}
                        </p>
                        <span className="text-[10px] text-slate-400 font-medium block">
                          {sub.category}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 2: LEARNING GOAL
          ───────────────────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-3 animate-fade-in">
              <p className="text-xs sm:text-sm text-slate-500">
                Understanding your motivation helps us match you with educators who excel in your specific journey.
              </p>

              <div className="space-y-2.5 pt-1">
                {learningGoals.map((g) => {
                  const Icon = g.icon;
                  const isSelected = selectedGoal === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedGoal(g.id)}
                      className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all ${
                        isSelected
                          ? "border-[#14209C] bg-brand-50/60 ring-2 ring-[#14209C] shadow-xs"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-xl shrink-0 ${
                          isSelected
                            ? "bg-[#14209C] text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900">
                          {g.title}
                        </p>
                        <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
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
            <div className="space-y-3 animate-fade-in">
              <p className="text-xs sm:text-sm text-slate-500">
                What best describes your current grasp of this subject?
              </p>

              <div className="space-y-2.5 pt-1">
                {proficiencyLevels.map((lvl) => {
                  const isSelected = selectedLevel === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setSelectedLevel(lvl.id)}
                      className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all ${
                        isSelected
                          ? "border-[#14209C] bg-brand-50/60 ring-2 ring-[#14209C] shadow-xs"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-900">{lvl.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{lvl.sub}</p>
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
            <div className="space-y-3 animate-fade-in">
              <p className="text-xs sm:text-sm text-slate-500">
                When during the day are you usually available for online lessons?
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {schedulePreferences.map((sched) => {
                  const isSelected = selectedSchedule === sched.id;
                  return (
                    <button
                      key={sched.id}
                      type="button"
                      onClick={() => setSelectedSchedule(sched.id)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? "border-[#14209C] bg-brand-50/60 ring-2 ring-[#14209C] shadow-xs"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {sched.label}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-[#14209C]" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{sched.time}</p>
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
            <div className="space-y-3 animate-fade-in">
              <p className="text-xs sm:text-sm text-slate-500">
                What hourly lesson rate feels most comfortable for you?
              </p>

              <div className="space-y-2.5 pt-1">
                {budgetRanges.map((b) => {
                  const isSelected = selectedBudget === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBudget(b.id)}
                      className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all ${
                        isSelected
                          ? "border-[#14209C] bg-brand-50/60 ring-2 ring-[#14209C] shadow-xs"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-900">{b.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{b.sub}</p>
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
            <form onSubmit={handleAccountSubmit} className="space-y-4 animate-fade-in">
              <div className="p-3.5 rounded-2xl bg-brand-50 border border-brand-100/80 flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-[#14209C] shrink-0 mt-0.5" />
                <div className="text-xs text-brand-950">
                  <p className="font-bold">Save your matches & trial discount</p>
                  <p className="text-slate-600 mt-0.5">
                    Creating your account ensures your matches are saved and you qualify for the 100% satisfaction guarantee.
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
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
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
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    authTab === "login"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Sign In to Existing
                </button>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{authError}</span>
                </div>
              )}

              {authTab === "register" ? (
                <div className="space-y-3">
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
                        className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
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
                        className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
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
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
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
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
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
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
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
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="default"
                size="lg"
                className="w-full font-bold bg-[#14209C] hover:bg-[#0f1877] text-white rounded-xl shadow-xs"
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
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700">
                  {matchedTutors.length} Top Matches Recommended
                </span>
                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 100% Satisfaction Guarantee
                </span>
              </div>

              {matchedTutors.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm font-bold text-slate-700">
                    No exact tutor found with these precise filters.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Try exploring our wider directory with all 250+ verified instructors.
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
                <div className="space-y-3">
                  {matchedTutors.map(({ tutor, matchScore, highlight }) => {
                    const name = tutor.user?.displayName || (tutor as any).displayName || "Verified Educator";
                    const avatar = tutor.user?.avatarUrl || (tutor as any).avatarUrl;
                    const hourly = tutor.hourlyRate || 40;
                    const trialRate = Math.round(hourly / 2 * 0.7); // 30% intro discount
                    const primarySub = tutor.subjects?.[0]?.subject?.name || tutor.subjects?.[0]?.name || "General Tutoring";

                    return (
                      <div
                        key={tutor.id}
                        className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-xs hover:shadow-md transition-all space-y-3"
                      >
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
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm truncate">
                                  {name}
                                </span>
                                {tutor.verificationStatus === "APPROVED" && (
                                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 truncate">
                                {primarySub} · {tutor.headline || "Certified Instructor"}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-600">
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
                            <span className="inline-block text-[11px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full mb-1">
                              {matchScore}% Match
                            </span>
                            <div className="text-sm font-black text-slate-950 font-heading">
                              {formatCurrency(hourly, tutor.currency || "USD")}
                              <span className="text-[10px] text-slate-400 font-normal block">/ 50-min</span>
                            </div>
                          </div>
                        </div>

                        {/* Match Reason Tag */}
                        <div className="flex items-center justify-between text-[11px] bg-slate-50 px-3 py-1.5 rounded-xl text-slate-600">
                          <span className="truncate">{highlight}</span>
                          <span className="font-semibold text-emerald-700 shrink-0 ml-2">
                            Trial: {formatCurrency(trialRate, tutor.currency || "USD")}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-1">
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
        <div className="px-5 sm:px-7 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-200 text-xs font-bold"
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
              className="rounded-xl bg-[#14209C] hover:bg-[#0f1877] text-white text-xs font-bold shadow-xs"
              onClick={handleNext}
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
            >
              Continue
            </Button>
          )}

          {step === 7 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-300 text-xs font-bold text-slate-800"
              onClick={handleViewAllMatching}
              rightIcon={<ExternalLink className="h-3.5 w-3.5" />}
            >
              Browse All Matches
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
}
