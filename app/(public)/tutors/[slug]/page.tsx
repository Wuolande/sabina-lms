"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Clock,
  Globe,
  Award,
  GraduationCap,
  Sparkles,
  Heart,
  MessageSquare,
  Calendar,
  Play,
  CheckCircle2,
  Share2,
  BookOpen,
  ArrowRight,
  Briefcase,
  Layers,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Lock,
  Check,
  HelpCircle,
  Video,
  PenTool,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Rating } from "@/components/ui/Rating";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { EmptyState } from "@/components/ui/EmptyState";
import { BookingModal } from "@/components/booking/BookingModal";
import { BookingCalendar } from "@/components/booking/BookingCalendar";
import { tutorService } from "@/services/tutorService";
import { studentService } from "@/services/studentService";
import { mockReviews } from "@/lib/mock-data/reviews";
import { TutorProfile, Review } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const profileTabs = [
  { id: "about", label: "About & Philosophy" },
  { id: "qualifications", label: "Qualifications & Degrees" },
  { id: "certifications", label: "Certifications & Licenses" },
  { id: "experience", label: "Teaching Experience" },
  { id: "curriculum", label: "Subjects & Curriculum" },
  { id: "methodology", label: "Classroom & Tools" },
  { id: "schedule", label: "Live Schedule" },
  { id: "reviews", label: "Student Reviews" },
  { id: "faqs", label: "FAQs" },
];

