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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Avatar } from "@/components/ui/Avatar";
import { Logo } from "@/components/ui/Logo";
import { FileUploadWithLink } from "@/components/ui/FileUploadWithLink";
import { mockSubjects } from "@/lib/mock-data/subjects";
import { mockLanguages } from "@/lib/mock-data/languages";

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
  const [showLivePreview, setShowLivePreview] = React.useState(false);

  // ── STEP 1: ABOUT YOU ──
  const [firstName, setFirstName] = React.useState("Elena");
  const [lastName, setLastName] = React.useState("Rostova");
  const [displayName, setDisplayName] = React.useState("Dr. Elena Rostova");
  const [country, setCountry] = React.useState("United Kingdom");
  const [timezone, setTimezone] = React.useState("Europe/London (GMT+1)");
  const [phone, setPhone] = React.useState("+44 20 7946 0912");
  const [avatarPreview, setAvatarPreview] = React.useState(
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400"
  );

  // ── STEP 2: TEACHING PROFILE & BIO ──
  const [headline, setHeadline] = React.useState(
    "Oxford Ph.D. in Pure Mathematics • 10+ Yrs AP Calculus, Olympiad & STEP/MAT Coach"
  );
  const [bioAboutMe, setBioAboutMe] = React.useState(
    "I am a Senior Lecturer and dedicated mathematics mentor with a Ph.D. from the University of Oxford. Over the past 10 years, I have helped more than 350 students bridge the gap between mechanical calculations and deep, intuitive conceptual understanding."
  );
  const [bioExperience, setBioExperience] = React.useState(
    "I have taught undergraduate analysis at Oxford and coached regional Olympiad teams to top-tier finishes. My specialized tracks cover AP Calculus AB/BC, IB Math AA HL, SAT Math 800 preparation, and Oxbridge STEP/MAT entrance exams."
  );
  const [bioStyle, setBioStyle] = React.useState(
    "My virtual classroom is fully interactive. Every student receives live visual derivation on a collaborative whiteboard, step-by-step LaTeX formula breakdowns, and personalized problem sets after each session."
  );
  const [selectedLanguages, setSelectedLanguages] = React.useState([
    { code: "en", name: "English", proficiency: "Native / Bilingual" },
    { code: "fr", name: "French", proficiency: "Advanced (C1)" },
  ]);

  // ── STEP 3: ACADEMIC DEGREES ──
  const [degrees, setDegrees] = React.useState([
    {
      id: "deg-1",
      degree: "Ph.D. in Pure Mathematics",
      institution: "University of Oxford",
      fieldOfStudy: "Algebraic Geometry & Differential Topology",
      startYear: "2015",
      endYear: "2019",
      honors: "Doctoral Thesis Distinction • Clarendon Scholar",
      documentName: "Oxford_PhD_Diploma_Verified.pdf",
    },
    {
      id: "deg-2",
      degree: "M.Sc. in Mathematical Sciences",
      institution: "Imperial College London",
      fieldOfStudy: "Applied Mathematics",
      startYear: "2013",
      endYear: "2015",
      honors: "First Class Honours (Dean's List)",
      documentName: "Imperial_MSc_Transcript.pdf",
    },
  ]);

  // ── STEP 4: CERTIFICATIONS & LICENSES ──
  const [certifications, setCertifications] = React.useState([
    {
      id: "cert-1",
      title: "Qualified Teacher Status (QTS)",
      issuer: "UK Department for Education",
      issueYear: "2019",
      credentialId: "QTS-GB-884920",
    },
    {
      id: "cert-2",
      title: "AP Calculus Master Instructor Certification",
      issuer: "College Board",
      issueYear: "2020",
      credentialId: "CB-AP-992143",
    },
  ]);

  // ── STEP 5: WORK EXPERIENCE ──
  const [experiences, setExperiences] = React.useState([
    {
      id: "exp-1",
      role: "Senior Lecturer in Mathematics",
      organization: "Oxford Mathematical Institute",
      startYear: "2019",
      endYear: "Present",
      description: "Delivering lecture series on Differential Topology and Multivariable Calculus.",
    },
    {
      id: "exp-2",
      role: "Lead Olympiad & STEP Coach",
      organization: "Westminster Academic Academy",
      startYear: "2016",
      endYear: "2021",
      description: "Mentored high-school students for British Mathematical Olympiad and Oxford MAT exams.",
    },
  ]);

  // ── STEP 6: SUBJECTS & PRICING ──
  const [primarySubjectId, setPrimarySubjectId] = React.useState("sub-2"); // Mathematics
  const [secondarySubjectIds, setSecondarySubjectIds] = React.useState<string[]>(["sub-5", "sub-4"]); // Physics, Python
  const [hourlyRate, setHourlyRate] = React.useState(65);
  const [offerTrialDiscount, setOfferTrialDiscount] = React.useState(true);
  const [trialPrice, setTrialPrice] = React.useState(32);
  const [instantBookingEnabled, setInstantBookingEnabled] = React.useState(true);
  const [noticeHours, setNoticeHours] = React.useState("12");

  // ── STEP 7: AVAILABILITY ──
  const [schedule, setSchedule] = React.useState([
    { day: "Monday", active: true, start: "09:00", end: "18:00" },
    { day: "Tuesday", active: true, start: "09:00", end: "18:00" },
    { day: "Wednesday", active: true, start: "09:00", end: "18:00" },
    { day: "Thursday", active: true, start: "09:00", end: "18:00" },
    { day: "Friday", active: true, start: "09:00", end: "17:00" },
    { day: "Saturday", active: true, start: "10:00", end: "15:00" },
    { day: "Sunday", active: false, start: "10:00", end: "14:00" },
  ]);

  // ── STEP 8: VIDEO INTRO ──
  const [videoUrl, setVideoUrl] = React.useState("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  const [agreedToQualityCheck, setAgreedToQualityCheck] = React.useState(true);
  const [agreedToTerms, setAgreedToTerms] = React.useState(true);

  // Helper actions
  const addDegree = () => {
    setDegrees([
      ...degrees,
      {
        id: `deg-${Date.now()}`,
        degree: "",
        institution: "",
        fieldOfStudy: "",
        startYear: "2020",
        endYear: "2024",
        honors: "",
        documentName: "",
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
        startYear: "2022",
        endYear: "Present",
        description: "",
      },
    ]);
  };

  const removeExperience = (id: string) => {
    setExperiences(experiences.filter((e) => e.id !== id));
  };

  const completionPercentage = Math.round((currentStep / ONBOARDING_STEPS.length) * 100);

  const handleSubmit = () => {
    setIsSubmitted(true);
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

          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-500 hidden md:inline">
              Step {currentStep} of {ONBOARDING_STEPS.length} ({completionPercentage}%)
            </span>
            <button
              type="button"
              onClick={() => setShowLivePreview(!showLivePreview)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition-colors"
            >
              <Eye className="h-3.5 w-3.5 text-brand-700" />
              {showLivePreview ? "Hide Preview" : "Live Preview"}
            </button>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <Check className="h-3 w-3" /> Draft Saved
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Progress Bar Strip */}
        <div className="mb-8">
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
                <li>Registrar verifies Oxford diploma & UK QTS credential ID.</li>
                <li>Video introduction analyzed for clarity & sound quality.</li>
                <li>Your tutor profile goes live on the marketplace.</li>
              </ul>
            </div>

            <div className="flex justify-center gap-3 pt-4">
              <Link href="/tutor">
                <Button variant="default" size="lg" className="font-extrabold bg-slate-950 hover:bg-slate-800 text-white rounded-xl shadow-xs">
                  Explore Tutor Console
                </Button>
              </Link>
              <Link href={`/tutors/dr-elena-rostova`}>
                <Button variant="outline" size="lg" className="font-bold border-slate-200 rounded-xl">
                  View Public Profile Preview
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ═══════════════════════════════════════════════════════════
                LEFT COLUMN: Interactive Step Stepper
            ═══════════════════════════════════════════════════════════ */}
            <aside className="lg:col-span-4 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-2 sticky top-24">
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
            <div className="lg:col-span-8 rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-xs space-y-8">
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
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Country of Residence
                      </label>
                      <Input value={country} onChange={(e) => setCountry(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Timezone
                      </label>
                      <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <Button
                      variant="default"
                      size="lg"
                      className="font-extrabold bg-slate-950 hover:bg-slate-800 text-white rounded-xl shadow-xs px-8"
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
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Languages You Can Teach In
                    </label>
                    <div className="space-y-2">
                      {selectedLanguages.map((l, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                          <Globe className="h-4 w-4 text-brand-700" />
                          <strong className="text-xs text-slate-900">{l.name}</strong>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            {l.proficiency}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <Button variant="outline" className="rounded-xl font-bold" onClick={() => setCurrentStep(1)}>
                      <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <Button
                      variant="default"
                      size="lg"
                      className="font-extrabold bg-slate-950 hover:bg-slate-800 text-white rounded-xl shadow-xs px-8"
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
                      Academic Degrees & Verified Diplomas
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Add your undergraduate, master&apos;s, or doctoral credentials with diploma verification.
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
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Graduation Year
                            </label>
                            <Input
                              value={deg.endYear}
                              onChange={(e) => {
                                const newDegs = [...degrees];
                                newDegs[index].endYear = e.target.value;
                                setDegrees(newDegs);
                              }}
                            />
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
                            value={(deg as any).documentUrl || ""}
                            onChange={(url, meta) => {
                              const newDegs = [...degrees];
                              (newDegs[index] as any).documentUrl = url;
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

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <Button variant="outline" className="rounded-xl font-bold" onClick={() => setCurrentStep(2)}>
                      <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <Button
                      variant="default"
                      size="lg"
                      className="font-extrabold bg-slate-950 hover:bg-slate-800 text-white rounded-xl shadow-xs px-8"
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
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Year Issued
                            </label>
                            <Input
                              value={cert.issueYear}
                              onChange={(e) => {
                                const newC = [...certifications];
                                newC[index].issueYear = e.target.value;
                                setCertifications(newC);
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <FileUploadWithLink
                            label="Teaching License / Certificate PDF"
                            description="Upload TEFL/CELTA certificate to Cloudinary or paste credential URL."
                            type="document"
                            value={(cert as any).documentUrl || ""}
                            onChange={(url, meta) => {
                              const newC = [...certifications];
                              (newC[index] as any).documentUrl = url;
                              (newC[index] as any).documentName = meta?.fileName || "Uploaded_Certificate.pdf";
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

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <Button variant="outline" className="rounded-xl font-bold" onClick={() => setCurrentStep(3)}>
                      <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <Button
                      variant="default"
                      size="lg"
                      className="font-extrabold bg-slate-950 hover:bg-slate-800 text-white rounded-xl shadow-xs px-8"
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
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Start Year
                            </label>
                            <Input
                              value={exp.startYear}
                              onChange={(e) => {
                                const newE = [...experiences];
                                newE[index].startYear = e.target.value;
                                setExperiences(newE);
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                              End Year
                            </label>
                            <Input
                              value={exp.endYear}
                              onChange={(e) => {
                                const newE = [...experiences];
                                newE[index].endYear = e.target.value;
                                setExperiences(newE);
                              }}
                            />
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

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <Button variant="outline" className="rounded-xl font-bold" onClick={() => setCurrentStep(4)}>
                      <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <Button
                      variant="default"
                      size="lg"
                      className="font-extrabold bg-slate-950 hover:bg-slate-800 text-white rounded-xl shadow-xs px-8"
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

                  {/* Primary Subject */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Primary Teaching Discipline
                    </label>
                    <select
                      value={primarySubjectId}
                      onChange={(e) => setPrimarySubjectId(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 p-3.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-700 shadow-xs"
                    >
                      {mockSubjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Hourly Rate Slider */}
                  <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Standard Hourly Rate (50-Min Lesson)
                        </span>
                        <p className="text-xs text-slate-500 mt-0.5">
                          You keep 85% of your earnings after platform processing.
                        </p>
                      </div>
                      <div className="text-3xl font-black text-brand-700 font-heading">
                        ${hourlyRate} <span className="text-xs font-semibold text-slate-500">USD/hr</span>
                      </div>
                    </div>

                    <input
                      type="range"
                      min="20"
                      max="150"
                      step="5"
                      value={hourlyRate}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setHourlyRate(val);
                        setTrialPrice(Math.round(val * 0.5));
                      }}
                      className="w-full accent-brand-700 cursor-pointer"
                    />

                    <div className="flex justify-between text-[11px] text-slate-400 font-bold">
                      <span>$20/hr</span>
                      <span>$65/hr (Recommended for Verified Instructors)</span>
                      <span>$150/hr</span>
                    </div>
                  </div>

                  {/* Trial Lesson Discount */}
                  <div className="p-5 rounded-3xl bg-emerald-50/50 border border-emerald-200 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-bold text-slate-900">
                          Offer 50% Off 25-Min Trial Lessons
                        </strong>
                        <Badge variant="subtle" size="sm" className="bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          Boosts Bookings 4x
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600">
                        First-time students can book a 25-minute intro session for <strong>${trialPrice} USD</strong>.
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

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <Button variant="outline" className="rounded-xl font-bold" onClick={() => setCurrentStep(5)}>
                      <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <Button
                      variant="default"
                      size="lg"
                      className="font-extrabold bg-slate-950 hover:bg-slate-800 text-white rounded-xl shadow-xs px-8"
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
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                          item.active
                            ? "border-slate-200/90 bg-slate-50"
                            : "border-slate-100 bg-slate-50/40 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
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
                        </div>

                        {item.active ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={item.start}
                              onChange={(e) => {
                                const newS = [...schedule];
                                newS[idx].start = e.target.value;
                                setSchedule(newS);
                              }}
                              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-mono font-bold text-slate-800"
                            />
                            <span className="text-xs text-slate-400">to</span>
                            <input
                              type="time"
                              value={item.end}
                              onChange={(e) => {
                                const newS = [...schedule];
                                newS[idx].end = e.target.value;
                                setSchedule(newS);
                              }}
                              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-mono font-bold text-slate-800"
                            />
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400 pr-4">
                            Day Off
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <Button variant="outline" className="rounded-xl font-bold" onClick={() => setCurrentStep(6)}>
                      <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <Button
                      variant="default"
                      size="lg"
                      className="font-extrabold bg-slate-950 hover:bg-slate-800 text-white rounded-xl shadow-xs px-8"
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

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <Button variant="outline" className="rounded-xl font-bold" onClick={() => setCurrentStep(7)}>
                      <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <Button
                      variant="default"
                      size="lg"
                      className="font-extrabold bg-slate-950 hover:bg-slate-800 text-white rounded-xl shadow-xs px-8"
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
                  <div className="p-6 rounded-3xl border border-slate-200/90 bg-slate-50/50 space-y-4 shadow-xs">
                    <div className="flex items-start gap-4">
                      <Avatar
                        src={avatarPreview}
                        fallbackName={displayName}
                        size="lg"
                        statusIndicator="online"
                        superTutor={true}
                      />
                      <div className="space-y-1">
                        <h3 className="text-lg font-black text-slate-900 font-heading">
                          {displayName}
                        </h3>
                        <p className="text-xs font-semibold text-slate-600">
                          {headline}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {country} • {timezone} • ${hourlyRate}/hr (${trialPrice} trial)
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="p-3 rounded-2xl bg-white border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Degrees</span>
                        <strong className="block text-xs text-slate-900 mt-0.5">{degrees.length} Verified Degrees</strong>
                      </div>
                      <div className="p-3 rounded-2xl bg-white border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Licenses</span>
                        <strong className="block text-xs text-slate-900 mt-0.5">{certifications.length} Certifications</strong>
                      </div>
                      <div className="p-3 rounded-2xl bg-white border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Experience</span>
                        <strong className="block text-xs text-slate-900 mt-0.5">{experiences.length} Career Roles</strong>
                      </div>
                    </div>
                  </div>

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

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <Button variant="outline" className="rounded-xl font-bold" onClick={() => setCurrentStep(8)}>
                      <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <Button
                      variant="default"
                      size="lg"
                      disabled={!agreedToQualityCheck || !agreedToTerms}
                      className="font-extrabold bg-[#0B1E8A] hover:bg-[#081566] text-white rounded-2xl shadow-card px-10 py-3.5"
                      onClick={handleSubmit}
                      rightIcon={<ShieldCheck className="h-5 w-5 text-[#F9C31C]" />}
                    >
                      Submit Tutor Application for Verification
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
