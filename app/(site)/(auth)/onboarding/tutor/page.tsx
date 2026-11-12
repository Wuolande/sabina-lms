"use client";

import * as React from "react";
import Link from "next/link";
import {
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Upload,
  BookOpen,
  DollarSign,
  Globe,
  Award,
  Video,
  Sparkles,
  ShieldCheck,
  Plus,
  Trash2,
  FileText,
  Eye,
  Check,
  Calendar,
  Camera,
  Users,
  Briefcase,
  X,
  ChevronDown,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Textarea } from "@/components/ui/Textarea";
import { Avatar } from "@/components/ui/Avatar";
import { Logo } from "@/components/ui/Logo";
import { FileUploadWithLink } from "@/components/ui/FileUploadWithLink";
import { Subject } from "@/types";
import {
  WORLD_COUNTRIES,
  POPULAR_TIMEZONES,
  detectUserTimezone,
  getYearOptions,
  STANDARD_LANGUAGES,
  PROFICIENCY_LEVELS,
} from "@/src/shared/data/geoData";

const ONBOARDING_STEPS = [
  { id: 1, title: "About You", desc: "Identity & photo", icon: Users },
  { id: 2, title: "Teaching Profile", desc: "Headline & bio", icon: BookOpen },
  { id: 3, title: "Qualifications & Degrees", desc: "Academic credentials", icon: GraduationCap },
  { id: 4, title: "Certifications & Licenses", desc: "Teaching credentials", icon: Award },
  { id: 5, title: "Work Experience", desc: "Career timeline", icon: Briefcase },
  { id: 6, title: "Subjects & Pricing", desc: "Hourly rate & tiers", icon: DollarSign },
  { id: 7, title: "Weekly Availability", desc: "Working schedule", icon: Calendar },
  { id: 8, title: "Video Introduction", desc: "1-min introduction", icon: Video },
  { id: 9, title: "Review & Submit", desc: "Profile verification", icon: ShieldCheck },
];