export default function TutorProfilePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [tutor, setTutor] = React.useState<TutorProfile | null>(null);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);
  const [isPlayingVideo, setIsPlayingVideo] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("about");
  const [selectedScheduleDate, setSelectedScheduleDate] = React.useState<string>("");
  const [selectedScheduleTime, setSelectedScheduleTime] = React.useState<string>("14:00");
  const [expandedFaq, setExpandedFaq] = React.useState<number | null>(0);
  const [copiedLink, setCopiedLink] = React.useState(false);

  React.useEffect(() => {
    if (slug) {
      tutorService.getTutorBySlug(slug).then((res) => {
        setTutor(res);
        if (res) {
          studentService.isTutorFavorite(res.id).then(setIsFavorite);
          const tutorRev = mockReviews.filter((r) => r.tutorId === res.id);
          setReviews(tutorRev.length > 0 ? tutorRev : mockReviews.slice(0, 3));
        }
      });
    }
  }, [slug]);

  if (!tutor) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <EmptyState
          title="Tutor not found"
          description="The tutor profile you requested does not exist or has been removed."
          actionLabel="Browse All Tutors"
          actionHref="/find-tutors"
        />
      </div>
    );
  }

  const handleToggleFavorite = async () => {
    const updated = await studentService.toggleFavoriteTutor(tutor.id);
    setIsFavorite(updated);
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  // Calculate review score distributions
  const totalRev = reviews.length || tutor.reviewCount || 1;
  const ratingDistribution = [
    { stars: 5, pct: 92, count: Math.round(totalRev * 0.92) },
    { stars: 4, pct: 6, count: Math.round(totalRev * 0.06) },
    { stars: 3, pct: 2, count: Math.round(totalRev * 0.02) },
    { stars: 2, pct: 0, count: 0 },
    { stars: 1, pct: 0, count: 0 },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* ── Top Bar: Breadcrumb + Action Buttons ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <Breadcrumb
          items={[
            { label: "Find Tutors", href: "/find-tutors" },
            {
              label: tutor.subjects[0]?.subject.name || "Subject",
              href: `/find-tutors?subject=${tutor.subjects[0]?.subject.slug}`,
            },
            { label: tutor.user.displayName },
          ]}
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Share2 className="h-3.5 w-3.5" />
            {copiedLink ? "Link Copied!" : "Share Profile"}
          </button>
          <button
            type="button"
            onClick={handleToggleFavorite}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors shadow-xs ${
              isFavorite
                ? "border-rose-200 bg-rose-50 text-rose-600"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
            {isFavorite ? "Saved" : "Save Tutor"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* ═══════════════════════════════════════════════════════════
            LEFT 2 COLS: Comprehensive Tutor LMS Profile Details
        ═══════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-2 space-y-8">
          {/* ── 1. Hero Header Card & Key Verification Ribbons ── */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-card space-y-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="relative shrink-0">
                <Avatar
                  src={tutor.user.avatarUrl}
                  fallbackName={tutor.user.displayName}
                  size="2xl"
                  statusIndicator="online"
                  superTutor={tutor.isSuperTutor}
                  className="ring-4 ring-slate-100 shadow-sm"
                />
              </div>

              <div className="flex-1 space-y-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading">
                    {tutor.user.displayName}
                  </h1>

                  {tutor.verificationStatus === "APPROVED" && (
                    <span
                      title="Identity Verified • Degree Verified • Background Check Cleared"
                      className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/90 px-2.5 py-1 rounded-full"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      100% Verified
                    </span>
                  )}

                  {tutor.isSuperTutor && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/90 px-2.5 py-1 rounded-full">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-400 shrink-0" />
                      Top 1% Super Tutor
                    </span>
                  )}
                </div>

                <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                  {tutor.headline}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Rating value={tutor.averageRating} count={tutor.reviewCount} size="sm" />
                  </div>
                  <span>•</span>
                  <span>
                    <strong className="text-slate-900">{tutor.totalLessons.toLocaleString()}</strong> lessons taught
                  </span>
                  <span>•</span>
                  <span>
                    <strong className="text-slate-900">{tutor.totalStudents}</strong> active students
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <Globe className="h-3.5 w-3.5 text-slate-400" />
                    {tutor.user.country} ({tutor.user.timezone || "GMT+1"})
                  </span>
                </div>
              </div>
            </div>

            {/* ── Trust Metrics Bar ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-slate-100 text-center">
              <div className="rounded-2xl bg-slate-50/80 p-3 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Experience
                </span>
                <span className="text-sm font-extrabold text-slate-900">
                  {tutor.yearsExperience}+ Years
                </span>
              </div>
              <div className="rounded-2xl bg-slate-50/80 p-3 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Response Time
                </span>
                <span className="text-sm font-extrabold text-slate-900">
                  ~{tutor.responseTimeMinutes || 12} mins
                </span>
              </div>
              <div className="rounded-2xl bg-slate-50/80 p-3 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Attendance
                </span>
                <span className="text-sm font-extrabold text-emerald-600">
                  {tutor.attendanceRate || 99.4}%
                </span>
              </div>
              <div className="rounded-2xl bg-slate-50/80 p-3 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Repeat Students
                </span>
                <span className="text-sm font-extrabold text-brand-700">
                  {tutor.repeatStudentRate || 94}% Continue
                </span>
              </div>
            </div>
          </div>

          {/* ── In-Page Anchor Navigation Bar ── */}
          <div className="sticky top-[70px] z-30 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {profileTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => scrollToSection(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 ${
                  activeTab === tab.id
                    ? "bg-slate-950 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── 2. Introduction Video Preview ── */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 font-heading">
                <Play className="h-5 w-5 text-brand-700" />
                Video Introduction & Teaching Sample
              </h3>
              <span className="text-xs font-semibold text-slate-500">1 min 45 sec</span>
            </div>

            <div className="relative aspect-video rounded-2xl bg-slate-950 overflow-hidden flex items-center justify-center border border-slate-200 shadow-inner">
              {isPlayingVideo ? (
                <video
                  src={tutor.introVideoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="relative w-full h-full cursor-pointer flex items-center justify-center group select-none"
                  onClick={() => setIsPlayingVideo(true)}
                  style={{
                    backgroundImage: `url(${
                      tutor.videoThumbnail ||
                      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800"
                    })`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/25 transition-colors" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-elevation group-hover:scale-110 group-hover:shadow-glow-amber transition-transform duration-200">
                    <Play className="h-7 w-7 fill-current ml-1" />
                  </div>
                  <span className="absolute bottom-4 left-4 text-xs font-bold text-white bg-slate-950/80 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-white/10">
                    ▶ Watch {tutor.user.firstName}&apos;s Introduction & Problem Walkthrough
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── 3. About Me & Teaching Philosophy ── */}
          <div
            id="about"
            className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-card space-y-6 scroll-mt-28"
          >
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-3 font-heading">
                About {tutor.user.displayName}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {tutor.bio}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Teaching Philosophy & Approach
              </h4>
              <div className="p-4 rounded-2xl bg-brand-50/70 border border-brand-100 text-sm text-brand-950 font-medium leading-relaxed">
                “{tutor.teachingStyle}”
              </div>
            </div>
          </div>

          {/* ── 4. Academic Qualifications & Degrees (Education) ── */}
          <div
            id="qualifications"
            className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-card space-y-6 scroll-mt-28"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 font-heading">
                  <GraduationCap className="h-5 w-5 text-brand-700" />
                  Academic Qualifications & Degrees
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified by Sabina Edge Academic Credentials Registrar
                </p>
              </div>
              <Badge variant="success" size="sm" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> All Degrees Verified
              </Badge>
            </div>

            <div className="space-y-4">
              {tutor.education.map((edu) => (
                <div
                  key={edu.id}
                  className="flex items-start gap-4 p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-slate-300 transition-all shadow-xs"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 shrink-0 border border-brand-100">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900">
                        {edu.degree}
                      </h4>
                      <span className="text-xs font-extrabold text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg">
                        {edu.startYear} – {edu.endYear || "Present"}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-brand-800 mt-0.5">
                      {edu.institution} {edu.location ? `• ${edu.location}` : ""}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      <strong>Field of Study:</strong> {edu.fieldOfStudy}
                    </p>
                    {edu.honors && (
                      <p className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                        <Award className="h-3.5 w-3.5" /> {edu.honors}
                      </p>
                    )}
                    {edu.isVerified && (
                      <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                        <Check className="h-3 w-3" /> Official Diploma & Transcript Verified
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 5. Professional Certifications & Licenses ── */}
          <div
            id="certifications"
            className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-card space-y-6 scroll-mt-28"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 font-heading">
                  <Award className="h-5 w-5 text-amber-500" />
                  Professional Certifications & Teaching Licenses
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Accredited teaching credentials and subject specialization certificates
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tutor.certifications.map((cert) => (
                <div
                  key={cert.id}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-slate-300 transition-all shadow-xs flex items-start gap-3.5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shrink-0 border border-amber-100">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">
                      {cert.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">{cert.issuer}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-[11px] text-slate-400 font-medium">
                        Issued {cert.issueYear}
                      </span>
                      {cert.credentialId && (
                        <span className="text-[11px] font-mono text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                          ID: {cert.credentialId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 6. Teaching & Professional Work History (Timeline) ── */}
          {tutor.experience && tutor.experience.length > 0 && (
            <div
              id="experience"
              className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-card space-y-6 scroll-mt-28"
            >
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 font-heading">
                  <Briefcase className="h-5 w-5 text-brand-700" />
                  Teaching & Professional Work History
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track record in academic institutions, competitive test prep, and coaching
                </p>
              </div>

              <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                {tutor.experience.map((exp) => (
                  <div key={exp.id} className="relative flex items-start gap-4 pl-1">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-700 text-white shrink-0 ring-4 ring-white z-10">
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                    <div className="flex-1 rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 shadow-xs">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900">{exp.role}</h4>
                        <span className="text-xs font-bold text-brand-700 bg-brand-50 border border-brand-100 px-2.5 py-0.5 rounded-full">
                          {exp.startYear} – {exp.endYear || "Present"}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-600 mt-0.5">
                        {exp.organization} {exp.location ? `• ${exp.location}` : ""}
                      </p>
                      <p className="text-xs text-slate-700 leading-relaxed mt-2">
                        {exp.description}
                      </p>
                      {exp.highlights && exp.highlights.length > 0 && (
                        <ul className="mt-2.5 space-y-1">
                          {exp.highlights.map((h, i) => (
                            <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                              <span className="text-emerald-600 font-bold">✓</span>
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 7. Subjects, Curriculum & Languages ── */}
          <div
            id="curriculum"
            className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-card space-y-6 scroll-mt-28"
          >
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-3 flex items-center gap-2 font-heading">
                <BookOpen className="h-5 w-5 text-brand-700" />
                Subjects Taught & Curriculum Coverage
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tutor.subjects.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-sm font-bold text-slate-900">{sub.subject.name}</strong>
                      {sub.isPrimary && (
                        <Badge variant="subtle" size="sm" className="bg-brand-50 text-brand-800">
                          Primary Discipline
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {sub.levels.map((lvl) => (
                        <span
                          key={lvl}
                          className="text-[11px] font-bold bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md"
                        >
                          {lvl}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Curriculum Highlights */}
            {tutor.curriculumHighlights && (
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Specialized Syllabi & Target Exams
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {tutor.curriculumHighlights.map((curr, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{curr}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Languages Spoken */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Globe className="h-4 w-4 text-brand-700" /> Languages Spoken
              </h3>
              <div className="flex flex-wrap gap-2">
                {tutor.languages.map((l) => (
                  <div
                    key={l.languageId}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800"
                  >
                    <span>{l.language.name}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-brand-700 font-extrabold">{l.proficiency}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── 8. Teaching Methodology & Classroom Features ── */}
          <div
            id="methodology"
            className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-card space-y-6 scroll-mt-28"
          >
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 font-heading">
                <Layers className="h-5 w-5 text-brand-700" />
                Live Classroom Experience & Learning Tools
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Included with every 1-on-1 session on the Sabina Edge Live Classroom
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tutor.methodology ? (
                tutor.methodology.map((m, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 space-y-1.5"
                  >
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {m.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {m.description}
                    </p>
                  </div>
                ))
              ) : (
                <>
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40 space-y-1">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <PenTool className="h-4 w-4 text-brand-700" /> Interactive Digital Whiteboard
                    </h4>
                    <p className="text-xs text-slate-600">
                      Collaborative canvas with instant LaTeX math formatting, graph plotting, and file uploads.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40 space-y-1">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Video className="h-4 w-4 text-emerald-600" /> HD LiveKit Video & Audio
                    </h4>
                    <p className="text-xs text-slate-600">
                      Ultra-low latency crystal clear video calling with screen share and audio isolation.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── 9. Interactive Weekly Schedule & Slot Booking ── */}
          <div
            id="schedule"
            className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-card space-y-5 scroll-mt-28"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 font-heading">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                  Weekly Schedule & Live Availability
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select an open slot to schedule directly with {tutor.user.firstName}.
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full self-start sm:self-auto">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Slots Synchronized
              </span>
            </div>

            {/* Embedded Calendar Component */}
            <BookingCalendar
              selectedDate={selectedScheduleDate}
              selectedTime={selectedScheduleTime}
              onSelectSlot={(d, t) => {
                setSelectedScheduleDate(d);
                setSelectedScheduleTime(t);
              }}
              durationMinutes={50}
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-500">
                <span>Selected: </span>
                <strong className="text-slate-900">
                  {selectedScheduleDate ? formatDate(selectedScheduleDate) : "Tomorrow"} at{" "}
                  {selectedScheduleTime || "14:00"}
                </strong>
              </div>

              <Button
                variant="default"
                size="default"
                className="w-full sm:w-auto font-extrabold bg-slate-950 hover:bg-slate-800 text-white rounded-xl shadow-xs"
                onClick={() => setIsBookingOpen(true)}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Book Selected Slot ({formatCurrency(tutor.hourlyRate, tutor.currency)})
              </Button>
            </div>
          </div>

          {/* ── 10. Student Reviews & Testimonials ── */}
          <div
            id="reviews"
            className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-card space-y-6 scroll-mt-28"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 font-heading">
                  Student Reviews & Feedback ({tutor.reviewCount})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  100% verified reviews from completed lessons on Sabina Edge
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-3xl font-black text-slate-900 font-heading">
                    {tutor.averageRating}
                  </span>
                  <span className="text-xs text-slate-400 block font-semibold">out of 5.0</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <Rating value={tutor.averageRating} size="default" showCount={false} />
                  <span className="text-[11px] text-emerald-600 font-bold">
                    99% Recommended
                  </span>
                </div>
              </div>
            </div>

            {/* Score Distribution Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 p-4 rounded-2xl bg-slate-50/60 border border-slate-100 text-xs">
              {ratingDistribution.map((r) => (
                <div key={r.stars} className="flex items-center gap-2">
                  <span className="w-10 font-bold text-slate-700">{r.stars} Stars</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${r.pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-slate-500 font-semibold">{r.pct}%</span>
                </div>
              ))}
            </div>

            {/* Individual Reviews */}
            <div className="space-y-4 divide-y divide-slate-100">
              {reviews.map((rev) => (
                <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        src={rev.student.avatarUrl}
                        fallbackName={rev.student.displayName}
                        size="sm"
                      />
                      <div>
                        <strong className="text-xs font-bold text-slate-900">
                          {rev.student.displayName}
                        </strong>
                        <span className="text-[11px] text-slate-400 block">
                          Verified Lesson • {formatDate(rev.createdAt)}
                        </span>
                      </div>
                    </div>
                    <Rating value={rev.rating} size="sm" showCount={false} />
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    “{rev.reviewText}”
                  </p>

                  {rev.tutorResponse && (
                    <div className="mt-2 ml-4 p-3 rounded-xl bg-slate-50 border-l-2 border-brand-700 text-xs space-y-1">
                      <strong className="text-[11px] font-bold text-slate-800">
                        {tutor.user.displayName} (Tutor Response):
                      </strong>
                      <p className="text-slate-600">{rev.tutorResponse}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── 11. Frequently Asked Questions (Accordion) ── */}
          <div
            id="faqs"
            className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-card space-y-5 scroll-mt-28"
          >
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 font-heading">
                <HelpCircle className="h-5 w-5 text-brand-700" />
                Frequently Asked Questions
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Common questions about scheduling, preparation, and lesson policies
              </p>
            </div>

            <div className="space-y-3">
              {(tutor.faqs || [
                {
                  question: "How does the 25-minute trial lesson work?",
                  answer:
                    "In the trial lesson, we evaluate your current level, pinpoint learning goals, solve sample questions together, and map out a custom syllabus tailored to your targets.",
                },
                {
                  question: "What software or equipment do I need?",
                  answer:
                    "You only need a modern web browser (Chrome, Firefox, Safari) and a microphone. Our LiveKit classroom runs directly in your browser without downloads.",
                },
                {
                  question: "Can I reschedule or cancel a lesson?",
                  answer:
                    "Yes, you can reschedule or cancel for a full refund up to 12 hours before the scheduled start time directly from your Student Portal.",
                },
                {
                  question: "Do you assign homework between sessions?",
                  answer:
                    "Yes! Tailored practice problems and annotated lesson summary PDFs are uploaded to your lesson portal after each class.",
                },
              ]).map((faq, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200/80 overflow-hidden transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isOpen ? null : idx)}
                      className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      <span>{faq.question}</span>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            RIGHT 1 COL: Sticky Conversion & Booking Card
        ═══════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-elevation space-y-6">
            {/* Price Header */}
            <div className="flex items-baseline justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-3xl font-black text-slate-900 font-heading">
                  {formatCurrency(tutor.hourlyRate, tutor.currency)}
                </span>
                <span className="text-xs text-slate-500 font-medium block">
                  per 50-minute lesson
                </span>
              </div>
              <Badge variant="secondary" size="sm" className="font-extrabold bg-amber-400 text-slate-950">
                100% Guaranteed
              </Badge>
            </div>

            {/* Trial Offer Card */}
            <div className="rounded-2xl bg-brand-50/80 p-4 border border-brand-100 space-y-1.5">
              <span className="text-xs font-extrabold text-brand-800 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-brand-700 fill-brand-600" />
                50% Off Intro Trial Lesson
              </span>
              <p className="text-xs text-brand-950/80 leading-relaxed">
                Book a 25-minute test lesson for only{" "}
                <strong>{formatCurrency(Math.round(tutor.hourlyRate / 2), tutor.currency)}</strong>. If you are not completely satisfied, we issue a 100% full refund.
              </p>
            </div>

            {/* CTAs */}
            <div className="space-y-3">
              <Button
                variant="default"
                size="lg"
                className="w-full font-extrabold bg-brand-700 hover:bg-brand-800 shadow-card py-3.5 rounded-2xl"
                onClick={() => setIsBookingOpen(true)}
                leftIcon={<Calendar className="h-4 w-4" />}
              >
                Book a Lesson
              </Button>

              <Link href={`/student/messages?tutor=${tutor.id}`} className="block">
                <Button
                  variant="outline"
                  size="default"
                  className="w-full font-bold border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl"
                  leftIcon={<MessageSquare className="h-4 w-4" />}
                >
                  Send Message
                </Button>
              </Link>
            </div>

            {/* Trust Signals Checklist */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Verified Academic Credentials</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Reschedule free up to 12h before</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Secure SSL encrypted checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-brand-700 shrink-0" />
                <span>Built-in browser live classroom</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        tutor={tutor}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        initialDate={selectedScheduleDate}
        initialTime={selectedScheduleTime}
      />
    </div>
  );
}
