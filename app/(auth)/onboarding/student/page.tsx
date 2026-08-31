"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Clock,
  Target,
  Sparkles,
  Briefcase,
  GraduationCap,
  Plane,
  Heart,
  Globe2,
  DollarSign,
  Star,
  Check,
  CheckCircle2,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Award,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Logo } from "@/components/ui/Logo";
import { tutorService } from "@/services/tutorService";
import { studentService } from "@/services/studentService";
import { Subject, TutorProfile } from "@/types";
import { formatCurrency } from "@/lib/utils";

// Motivation presets closely resembling Preply's goal discovery
const MOTIVATIONS = [
  {
    id: "career",
    title: "Career & Business",
    desc: "Ace interviews, write professional emails, and prepare for international business.",
    icon: Briefcase,
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    id: "exams",
    title: "School, Exams & Tests",
    desc: "Prepare for IELTS, TOEFL, SAT, AP, GCSE, or university coursework.",
    icon: GraduationCap,
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    id: "travel",
    title: "Travel & Daily Conversation",
    desc: "Speak with locals, navigate dining, and make friends abroad with confidence.",
    icon: Plane,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    id: "relocation",
    title: "Living Abroad & Immigration",
    desc: "Settle into a new country, understand culture, and handle paperwork smoothly.",
    icon: Globe2,
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    id: "kids",
    title: "For Kids & Teenagers",
    desc: "Engaging, interactive lessons designed to make learning joyful for young minds.",
    icon: Heart,
    color: "bg-rose-50 text-rose-700 border-rose-200",
  },
  {
    id: "growth",
    title: "Personal Growth & Hobby",
    desc: "Learn a new language or discipline simply for the love of continuous self-improvement.",
    icon: Sparkles,
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
];

// CEFR-aligned Skill Level presets
const LEVELS = [
  {
    id: "Beginner",
    title: "Complete Beginner",
    badge: "A1",
    desc: "I am starting from scratch. I know very little or nothing yet.",
  },
  {
    id: "Elementary",
    title: "Elementary",
    badge: "A2",
    desc: "I understand basic everyday expressions and simple phrases.",
  },
  {
    id: "Intermediate",
    title: "Intermediate",
    badge: "B1 - B2",
    desc: "I can hold simple conversations, express opinions, and understand main points.",
  },
  {
    id: "Advanced",
    title: "Advanced / Fluent",
    badge: "C1 - C2",
    desc: "I speak comfortably and want to polish nuance, accent, and technical mastery.",
  },
];

// Weekly frequency pace
const PACES = [
  {
    id: "casual",
    title: "Casual Pace",
    sessions: "1 lesson / week",
    hours: 2,
    desc: "Great for light review, homework help, and low-pressure practice.",
  },
  {
    id: "recommended",
    title: "Steady Progress",
    sessions: "2 – 3 lessons / week",
    hours: 5,
    isPopular: true,
    desc: "Recommended for steady progress and noticeable fluency within 6 weeks.",
  },
  {
    id: "intensive",
    title: "Intensive Immersion",
    sessions: "4+ lessons / week",
    hours: 8,
    desc: "Best for urgent exam deadlines, rapid job interview prep, or relocation.",
  },
];

// Budget per hour ranges
const BUDGET_RANGES = [
  { id: "budget", label: "$15 – $25/hr", desc: "Great value & rising tutors" },
  { id: "standard", label: "$25 – $45/hr", desc: "Experienced certified educators", isPopular: true },
  { id: "premium", label: "$45 – $75+/hr", desc: "Senior professors & master specialists" },
];

export default function StudentOnboardingPage() {
  const router = useRouter();

  // Multi-step progress (1 to 5)
  const [step, setStep] = React.useState(1);
  const totalSteps = 5;

  // Selections state
  const [subjectsList, setSubjectsList] = React.useState<Subject[]>([]);
  const [searchSubject, setSearchSubject] = React.useState("");
  const [selectedSubject, setSelectedSubject] = React.useState<Subject | null>(null);
  const [selectedMotivation, setSelectedMotivation] = React.useState(MOTIVATIONS[0]);
  const [selectedLevel, setSelectedLevel] = React.useState(LEVELS[1]);
  const [selectedPace, setSelectedPace] = React.useState(PACES[1]);
  const [selectedBudget, setSelectedBudget] = React.useState(BUDGET_RANGES[1]);
  const [customGoal, setCustomGoal] = React.useState("");

  // Matched tutors state for step 5
  const [matchedTutors, setMatchedTutors] = React.useState<TutorProfile[]>([]);
  const [loadingTutors, setLoadingTutors] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Load subject taxonomy from database
  React.useEffect(() => {
    tutorService.getAllSubjects().then((subs) => {
      if (subs && subs.length > 0) {
        setSubjectsList(subs);
        // Default to first popular subject (English or Mathematics)
        const def = subs.find((s) => s.slug === "english" || s.slug === "mathematics") || subs[0];
        setSelectedSubject(def);
      }
    });
  }, []);

  // Filtered subjects for search
  const filteredSubjects = React.useMemo(() => {
    if (!searchSubject.trim()) return subjectsList;
    const q = searchSubject.toLowerCase();
    return subjectsList.filter(
      (s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
    );
  }, [subjectsList, searchSubject]);

  // When reaching step 5 (Smart Match Reveal), query real matching tutors
  React.useEffect(() => {
    if (step === 5 && selectedSubject) {
      setLoadingTutors(true);
      tutorService
        .getTutors({
          subject: selectedSubject.slug,
          limit: 3,
        })
        .then((res) => {
          setMatchedTutors(res.tutors || []);
        })
        .catch(() => {
          setMatchedTutors([]);
        })
        .finally(() => {
          setLoadingTutors(false);
        });
    }
  }, [step, selectedSubject]);

  const handleFinishOnboarding = async (destination: "tutors" | "dashboard" = "dashboard") => {
    setSaving(true);
    const primaryGoalTitle = customGoal.trim() || `${selectedMotivation.title} in ${selectedSubject?.name || "General Studies"}`;

    try {
      await studentService.submitOnboarding({
        targetExam: primaryGoalTitle,
        currentLevel: selectedLevel.id,
        weeklyStudyHoursTarget: selectedPace.hours,
        initialGoalTitle: primaryGoalTitle,
      });
    } catch (err) {
      console.error("[Student Onboarding Save Error]", err);
    } finally {
      setSaving(false);
      if (destination === "tutors" && selectedSubject) {
        router.push(`/find-tutors?subject=${encodeURIComponent(selectedSubject.slug)}`);
      } else {
        router.push("/student");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-900">
      {/* ── Top Header Navigation Bar ── */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo size="default" href="/" />
          <div className="hidden sm:flex items-center gap-1.5 pl-4 border-l border-slate-200 text-xs font-semibold text-slate-500">
            <span>Student Onboarding</span>
          </div>
        </div>

        {/* Progress Dots / Bar */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden xs:block">
            <span className="text-xs font-bold text-slate-700 font-mono">
              Step {step} of {totalSteps}
            </span>
          </div>
          <div className="w-24 sm:w-36 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-[#14209C] rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
          <button
            type="button"
            onClick={() => handleFinishOnboarding("dashboard")}
            className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors ml-2"
          >
            Skip for now
          </button>
        </div>
      </header>

      {/* ── Main Content Container ── */}
      <main className="flex-1 flex flex-col justify-center max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-card transition-all">
          
          {/* ══════════════════════════════════════════════════════════════
              STEP 1: SUBJECT DISCOVERY
             ══════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center sm:text-left space-y-1">
                <Badge variant="subtle" size="sm" className="font-bold text-[#14209C] bg-indigo-50 border-indigo-100">
                  Step 1 · Subject Choice
                </Badge>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  What would you like to learn?
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  Choose the subject or language you want 1-on-1 tutoring in. You can always add more subjects later.
                </p>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search subjects (e.g. English, Calculus, Python, IELTS, French)..."
                  value={searchSubject}
                  onChange={(e) => setSearchSubject(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#14209C] transition-all"
                />
              </div>

              {/* Subjects Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {filteredSubjects.length === 0 ? (
                  <div className="col-span-full py-10 text-center text-xs text-slate-400">
                    No subjects found matching &quot;{searchSubject}&quot;.
                  </div>
                ) : (
                  filteredSubjects.map((sub) => {
                    const isSelected = selectedSubject?.id === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setSelectedSubject(sub)}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-2 ${
                          isSelected
                            ? "border-[#14209C] bg-[#14209C]/5 text-[#14209C] ring-2 ring-[#14209C]/20 font-bold shadow-xs scale-[1.01]"
                            : "border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/60 font-medium"
                        }`}
                      >
                        <div className="truncate">
                          <span className="block text-xs truncate">{sub.name}</span>
                          <span className="block text-[10px] text-slate-400 truncate">{sub.category}</span>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-[#14209C] shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-400 font-medium">
                  Selected: <strong className="text-slate-800">{selectedSubject?.name || "None"}</strong>
                </span>
                <Button
                  variant="default"
                  size="lg"
                  disabled={!selectedSubject}
                  onClick={() => setStep(2)}
                  className="font-bold bg-[#14209C] hover:bg-[#0e176b] text-white flex items-center gap-2 shadow-xs"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              STEP 2: MOTIVATION & GOAL
             ══════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center sm:text-left space-y-1">
                <Badge variant="subtle" size="sm" className="font-bold text-[#14209C] bg-indigo-50 border-indigo-100">
                  Step 2 · Motivation
                </Badge>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Why are you learning {selectedSubject?.name || "this subject"}?
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  Tutors customize their lessons and curriculum based on your primary objective.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MOTIVATIONS.map((mot) => {
                  const Icon = mot.icon;
                  const isSelected = selectedMotivation.id === mot.id;
                  return (
                    <button
                      key={mot.id}
                      type="button"
                      onClick={() => setSelectedMotivation(mot)}
                      className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                        isSelected
                          ? "border-[#14209C] bg-[#14209C]/5 ring-2 ring-[#14209C]/20 shadow-xs"
                          : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl border shrink-0 ${mot.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <strong className={`block text-xs font-bold ${isSelected ? "text-[#14209C]" : "text-slate-900"}`}>
                          {mot.title}
                        </strong>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          {mot.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setStep(1)}
                  className="font-semibold text-slate-600 flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
                <Button
                  variant="default"
                  size="lg"
                  onClick={() => setStep(3)}
                  className="font-bold bg-[#14209C] hover:bg-[#0e176b] text-white flex items-center gap-2 shadow-xs"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              STEP 3: CURRENT LEVEL
             ══════════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center sm:text-left space-y-1">
                <Badge variant="subtle" size="sm" className="font-bold text-[#14209C] bg-indigo-50 border-indigo-100">
                  Step 3 · Proficiency Level
                </Badge>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  What is your current level in {selectedSubject?.name}?
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  This helps match tutors who specialize in your specific learning stage.
                </p>
              </div>

              <div className="space-y-3">
                {LEVELS.map((lvl) => {
                  const isSelected = selectedLevel.id === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setSelectedLevel(lvl)}
                      className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-4 ${
                        isSelected
                          ? "border-[#14209C] bg-[#14209C]/5 ring-2 ring-[#14209C]/20 shadow-xs"
                          : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <strong className={`text-xs font-bold ${isSelected ? "text-[#14209C]" : "text-slate-900"}`}>
                            {lvl.title}
                          </strong>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono">
                            {lvl.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{lvl.desc}</p>
                      </div>

                      <div
                        className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? "border-[#14209C] bg-[#14209C] text-white" : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setStep(2)}
                  className="font-semibold text-slate-600 flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
                <Button
                  variant="default"
                  size="lg"
                  onClick={() => setStep(4)}
                  className="font-bold bg-[#14209C] hover:bg-[#0e176b] text-white flex items-center gap-2 shadow-xs"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              STEP 4: SCHEDULE & BUDGET PREFERENCE
             ══════════════════════════════════════════════════════════════ */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center sm:text-left space-y-1">
                <Badge variant="subtle" size="sm" className="font-bold text-[#14209C] bg-indigo-50 border-indigo-100">
                  Step 4 · Commitment & Budget
                </Badge>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  How often would you like to practice?
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  Select your preferred weekly pace and budget per lesson.
                </p>
              </div>

              {/* Pace Selection */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Weekly Practice Target
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {PACES.map((p) => {
                    const isSelected = selectedPace.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPace(p)}
                        className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? "border-[#14209C] bg-[#14209C]/5 ring-2 ring-[#14209C]/20 shadow-xs"
                            : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                        }`}
                      >
                        {p.isPopular && (
                          <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-[9px] font-extrabold text-amber-900 uppercase tracking-wider">
                            Popular
                          </span>
                        )}
                        <div>
                          <strong className={`block text-xs font-bold ${isSelected ? "text-[#14209C]" : "text-slate-900"}`}>
                            {p.title}
                          </strong>
                          <span className="text-[11px] font-semibold text-slate-700 block mt-0.5">{p.sessions}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2">{p.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Budget Range Selection */}
              <div className="space-y-2.5 pt-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Hourly Budget Preference
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {BUDGET_RANGES.map((b) => {
                    const isSelected = selectedBudget.id === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBudget(b)}
                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? "border-[#14209C] bg-[#14209C]/5 ring-2 ring-[#14209C]/20 shadow-xs"
                            : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                        }`}
                      >
                        <strong className={`block text-xs font-bold font-mono ${isSelected ? "text-[#14209C]" : "text-slate-900"}`}>
                          {b.label}
                        </strong>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">{b.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Custom Goal input */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Specific target exam or date (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. IELTS 7.5 by November, AP Calculus exam prep"
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
                />
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setStep(3)}
                  className="font-semibold text-slate-600 flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
                <Button
                  variant="default"
                  size="lg"
                  onClick={() => setStep(5)}
                  className="font-bold bg-[#14209C] hover:bg-[#0e176b] text-white flex items-center gap-2 shadow-xs"
                >
                  <span>See Matched Tutors</span>
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              STEP 5: SMART MATCH REVEAL & WARM WELCOME
             ══════════════════════════════════════════════════════════════ */}
          {step === 5 && (
            <div className="space-y-6 animate-fade-in">
              {/* Success Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center sm:text-left flex flex-col sm:flex-row items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shrink-0 shadow-xs">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="space-y-0.5">
                  <h2 className="text-base sm:text-lg font-black text-emerald-950">
                    We found your top tutor matches for {selectedSubject?.name}!
                  </h2>
                  <p className="text-xs text-emerald-800">
                    Personalized for: <strong>{selectedMotivation.title}</strong> · {selectedLevel.title} · {selectedPace.sessions}
                  </p>
                </div>
              </div>

              {/* Matched Tutors List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 uppercase tracking-wider">
                    Recommended Educators ({matchedTutors.length})
                  </span>
                  <span className="text-slate-400 font-medium">100% Satisfaction Guarantee</span>
                </div>

                {loadingTutors ? (
                  <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                    <div className="animate-spin h-6 w-6 border-2 border-[#14209C] border-t-transparent rounded-full mx-auto" />
                    <p>Finding available accredited tutors...</p>
                  </div>
                ) : matchedTutors.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500">
                    <p className="font-semibold text-slate-800">Great tutors are available!</p>
                    <p className="mt-0.5">Browse all verified educators across 16+ academic disciplines.</p>
                  </div>
                ) : (
                  matchedTutors.map((tut) => (
                    <div
                      key={tut.id}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <Avatar
                          src={tut.user.avatarUrl}
                          fallbackName={tut.user.displayName}
                          size="lg"
                          className="shrink-0 ring-2 ring-slate-100"
                        />
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <strong className="text-sm font-bold text-slate-900 truncate">
                              {tut.user.displayName}
                            </strong>
                            <Badge variant="emerald-solid" size="sm" className="text-[10px] font-bold">
                              Verified
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 truncate">{tut.headline || `${tut.user.displayName} · Expert Tutor`}</p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-600 pt-0.5">
                            <span className="flex items-center gap-1 font-bold text-amber-600">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {tut.averageRating > 0 ? tut.averageRating.toFixed(1) : "5.0"}
                            </span>
                            <span className="text-slate-400">·</span>
                            <span>{tut.reviewCount || 0} reviews</span>
                            <span className="text-slate-400">·</span>
                            <span className="font-mono font-bold text-slate-900">
                              {formatCurrency(tut.hourlyRate, tut.currency)}/hr
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                        <Link
                          href={`/tutors/${tut.slug}`}
                          className="w-full sm:w-auto"
                        >
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full font-bold bg-[#14209C] hover:bg-[#0e176b] text-white text-xs"
                          >
                            Book Trial Lesson
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setStep(4)}
                  className="w-full sm:w-auto font-semibold text-slate-600 flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Adjust Preferences</span>
                </Button>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    isLoading={saving}
                    onClick={() => handleFinishOnboarding("tutors")}
                    className="w-full sm:w-auto font-bold border-[#14209C] text-[#14209C] hover:bg-[#14209C]/5"
                  >
                    Explore All {selectedSubject?.name} Tutors
                  </Button>
                  <Button
                    variant="default"
                    size="lg"
                    isLoading={saving}
                    onClick={() => handleFinishOnboarding("dashboard")}
                    className="w-full sm:w-auto font-bold bg-[#14209C] hover:bg-[#0e176b] text-white flex items-center justify-center gap-2 shadow-xs"
                  >
                    <span>Launch My Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── Footer Info ── */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-100 bg-white">
        © {new Date().getFullYear()} Sabina LMS. 100% Satisfaction Guarantee on all first trial lessons.
      </footer>
    </div>
  );
}