export default function TutorOnboardingPage() {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [showStepsDrawer, setShowStepsDrawer] = React.useState(false);
  const [subjectsList, setSubjectsList] = React.useState<Subject[]>([]);

  // Smooth scroll to top whenever the step changes (crucial for mobile ergonomics)
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);
  const [countriesList, setCountriesList] = React.useState<any[]>([]);
  const [timezonesList, setTimezonesList] = React.useState<any[]>([]);
  const [languagesList, setLanguagesList] = React.useState<any[]>([]);
  const [platformPolicies, setPlatformPolicies] = React.useState({
    platformFeePercent: 18,
    tutorMinHourlyRate: 15,
    tutorMaxHourlyRate: 250,
    trialLessonDiscountPercent: 30,
    instantBookingEnabled: true,
  });
  const yearOptions = React.useMemo(() => getYearOptions(), []);

  React.useEffect(() => {
    fetch('/api/policies')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          const min = Number(data.tutorMinHourlyRate) || 15;
          const max = Number(data.tutorMaxHourlyRate) || 250;
          const fee = Number(data.platformFeePercent) || 18;
          const trialDisc = Number(data.trialLessonDiscountPercent) || 30;
          const instant = data.instantBookingEnabled ?? true;

          setPlatformPolicies({
            platformFeePercent: fee,
            tutorMinHourlyRate: min,
            tutorMaxHourlyRate: max,
            trialLessonDiscountPercent: trialDisc,
            instantBookingEnabled: instant,
          });

          setHourlyRate((prev) => {
            if (prev < min) return min;
            if (prev > max) return max;
            return prev;
          });

          setTrialPrice((prev) => {
            return Math.max(5, Math.round(35 * 0.5 * (1 - trialDisc / 100)));
          });

          setInstantBookingEnabled(instant);
        }
      })
      .catch(() => {});

    fetch('/api/subjects')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSubjectsList(data);
          setPrimarySubjectId((prev) => prev || data[0].id);
        }
      })
      .catch(() => {});

    fetch('/api/countries')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setCountriesList(data);
      })
      .catch(() => {});

    fetch('/api/timezones')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setTimezonesList(data);
      })
      .catch(() => {});

    fetch('/api/languages')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setLanguagesList(data);
      })
      .catch(() => {});

    fetch('/api/auth/session?role=TUTOR')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.authenticated && data.user) {
          if (data.user.displayName) {
            setDisplayName(data.user.displayName);
            const parts = data.user.displayName.split(" ");
            if (parts.length > 1) {
              setFirstName(parts[0]);
              setLastName(parts.slice(1).join(" "));
            } else {
              setFirstName(data.user.displayName);
            }
          }
          if (data.user.country) {
            setCountry(data.user.country);
          }
          if (data.user.timezone) {
            setTimezone(data.user.timezone);
          }
        }
      })
      .catch(() => {});
  }, []);

  // ── STEP 1: ABOUT YOU ──
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [country, setCountry] = React.useState("United Kingdom");
  const [timezone, setTimezone] = React.useState(() => detectUserTimezone());
  const [phone, setPhone] = React.useState("");
  const [avatarPreview, setAvatarPreview] = React.useState("");

  // ── STEP 2: TEACHING PROFILE & BIO ──
  const [headline, setHeadline] = React.useState("");
  const [bioAboutMe, setBioAboutMe] = React.useState("");
  const [bioExperience, setBioExperience] = React.useState("");
  const [bioStyle, setBioStyle] = React.useState("");
  const [selectedLanguages, setSelectedLanguages] = React.useState([
    { code: "en", name: "English", proficiency: "Native / Bilingual" },
  ]);

  // ── STEP 3: IDENTITY & ACADEMIC CREDENTIALS ──
  const [identityDocumentUrl, setIdentityDocumentUrl] = React.useState("");
  const [identityDocumentType, setIdentityDocumentType] = React.useState<"PASSPORT" | "NATIONAL_ID" | "DRIVERS_LICENSE">("PASSPORT");
  const [identityDocumentName, setIdentityDocumentName] = React.useState("");

  const [degrees, setDegrees] = React.useState<Array<{
    id: string;
    degree: string;
    institution: string;
    fieldOfStudy: string;
    startYear: string;
    endYear: string;
    honors: string;
    documentName?: string;
    documentUrl?: string;
  }>>([]);

  // ── STEP 4: CERTIFICATIONS & LICENSES ──
  const [certifications, setCertifications] = React.useState<Array<{
    id: string;
    title: string;
    issuer: string;
    issueYear: string;
    credentialId: string;
    documentName?: string;
    documentUrl?: string;
  }>>([]);

  // ── STEP 5: WORK EXPERIENCE ──
  const [experiences, setExperiences] = React.useState<Array<{
    id: string;
    role: string;
    organization: string;
    startYear: string;
    endYear: string;
    description: string;
  }>>([]);

  // ── STEP 6: SUBJECTS & PRICING ──
  const [primarySubjectId, setPrimarySubjectId] = React.useState("");
  const [secondarySubjectIds, setSecondarySubjectIds] = React.useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = React.useState(35);
  const [offerTrialDiscount, setOfferTrialDiscount] = React.useState(true);
  const [trialPrice, setTrialPrice] = React.useState(18);
  const [instantBookingEnabled, setInstantBookingEnabled] = React.useState(true);
  const [noticeHours, setNoticeHours] = React.useState("12");

  // ── STEP 7: AVAILABILITY ──
  const [schedule, setSchedule] = React.useState([
    { day: "Monday", active: true, start: "09:00", end: "17:00" },
    { day: "Tuesday", active: true, start: "09:00", end: "17:00" },
    { day: "Wednesday", active: true, start: "09:00", end: "17:00" },
    { day: "Thursday", active: true, start: "09:00", end: "17:00" },
    { day: "Friday", active: true, start: "09:00", end: "17:00" },
    { day: "Saturday", active: false, start: "10:00", end: "14:00" },
    { day: "Sunday", active: false, start: "10:00", end: "14:00" },
  ]);

  // ── STEP 8: VIDEO INTRO ──
  const [videoUrl, setVideoUrl] = React.useState("");
  const [agreedToQualityCheck, setAgreedToQualityCheck] = React.useState(false);
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);

  // Submitting state & error
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Helper actions
  const addDegree = () => {
    setDegrees([
      ...degrees,
      {
        id: `deg-${Date.now()}`,
        degree: "",
        institution: "",
        fieldOfStudy: "",
        startYear: new Date().getFullYear().toString(),
        endYear: "",
        honors: "",
        documentName: "",
        documentUrl: "",
      },
    ]);
  };

  const removeDegree = (id: string) => {
    setDegrees(degrees.filter((d) => d.id !== id));
  };

  const addCertification = () => {
    setCertifications([
      ...certifications,
      {
        id: `cert-${Date.now()}`,
        title: "",
        issuer: "",
        issueYear: new Date().getFullYear().toString(),
        credentialId: "",
        documentName: "",
        documentUrl: "",
      },
    ]);
  };

  const removeCertification = (id: string) => {
    setCertifications(certifications.filter((c) => c.id !== id));
  };

  const addExperience = () => {
    setExperiences([
      ...experiences,
      {
        id: `exp-${Date.now()}`,
        role: "",
        organization: "",
        startYear: new Date().getFullYear().toString(),
        endYear: "Present",
        description: "",
      },
    ]);
  };

  const removeExperience = (id: string) => {
    setExperiences(experiences.filter((e) => e.id !== id));
  };

  const completionPercentage = Math.round((currentStep / ONBOARDING_STEPS.length) * 100);

  const handleSubmit = async () => {
    const finalDisplayName = displayName.trim() || `${firstName} ${lastName}`.trim();
    if (!finalDisplayName) {
      setSubmitError("Please provide your display name or first/last name in Step 1.");
      return;
    }

    if (!headline.trim() || headline.trim().length < 5) {
      setSubmitError("Please provide a professional headline of at least 5 characters in Step 2.");
      return;
    }

    if (!bioAboutMe.trim() || bioAboutMe.trim().length < 20) {
      setSubmitError("Please write an About Me bio of at least 20 characters in Step 2.");
      return;
    }

    if (!primarySubjectId) {
      setSubmitError("Please select a primary subject in Step 6.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/tutor/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: finalDisplayName,
          country,
          timezone,
          phone,
          avatarUrl: avatarPreview || undefined,
          headline: headline.trim(),
          bioAboutMe: bioAboutMe.trim(),
          bioExperience: bioExperience.trim() || undefined,
          bioStyle: bioStyle.trim() || undefined,
          languages: selectedLanguages,
          identityDocumentUrl: identityDocumentUrl || undefined,
          identityDocumentType,
          identityDocumentName: identityDocumentName || undefined,
          degrees,
          certifications,
          experiences,
          primarySubjectId,
          secondarySubjectIds,
          hourlyRate,
          trialPrice,
          instantBookingEnabled,
          noticeHours,
          schedule,
          videoUrl: videoUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit tutor application.");
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-slate-900 pb-20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="default" />
            <span className="h-4 w-px bg-slate-200 hidden sm:block" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 hidden sm:block">
              Tutor Verification & Onboarding
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg font-mono">
              Step {currentStep}/9 ({completionPercentage}%)
            </span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg hidden xs:flex items-center gap-1">
              <Check className="h-3 w-3" /> Draft Saved
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8">
        {/* Progress Bar Strip */}
        <div className="mb-4 sm:mb-8">
          <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-brand-700 transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {isSubmitted ? (
          /* SUCCESS SCREEN */
          <div className="max-w-2xl mx-auto py-16 px-6 rounded-3xl border border-slate-200/90 bg-white shadow-card text-center space-y-6 animate-fade-in">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-xs">
              <ShieldCheck className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <Badge variant="subtle" size="sm" className="bg-amber-50 text-amber-900 border-amber-200 font-bold">
                Application Status: UNDER_VERIFICATION
              </Badge>
              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 font-heading">
                Tutor Application Submitted!
              </h1>
              <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                Thank you, <strong>{displayName}</strong>. Our academic admissions committee and registrar will review your diplomas, teaching licenses, and video introduction within <strong>24–48 hours</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-700 space-y-2 max-w-md mx-auto">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                What happens next?
              </div>
              <ul className="space-y-1.5 text-slate-600 pl-6 list-disc">
                <li>Registrar verifies your academic diplomas and teaching credentials.</li>
                <li>Video introduction analyzed for audio/video clarity and student safety.</li>
                <li>Your verified tutor profile goes live on the Sabina marketplace.</li>
              </ul>
            </div>

            <div className="flex justify-center gap-3 pt-4">
              <Link href="/tutor">
                <Button variant="default" size="lg" className="font-extrabold bg-[#0B1E8A] hover:bg-[#081566] text-white rounded-xl shadow-xs">
                  Open Tutor Dashboard
                </Button>
              </Link>
              <Link href="/tutor/profile">
                <Button variant="outline" size="lg" className="font-bold border-slate-200 rounded-xl">
                  Manage Teaching Profile
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div>
            {/* ═══════════════════════════════════════════════════════════
                MOBILE STEP TRACKER & JUMPER (Visible on < lg screens)
            ═══════════════════════════════════════════════════════════ */}
            <div className="lg:hidden mb-6 bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                      Step {currentStep} of 9
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {ONBOARDING_STEPS[currentStep - 1]?.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {ONBOARDING_STEPS[currentStep - 1]?.desc}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowStepsDrawer(!showStepsDrawer)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
                >
                  <Layers className="h-3.5 w-3.5 text-brand-700" />
                  <span>Steps</span>
                  <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${showStepsDrawer ? "rotate-180" : ""}`} />
                </button>
              </div>

              {/* Horizontal quick-jump step pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth">
                {ONBOARDING_STEPS.map((s) => {
                  const isActive = currentStep === s.id;
                  const isCompleted = currentStep > s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setCurrentStep(s.id);
                        setShowStepsDrawer(false);
                      }}
                      className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? "bg-slate-950 text-white shadow-xs"
                          : isCompleted
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-3 w-3 stroke-[3]" />
                      ) : (
                        <span>{s.id}</span>
                      )}
                      <span className="truncate max-w-[85px]">{s.title.split(" ")[0]}</span>
                    </button>
                  );
                })}
              </div>

              {/* Expandable Step Sheet / Drawer on Mobile */}
              {showStepsDrawer && (
                <div className="pt-3 border-t border-slate-100 space-y-1.5 animate-fade-in">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Select Step to Jump
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowStepsDrawer(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 font-bold p-1"
                    >
                      Close
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-1 max-h-80 overflow-y-auto pr-1">
                    {ONBOARDING_STEPS.map((s) => {
                      const Icon = s.icon;
                      const isActive = currentStep === s.id;
                      const isCompleted = currentStep > s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setCurrentStep(s.id);
                            setShowStepsDrawer(false);
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-left transition-all ${
                            isActive
                              ? "bg-slate-950 text-white font-bold"
                              : isCompleted
                              ? "bg-emerald-50/70 text-slate-800 hover:bg-emerald-50 border border-emerald-100"
                              : "hover:bg-slate-50 text-slate-600"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 ${
                                isActive
                                  ? "bg-white/20 text-white"
                                  : isCompleted
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {isCompleted ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <Icon className="h-3.5 w-3.5" />}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs font-bold truncate ${isActive ? "text-white" : "text-slate-900"}`}>
                                {s.id}. {s.title}
                              </p>
                              <p className={`text-[10px] truncate ${isActive ? "text-slate-300" : "text-slate-400"}`}>
                                {s.desc}
                              </p>
                            </div>
                          </div>
                          {isCompleted && !isActive && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                              Done
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* ═══════════════════════════════════════════════════════════
                  LEFT COLUMN: Interactive Step Stepper (Desktop Only)
              ═══════════════════════════════════════════════════════════ */}
              <aside className="hidden lg:block lg:col-span-4 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-2 sticky top-24">
                <div className="pb-3 border-b border-slate-100 mb-2">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-heading">
                    Application Steps
                  </h3>
                  <p className="text-xs text-slate-500">
                    Complete all 9 sections to submit for verification
                  </p>
                </div>

                <div className="space-y-1">
                  {ONBOARDING_STEPS.map((s) => {
                    const Icon = s.icon;
                    const isActive = currentStep === s.id;
                    const isCompleted = currentStep > s.id;

                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setCurrentStep(s.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all ${
                          isActive
                            ? "bg-slate-950 text-white font-bold shadow-xs"
                            : isCompleted
                            ? "bg-emerald-50/70 text-slate-800 hover:bg-emerald-50 border border-emerald-100"
                            : "hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 ${
                              isActive
                                ? "bg-white/20 text-white"
                                : isCompleted
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : <Icon className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-xs font-bold truncate ${isActive ? "text-white" : "text-slate-900"}`}>
                              {s.id}. {s.title}
                            </p>
                            <p className={`text-[11px] truncate ${isActive ? "text-slate-300" : "text-slate-400"}`}>
                              {s.desc}
                            </p>
                          </div>
                        </div>

                        {isCompleted && !isActive && (
                          <Badge variant="subtle" size="sm" className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px]">
                            Done
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
                    <span className="font-bold flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                      Pro Tip for Higher Earnings
                    </span>
                    <p className="text-amber-800 leading-relaxed">
                      Tutors with verified degrees and intro videos charge up to <strong>\$75–\$120/hr</strong> on average.
                    </p>
                  </div>
                </div>
              </aside>

              {/* ═══════════════════════════════════════════════════════════
                  CENTER COLUMN: Active Step Form Canvas
              ═══════════════════════════════════════════════════════════ */}
              <div className="lg:col-span-8 rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-10 shadow-xs space-y-8">
                {/* ── STEP 1: ABOUT YOU ── */}
                {currentStep === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-1 pb-4 border-b border-slate-100">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-brand-700">
                      Step 1 of 9
                    </span>
                    <h2 className="text-2xl font-black text-slate-950 font-heading">
                      Personal Details & Professional Headshot
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Students trust tutors with authentic, clear photos and verified locations.
                    </p>
                  </div>

                  {/* Avatar Upload Box */}
                  <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
                    <FileUploadWithLink
                      label="Professional Tutor Photo"
                      description="Upload photo to Cloudinary or paste direct image URL. Verified front-facing headshot."
                      type="image"
                      value={avatarPreview}
                      onChange={(url) => setAvatarPreview(url)}
                      placeholder="https://example.com/photo.jpg"
                    />
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        First Name
                      </label>
                      <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Last Name
                      </label>
                      <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Public Display Name (How students see you)
                    </label>
                    <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Include academic titles if applicable (e.g. Dr. Elena Rostova, Prof. Marcus Vance).
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <SearchableSelect
                        label="Country of Residence"
                        placeholder="Select your country..."
                        searchPlaceholder="Search 170+ countries..."
                        value={country}
                        onChange={setCountry}
                        options={
                          countriesList.length > 0
                            ? countriesList.map((c) => ({
                                value: c.name,
                                label: c.name,
                                sublabel: `${c.continent || ''} ${c.dial_code ? '• ' + c.dial_code : ''}`.trim(),
                              }))
                            : WORLD_COUNTRIES.map((c) => ({
                                value: c.name,
                                label: c.name,
                                sublabel: `${c.continent} • ${c.dialCode}`,
                              }))
                        }
                      />
                    </div>
                    <div>
                      <SearchableSelect
                        label="Timezone"
                        placeholder="Select your timezone..."
                        searchPlaceholder="Search timezone or city..."
                        value={timezone}
                        onChange={setTimezone}
                        options={
                          timezonesList.length > 0
                            ? timezonesList.map((tz) => ({
                                value: tz.identifier,
                                label: tz.display_name || tz.identifier,
                                sublabel: tz.utc_offset || '',
                              }))
                            : POPULAR_TIMEZONES
                        }
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <Button
                      variant="default"
                      size="lg"
                      className="w-full sm:w-auto font-extrabold bg-slate-950 hover:bg-slate-800 text-white rounded-xl shadow-xs px-8"
                      onClick={() => setCurrentStep(2)}
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      Save & Continue to Profile Bio
                    </Button>
                  </div>
                </div>
              )}

              {/* ── STEP 2: TEACHING PROFILE & BIO ── */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-1 pb-4 border-b border-slate-100">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-brand-700">
                      Step 2 of 9
                    </span>
                    <h2 className="text-2xl font-black text-slate-950 font-heading">
                      Teaching Profile & Comprehensive Biography
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Present your teaching style with 3 structured paragraphs that convert visitors into students.
                    </p>
                  </div>

                  {/* Headline */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Profile Headline (Max 120 chars)
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {headline.length}/120
                      </span>
                    </div>
                    <Input
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="e.g. Oxford Ph.D. • AP Calculus & STEP/MAT Math Mentor"
                    />
                  </div>

                  {/* Bio Paragraph 1 */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      1. About Me & Academic Background
                    </label>
                    <Textarea
                      rows={3}
                      value={bioAboutMe}
                      onChange={(e) => setBioAboutMe(e.target.value)}
                      placeholder="Introduce your education, passion for teaching, and why you love tutoring..."
                    />
                  </div>

                  {/* Bio Paragraph 2 */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      2. Teaching Experience & Student Success
                    </label>
                    <Textarea
                      rows={3}
                      value={bioExperience}
                      onChange={(e) => setBioExperience(e.target.value)}
                      placeholder="Mention years of experience, exam curricula taught (AP, IB, SAT), and past student results..."
                    />
                  </div>

                  {/* Bio Paragraph 3 */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      3. Lesson Format & Interactive Classroom Tools
                    </label>
                    <Textarea
                      rows={3}
                      value={bioStyle}
                      onChange={(e) => setBioStyle(e.target.value)}
                      placeholder="Describe what happens in a 50-min lesson, homework support, whiteboard usage, etc..."
                    />
                  </div>

                  {/* Languages Spoken */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Languages You Can Teach In
                        </label>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Select the languages you are qualified to conduct lessons in and your proficiency level.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const available = (languagesList.length > 0 ? languagesList : STANDARD_LANGUAGES);
                          const unused = available.find((a) => !selectedLanguages.some((sl) => sl.name === a.name)) || available[0];
                          setSelectedLanguages((prev) => [
                            ...prev,
                            { code: unused.code, name: unused.name, proficiency: "C2 (Proficient)" },
                          ]);
                        }}
                        className="rounded-xl text-xs font-bold text-brand-700 border-brand-200 hover:bg-brand-50 shrink-0 cursor-pointer"
                        leftIcon={<Plus className="h-3.5 w-3.5" />}
                      >
                        Add Language
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {selectedLanguages.map((l, idx) => (
                        <div
                          key={idx}
                          className="p-3 sm:p-4 rounded-2xl bg-slate-50/70 border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                        >
                          <div className="sm:col-span-6">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 sm:hidden">
                              Language
                            </label>
                            <SearchableSelect
                              placeholder="Select language..."
                              searchPlaceholder="Search 40+ languages..."
                              value={l.name}
                              onChange={(val) => {
                                const newLangs = [...selectedLanguages];
                                const found = (languagesList.length > 0 ? languagesList : STANDARD_LANGUAGES).find(
                                  (item) => item.name === val || item.code === val
                                );
                                newLangs[idx].name = found?.name || val;
                                newLangs[idx].code = found?.code || val.toLowerCase().slice(0, 2);
                                setSelectedLanguages(newLangs);
                              }}
                              options={(languagesList.length > 0 ? languagesList : STANDARD_LANGUAGES).map((item) => ({
                                value: item.name,
                                label: item.name,
                                sublabel: item.native_name || item.nativeName,
                              }))}
                              leftIcon={<Globe className="h-4 w-4 text-brand-700" />}
                            />
                          </div>

                          <div className="sm:col-span-5">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 sm:hidden">
                              Proficiency Level
                            </label>
                            <Select
                              value={l.proficiency}
                              onChange={(e) => {
                                const newLangs = [...selectedLanguages];
                                newLangs[idx].proficiency = e.target.value;
                                setSelectedLanguages(newLangs);
                              }}
                            >
                              {PROFICIENCY_LEVELS.map((prof) => (
                                <option key={prof} value={prof}>
                                  {prof}
                                </option>
                              ))}
                            </Select>
                          </div>

                          <div className="sm:col-span-1 flex justify-end">
                            {selectedLanguages.length > 1 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLanguages(selectedLanguages.filter((_, i) => i !== idx));
                                }}
                                className="p-2.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Remove language"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            ) : (
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">Primary</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
                    <Button variant="outline" className="w-full sm:w-auto rounded-xl font-bold" onClick={() => setCurrentStep(1)}>
                      <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <Button
                      variant="default"
                      size="lg"
                      className="w-full sm:w-auto font-extrabold bg-slate-950 hover:bg-slate-800 text-white rounded-xl shadow-xs px-8"
                      onClick={() => setCurrentStep(3)}
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      Continue to Qualifications
                    </Button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: ACADEMIC QUALIFICATIONS & DEGREES ── */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-1 pb-4 border-b border-slate-100">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-brand-700">
                      Step 3 of 9
                    </span>
                    <h2 className="text-2xl font-black text-slate-950 font-heading">
                      Identity Verification & Academic Degrees
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Upload your official government identification and verified university diplomas.
                    </p>
                  </div>

                  {/* ── Government Identity Verification Card ── */}
                  <div className="p-5 rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-700">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Government Identity Document</h3>
                          <p className="text-[11px] text-slate-500">
                            Required for platform compliance, verified badge, and payout processing.
                          </p>
                        </div>
                      </div>
                      <Badge variant="subtle" size="sm" className="bg-indigo-100 text-indigo-800 border-indigo-200">
                        Confidential
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Document Type
                        </label>
                        <Select
                          value={identityDocumentType}
                          onChange={(e) => setIdentityDocumentType(e.target.value as any)}
                        >
                          <option value="PASSPORT">Passport (Recommended)</option>
                          <option value="NATIONAL_ID">National ID Card</option>
                          <option value="DRIVERS_LICENSE">Driver&apos;s License</option>
                        </Select>
                      </div>

                      <div className="sm:col-span-2">
                        <FileUploadWithLink
                          label="Identity Document Scan / Photo"
                          description="Color scan or clear photo of your ID (PDF, JPG, PNG). Max 10MB."
                          type="document"
                          value={identityDocumentUrl}
                          onChange={(url, meta) => {
                            setIdentityDocumentUrl(url);
                            setIdentityDocumentName(meta?.fileName || `${identityDocumentType}_Document.pdf`);
                          }}
                          placeholder="https://... or click Upload Document"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>End-to-end encrypted. Restricted strictly to admin identity compliance verification.</span>
                    </div>
                  </div>

                  {/* ── Academic Degrees Header ── */}
                  <div className="pt-2">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-brand-700" />
                      Academic Qualifications & Diplomas
                    </h3>
                    <p className="text-xs text-slate-500 mb-3">
                      Add degrees and diplomas. Uploading transcripts or diploma certificates boosts student conversion.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {degrees.map((deg, index) => (
                      <div
                        key={deg.id}
                        className="p-5 rounded-3xl border border-slate-200/90 bg-slate-50/50 space-y-4 relative shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <GraduationCap className="h-4 w-4 text-brand-700" />
                            Degree #{index + 1}
                          </span>
                          {degrees.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeDegree(deg.id)}
                              className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Degree Title
                            </label>
                            <Input
                              value={deg.degree}
                              onChange={(e) => {
                                const newDegs = [...degrees];
                                newDegs[index].degree = e.target.value;
                                setDegrees(newDegs);
                              }}
                              placeholder="e.g. Ph.D. in Pure Mathematics"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                              University / Institution
                            </label>
                            <Input
                              value={deg.institution}
                              onChange={(e) => {
                                const newDegs = [...degrees];
                                newDegs[index].institution = e.target.value;
                                setDegrees(newDegs);
                              }}
                              placeholder="e.g. University of Oxford"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Major / Field of Study
                            </label>
                            <Input
                              value={deg.fieldOfStudy}
                              onChange={(e) => {
                                const newDegs = [...degrees];
                                newDegs[index].fieldOfStudy = e.target.value;
                                setDegrees(newDegs);
                              }}
                              placeholder="e.g. Algebraic Geometry"
                            />
                          </div>
                          <div>
                            <Select
                              label="Graduation Year"
                              value={deg.endYear}
                              onChange={(e) => {
                                const newDegs = [...degrees];
                                newDegs[index].endYear = e.target.value;
                                setDegrees(newDegs);
                              }}
                            >
                              <option value="">Select year...</option>
                              {yearOptions.map((yr) => (
                                <option key={yr} value={yr}>
                                  {yr}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Honors / Distinction (Optional)
                          </label>
                          <Input
                            value={deg.honors}
                            onChange={(e) => {
                              const newDegs = [...degrees];
                              newDegs[index].honors = e.target.value;
                              setDegrees(newDegs);
                            }}
                            placeholder="e.g. Clarendon Scholar • First Class Honours"
                          />
                        </div>

                        {/* Diploma PDF Upload */}
                        <div>
                          <FileUploadWithLink
                            label="Diploma Scan / Transcript PDF"
                            description="Upload diploma PDF to Cloudinary or paste credential URL."
                            type="document"
                            value={deg.documentUrl || ""}
                            onChange={(url, meta) => {
                              const newDegs = [...degrees];
                              newDegs[index].documentUrl = url;
                              newDegs[index].documentName = meta?.fileName || "Uploaded_Diploma.pdf";
                              setDegrees(newDegs);
                            }}
                          />
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addDegree}
                      className="w-full font-bold border-dashed border-slate-300 hover:border-slate-400 rounded-2xl py-3"
                      leftIcon={<Plus className="h-4 w-4" />}
                    >
                      Add Another Academic Degree
                    </Button>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
                    <Button variant="outline" className="w-full sm:w-auto rounded-xl font-bold" onClick={() => setCurrentStep(2)}>
                      <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <Button
                      variant="default"
                      size="lg"
                      className="w-full sm:w-auto font-extrabold bg-slate-950 hover:bg-slate-800 text-white rounded-xl shadow-xs px-8"
                      onClick={() => setCurrentStep(4)}
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      Continue to Certifications
                    </Button>
                  </div>
                </div>
              )}

              {/* ── STEP 4: CERTIFICATIONS & LICENSES ── */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-1 pb-4 border-b border-slate-100">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-brand-700">
                      Step 4 of 9
                    </span>
                    <h2 className="text-2xl font-black text-slate-950 font-heading">
                      Teaching Licenses & Professional Certifications
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Accredited certifications (QTS, AP Master Instructor, Cambridge CELTA, TEFL) display verified badges.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {certifications.map((cert, index) => (
                      <div
                        key={cert.id}
                        className="p-5 rounded-3xl border border-slate-200/90 bg-slate-50/50 space-y-4 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Award className="h-4 w-4 text-amber-600" />
                            Certification #{index + 1}
                          </span>
                          {certifications.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeCertification(cert.id)}
                              className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Certification Title
                            </label>
                            <Input
                              value={cert.title}
                              onChange={(e) => {
                                const newC = [...certifications];
                                newC[index].title = e.target.value;
                                setCertifications(newC);
                              }}
                              placeholder="e.g. Qualified Teacher Status (QTS)"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Issuing Organization
                            </label>
                            <Input
                              value={cert.issuer}
                              onChange={(e) => {
                                const newC = [...certifications];
                                newC[index].issuer = e.target.value;
                                setCertifications(newC);
                              }}
                              placeholder="e.g. UK Department for Education"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Credential ID / License Number
                            </label>
                            <Input
                              value={cert.credentialId}
                              onChange={(e) => {
                                const newC = [...certifications];
                                newC[index].credentialId = e.target.value;
                                setCertifications(newC);
                              }}
                              placeholder="e.g. QTS-GB-884920"
                            />
                          </div>
                          <div>
                            <Select
                              label="Year Issued"
                              value={cert.issueYear}
                              onChange={(e) => {
                                const newC = [...certifications];
                                newC[index].issueYear = e.target.value;
                                setCertifications(newC);
                              }}
                            >
                              <option value="">Select year...</option>
                              {yearOptions.map((yr) => (
                                <option key={yr} value={yr}>
                                  {yr}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </div>

                        <div>
                          <FileUploadWithLink
                            label="Teaching License / Certificate PDF"
                            description="Upload TEFL/CELTA certificate to Cloudinary or paste credential URL."
                            type="document"
                            value={cert.documentUrl || ""}
                            onChange={(url, meta) => {
                              const newC = [...certifications];
                              newC[index].documentUrl = url;
                              newC[index].documentName = meta?.fileName || "Uploaded_Certificate.pdf";
                              setCertifications(newC);
                            }}
                          />
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addCertification}
                      className="w-full font-bold border-dashed border-slate-300 hover:border-slate-400 rounded-2xl py-3"
                      leftIcon={<Plus className="h-4 w-4" />}
                    >
                      Add Another Teaching License / Certification
                    </Button>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
                    <Button variant="outline" className="w-full sm:w-auto rounded-xl font-bold" onClick={() => setCurrentStep(3)}>
                      <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <Button
                      variant="default"
                      size="lg"
                      className="w-full sm:w-auto font-extrabold bg-slate-950 hover:bg-slate-800 text-white rounded-xl shadow-xs px-8"
                      onClick={() => setCurrentStep(5)}
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      Continue to Work Experience
                    </Button>
                  </div>
                </div>
              )}

              {/* ── STEP 5: WORK EXPERIENCE ── */}
              {currentStep === 5 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-1 pb-4 border-b border-slate-100">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-brand-700">
                      Step 5 of 9
                    </span>
                    <h2 className="text-2xl font-black text-slate-950 font-heading">
                      Teaching & Professional Work History
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Highlight schools, universities, tutoring centers, or coaching roles.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {experiences.map((exp, index) => (
                      <div
                        key={exp.id}
                        className="p-5 rounded-3xl border border-slate-200/90 bg-slate-50/50 space-y-4 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Briefcase className="h-4 w-4 text-brand-700" />
                            Experience #{index + 1}
                          </span>
                          {experiences.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeExperience(exp.id)}
                              className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Role / Job Title
                            </label>
                            <Input
                              value={exp.role}
                              onChange={(e) => {
                                const newE = [...experiences];
                                newE[index].role = e.target.value;
                                setExperiences(newE);
                              }}
                              placeholder="e.g. Senior Lecturer in Mathematics"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Institution / Organization
                            </label>
                            <Input
                              value={exp.organization}
                              onChange={(e) => {
                                const newE = [...experiences];
                                newE[index].organization = e.target.value;
                                setExperiences(newE);
                              }}
                              placeholder="e.g. Oxford Mathematical Institute"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Select
                              label="Start Year"
                              value={exp.startYear}
                              onChange={(e) => {
                                const newE = [...experiences];
                                newE[index].startYear = e.target.value;
                                setExperiences(newE);
                              }}
                            >
                              <option value="">Select start year...</option>
                              {yearOptions.map((yr) => (
                                <option key={yr} value={yr}>
                                  {yr}
                                </option>
                              ))}
                            </Select>
                          </div>
                          <div>
                            <Select
                              label="End Year"
                              value={exp.endYear}
                              onChange={(e) => {
                                const newE = [...experiences];
                                newE[index].endYear = e.target.value;
                                setExperiences(newE);
                              }}
                            >
                              <option value="">Select end year...</option>
                              <option value="Present">Present (Current)</option>
                              {yearOptions.map((yr) => (
                                <option key={yr} value={yr}>
                                  {yr}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Key Responsibilities & Achievements
                          </label>
                          <Textarea
                            rows={2}
                            value={exp.description}
                            onChange={(e) => {
                              const newE = [...experiences];
                              newE[index].description = e.target.value;
                              setExperiences(newE);
                            }}
                          />
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addExperience}
                      className="w-full font-bold border-dashed border-slate-300 hover:border-slate-400 rounded-2xl py-3"
                      leftIcon={<Plus className="h-4 w-4" />}
                    >
                      Add Another Work Experience
                    </Button>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
                    <Button variant="outline" className="w-full sm:w-auto rounded-xl font-bold" onClick={() => setCurrentStep(4)}>
                      <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <Button
                      variant="default"
                      size="lg"
                      className="w-full sm:w-auto font-extrabold bg-slate-950 hover:bg-slate-800 text-white rounded-xl shadow-xs px-8"
                      onClick={() => setCurrentStep(6)}
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      Continue to Subjects & Pricing
                    </Button>
                  </div>
                </div>
              )}

              {/* ── STEP 6: SUBJECTS & PRICING ── */}
              {currentStep === 6 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-1 pb-4 border-b border-slate-100">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-brand-700">
                      Step 6 of 9
                    </span>
                    <h2 className="text-2xl font-black text-slate-950 font-heading">
                      Teaching Subjects & Hourly Rate
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Set your primary subjects, hourly rate, and trial lesson pricing.
                    </p>
                  </div>

                  {/* Primary Teaching Discipline */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Primary Teaching Discipline
                    </label>
                    <SearchableSelect
                      placeholder="Select primary teaching discipline..."
                      searchPlaceholder="Search 50+ subjects (Math, English, Science, Coding...)"
                      value={primarySubjectId}
                      onChange={(val) => setPrimarySubjectId(val)}
                      options={subjectsList.map((s) => ({
                        value: s.id,
                        label: s.name,
                        sublabel: s.category,
                      }))}
                      leftIcon={<BookOpen className="h-4 w-4 text-brand-700" />}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      This will be your primary discipline shown prominently on your profile card and search results.
                    </p>
                  </div>

                  {/* Secondary Disciplines & Additional Subjects */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Secondary Disciplines & Additional Subjects (Optional)
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {secondarySubjectIds.length} added
                      </span>
                    </div>
                    <SearchableSelect
                      placeholder="Add another subject you are qualified to teach..."
                      searchPlaceholder="Search additional subjects..."
                      value=""
                      onChange={(val) => {
                        if (val && val !== primarySubjectId && !secondarySubjectIds.includes(val)) {
                          setSecondarySubjectIds([...secondarySubjectIds, val]);
                        }
                      }}
                      options={subjectsList
                        .filter((s) => s.id !== primarySubjectId && !secondarySubjectIds.includes(s.id))
                        .map((s) => ({
                          value: s.id,
                          label: s.name,
                          sublabel: s.category,
                        }))}
                      leftIcon={<Plus className="h-4 w-4 text-slate-400" />}
                    />

                    {secondarySubjectIds.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {secondarySubjectIds.map((sid) => {
                          const sub = subjectsList.find((s) => s.id === sid);
                          return (
                            <span
                              key={sid}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800"
                            >
                              <BookOpen className="h-3.5 w-3.5 text-brand-700" />
                              {sub?.name || sid}
                              <button
                                type="button"
                                onClick={() => setSecondarySubjectIds(secondarySubjectIds.filter((id) => id !== sid))}
                                className="text-slate-400 hover:text-rose-600 ml-1 p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Hourly Rate Slider */}
                  <div className="p-4 sm:p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Standard Hourly Rate (50-Min Lesson)
                        </span>
                        <p className="text-xs text-slate-500 mt-0.5">
                          You keep {(100 - platformPolicies.platformFeePercent).toFixed(0)}% of your earnings after platform processing ({platformPolicies.platformFeePercent}% platform fee).
                        </p>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <div className="text-2xl sm:text-3xl font-black text-brand-700 font-heading">
                          ${hourlyRate} <span className="text-xs font-semibold text-slate-500">USD/hr</span>
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-600 block">
                          ~${(hourlyRate * (1 - platformPolicies.platformFeePercent / 100)).toFixed(2)} USD take-home
                        </span>
                      </div>
                    </div>

                    <input
                      type="range"
                      min={platformPolicies.tutorMinHourlyRate}
                      max={platformPolicies.tutorMaxHourlyRate}
                      step="5"
                      value={hourlyRate}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setHourlyRate(val);
                        const disc = platformPolicies.trialLessonDiscountPercent || 30;
                        setTrialPrice(Math.max(5, Math.round(val * 0.5 * (1 - disc / 100))));
                      }}
                      className="w-full accent-brand-700 cursor-pointer"
                    />

                    <div className="flex justify-between text-[11px] text-slate-400 font-bold">
                      <span>Min: ${platformPolicies.tutorMinHourlyRate}/hr</span>
                      <span>
                        Rec: $
                        {Math.min(
                          platformPolicies.tutorMaxHourlyRate,
                          Math.max(
                            platformPolicies.tutorMinHourlyRate,
                            Math.round(
                              platformPolicies.tutorMinHourlyRate +
                                (platformPolicies.tutorMaxHourlyRate - platformPolicies.tutorMinHourlyRate) * 0.25
                            )
                          )
                        )}
                        /hr
                      </span>
                      <span>Max: ${platformPolicies.tutorMaxHourlyRate}/hr</span>
                    </div>
                  </div>

                  {/* Trial Lesson Discount */}
                  <div className="p-5 rounded-3xl bg-emerald-50/50 border border-emerald-200 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-bold text-slate-900">
                          Offer {platformPolicies.trialLessonDiscountPercent}% Off 25-Min Trial Lessons
                        </strong>
                        <Badge variant="subtle" size="sm" className="bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          Boosts Bookings 4x
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600">
                        First-time students can book a 25-minute intro session for <strong>${trialPrice} USD</strong> (normally ${(hourlyRate * 0.5).toFixed(0)} USD).
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={offerTrialDiscount}
                      onChange={(e) => setOfferTrialDiscount(e.target.checked)}
                      className="h-5 w-5 rounded-md accent-brand-700 cursor-pointer"
                    />
                  </div>

                  {/* Booking Advance Notice */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Minimum Advance Booking Notice
                      </label>
                      <select
                        value={noticeHours}
                        onChange={(e) => setNoticeHours(e.target.value)}
                        className="w-full rounded-2xl border border-slate-300 p-3 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-700"
                      >
                        <option value="2">2 Hours in advance</option>
                        <option value="6">6 Hours in advance</option>
                        <option value="12">12 Hours in advance (Recommended)</option>
                        <option value="24">24 Hours in advance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Instant Booking Mode
                      </label>
                      <select
                        value={instantBookingEnabled ? "true" : "false"}
                        onChange={(e) => setInstantBookingEnabled(e.target.value === "true")}
                        className="w-full rounded-2xl border border-slate-300 p-3 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-700"
                      >
                        <option value="true">Enabled (Students book open calendar slots directly)</option>
                        <option value="false">Manual Review (You approve each request)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
                    <Button variant="outline" className="w-full sm:w-auto rounded-xl font-bold" onClick={() => setCurrentStep(5)}>
                      <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <Button
                      variant="default"
                      size="lg"
                      className="w-full sm:w-auto font-extrabold bg-slate-950 hover:bg-slate-800 text-white rounded-xl shadow-xs px-8"
                      onClick={() => setCurrentStep(7)}
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      Continue to Weekly Schedule
                    </Button>
                  </div>
                </div>
              )}

              {/* ── STEP 7: WEEKLY AVAILABILITY ── */}
              {currentStep === 7 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-1 pb-4 border-b border-slate-100">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-brand-700">
                      Step 7 of 9
                    </span>
                    <h2 className="text-2xl font-black text-slate-950 font-heading">
                      Weekly Availability & Teaching Hours
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Set your recurring working windows. All times automatically sync to students&apos; timezones.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {schedule.map((item, idx) => (
                      <div
                        key={item.day}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border transition-all gap-3 ${
                          item.active
                            ? "border-slate-200/90 bg-slate-50"
                            : "border-slate-100 bg-slate-50/40 opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between sm:justify-start gap-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.active}
                              onChange={(e) => {
                                const newS = [...schedule];
                                newS[idx].active = e.target.checked;
                                setSchedule(newS);
                              }}
                              className="h-4 w-4 rounded-md accent-brand-700 cursor-pointer"
                            />
                            <span className="text-xs font-bold text-slate-900 w-24">
                              {item.day}
                            </span>
                          </label>
                          {!item.active && (
                            <span className="text-xs font-semibold text-slate-400 sm:hidden">
                              Day Off
                            </span>
                          )}
                        </div>

                        {item.active ? (
                          <div className="flex items-center gap-2 pl-7 sm:pl-0 w-full sm:w-auto">
                            <input
                              type="time"
                              value={item.start}
                              onChange={(e) => {
                                const newS = [...schedule];
                                newS[idx].start = e.target.value;
                                setSchedule(newS);
                              }}
                              className="flex-1 sm:flex-none rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-mono font-bold text-slate-800"
                            />
                            <span className="text-xs text-slate-400 shrink-0">to</span>
                            <input
                              type="time"
                              value={item.end}
                              onChange={(e) => {
                                const newS = [...schedule];
                                newS[idx].end = e.target.value;
                                setSchedule(newS);
                              }}
                              className="flex-1 sm:flex-none rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-mono font-bold text-slate-800"
                            />
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400 hidden sm:inline-block pr-4">
                            Day Off
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
                    <Button variant="outline" className="w-full sm:w-auto rounded-xl font-bold" onClick={() => setCurrentStep(6)}>
                      <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <Button
                      variant="default"
                      size="lg"
                      className="w-full sm:w-auto font-extrabold bg-slate-950 hover:bg-slate-800 text-white rounded-xl shadow-xs px-8"
                      onClick={() => setCurrentStep(8)}
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      Continue to Video Introduction
                    </Button>
                  </div>
                </div>
              )}

              {/* ── STEP 8: VIDEO INTRODUCTION ── */}
              {currentStep === 8 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-1 pb-4 border-b border-slate-100">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-brand-700">
                      Step 8 of 9
                    </span>
                    <h2 className="text-2xl font-black text-slate-950 font-heading">
                      1-Minute Video Introduction
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Videos help students hear your pronunciation, accent, and engaging teaching energy.
                    </p>
                  </div>

                  <div>
                    <FileUploadWithLink
                      label="Introduction Video"
                      description="Upload introduction video (MP4, WebM up to 60MB) directly to Cloudinary, or paste YouTube / Vimeo link."
                      type="video"
                      value={videoUrl}
                      onChange={(url) => setVideoUrl(url)}
                      placeholder="https://youtube.com/watch?v=... or direct MP4"
                    />
                  </div>

                  {/* Video Quality Checklist */}
                  <div className="p-5 rounded-3xl bg-amber-50/70 border border-amber-200 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-900">
                      <Camera className="h-4 w-4 text-amber-700" />
                      Video Approval Checklist
                    </div>
                    <ul className="space-y-2 text-xs text-amber-900">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-amber-700 shrink-0" />
                        <span><strong>Orientation & Lighting:</strong> Horizontal 16:9 format with clear frontal lighting.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-amber-700 shrink-0" />
                        <span><strong>Audio Quality:</strong> Quiet background with no echo or music.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-amber-700 shrink-0" />
                        <span><strong>Content Structure:</strong> 30s greeting in your teaching language + 30s summary of lesson focus.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
                    <Button variant="outline" className="w-full sm:w-auto rounded-xl font-bold" onClick={() => setCurrentStep(7)}>
                      <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <Button
                      variant="default"
                      size="lg"
                      className="w-full sm:w-auto font-extrabold bg-slate-950 hover:bg-slate-800 text-white rounded-xl shadow-xs px-8"
                      onClick={() => setCurrentStep(9)}
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      Continue to Review & Submit
                    </Button>
                  </div>
                </div>
              )}

              {/* ── STEP 9: REVIEW & SUBMIT ── */}
              {currentStep === 9 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-1 pb-4 border-b border-slate-100">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-brand-700">
                      Step 9 of 9
                    </span>
                    <h2 className="text-2xl font-black text-slate-950 font-heading">
                      Review Application & Verification Agreement
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Please confirm your details before submitting to the Registrar Review queue.
                    </p>
                  </div>

                  {/* Summary Card */}
                  <div className="p-4 sm:p-6 rounded-3xl border border-slate-200/90 bg-slate-50/50 space-y-4 shadow-xs">
                    <div className="flex items-start gap-4">
                      <Avatar
                        src={avatarPreview}
                        fallbackName={displayName}
                        size="lg"
                        statusIndicator="online"
                        superTutor={true}
                      />
                      <div className="space-y-1 min-w-0">
                        <h3 className="text-lg font-black text-slate-900 font-heading truncate">
                          {displayName}
                        </h3>
                        <p className="text-xs font-semibold text-slate-600 line-clamp-2">
                          {headline}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {country} • {timezone} • ${hourlyRate}/hr {offerTrialDiscount ? `($${trialPrice} trial)` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="p-3 rounded-2xl bg-white border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Government ID</span>
                        <strong className="block text-xs text-slate-900 mt-0.5 truncate">
                          {identityDocumentUrl ? `${identityDocumentType}` : "Not Attached"}
                        </strong>
                      </div>
                      <div className="p-3 rounded-2xl bg-white border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Degrees</span>
                        <strong className="block text-xs text-slate-900 mt-0.5">{degrees.length} Degrees</strong>
                      </div>
                      <div className="p-3 rounded-2xl bg-white border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Licenses</span>
                        <strong className="block text-xs text-slate-900 mt-0.5">{certifications.length} Credentials</strong>
                      </div>
                      <div className="p-3 rounded-2xl bg-white border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Experience</span>
                        <strong className="block text-xs text-slate-900 mt-0.5">{experiences.length} Career Roles</strong>
                      </div>
                    </div>
                  </div>

                  {/* Error banner */}
                  {submitError && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                      <span className="font-bold">Submission Notice:</span>
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* Agreements */}
                  <div className="space-y-3 pt-2">
                    <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreedToQualityCheck}
                        onChange={(e) => setAgreedToQualityCheck(e.target.checked)}
                        className="h-4 w-4 rounded accent-brand-700 mt-0.5"
                      />
                      <span className="text-xs text-slate-700">
                        I certify that all uploaded academic diplomas and teaching licenses are authentic and belong to me.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="h-4 w-4 rounded accent-brand-700 mt-0.5"
                      />
                      <span className="text-xs text-slate-700">
                        I agree to the Sabina Edge Tutor Code of Conduct, safety guidelines, and 15% marketplace commission structure.
                      </span>
                    </label>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
                    <Button variant="outline" className="w-full sm:w-auto rounded-xl font-bold" onClick={() => setCurrentStep(8)}>
                      <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <Button
                      variant="default"
                      size="lg"
                      isLoading={isSubmitting}
                      disabled={isSubmitting || !agreedToQualityCheck || !agreedToTerms}
                      className="w-full sm:w-auto font-extrabold bg-[#0B1E8A] hover:bg-[#081566] text-white rounded-2xl shadow-card px-6 sm:px-10 py-3.5 disabled:opacity-60 text-xs sm:text-sm"
                      onClick={handleSubmit}
                      rightIcon={<ShieldCheck className="h-5 w-5 text-[#F9C31C]" />}
                    >
                      {isSubmitting ? "Submitting Application..." : "Submit Application for Verification"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  </div>
);
}
