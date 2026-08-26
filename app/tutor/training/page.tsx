"use client";

import * as React from "react";
import Link from "next/link";
import {
  GraduationCap,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Play,
  ArrowRight,
  Download,
  Share2,
  ExternalLink,
  Laptop,
  Check,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { trainingService } from "@/services/trainingService";
import { TrainingCourse, TutorCertificate } from "@/src/modules/training/types/trainingTypes";
import { formatDate } from "@/lib/utils";

export default function TutorTrainingDashboard() {
  const [courses, setCourses] = React.useState<TrainingCourse[]>([]);
  const [certificates, setCertificates] = React.useState<TutorCertificate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedFilter, setSelectedFilter] = React.useState<string>("all");

  React.useEffect(() => {
    Promise.all([
      trainingService.getCourses(),
      trainingService.getCertificates()
    ])
      .then(([cList, certList]) => {
        setCourses(cList);
        setCertificates(certList);
      })
      .finally(() => setLoading(false));
  }, []);

  const completedCount = courses.filter((c) => c.status === "completed").length;
  const inProgressCount = courses.filter((c) => c.status === "in_progress").length;
  const totalHours = Math.round(courses.reduce((acc, c) => acc + c.estimatedMinutes, 0) / 60);

  const filteredCourses = courses.filter((c) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "mandatory") return c.isMandatory;
    if (selectedFilter === "completed") return c.status === "completed";
    if (selectedFilter === "in_progress") return c.status === "in_progress";
    return c.category.toLowerCase().includes(selectedFilter.toLowerCase());
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ── 1. Hero Header & Certification Ribbon ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#14209C] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 h-96 w-96 translate-x-1/3 -translate-y-1/3 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-40 bottom-0 h-64 w-64 translate-y-1/3 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              Sabina Tutor Academy
            </div>
            <h1 className="text-2xl sm:text-4xl font-black font-heading tracking-tight">
              Upskill, Certify & Boost Your Marketplace Rank
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Complete professional development masterclasses on digital classroom tools, active pedagogy, and safeguarding to earn verified credentials that display on your public tutor profile.
            </p>
          </div>

          {/* Quick Metrics Badge Card */}
          <div className="grid grid-cols-3 gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0 text-center">
            <div>
              <span className="text-2xl font-black text-white">{completedCount} / {courses.length}</span>
              <span className="text-[11px] text-slate-300 block font-semibold">Completed</span>
            </div>
            <div className="border-x border-white/10 px-3">
              <span className="text-2xl font-black text-amber-400">{certificates.length}</span>
              <span className="text-[11px] text-slate-300 block font-semibold">Badges Earned</span>
            </div>
            <div>
              <span className="text-2xl font-black text-emerald-400">{totalHours}h</span>
              <span className="text-[11px] text-slate-300 block font-semibold">Curriculum</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Earned Certification Badges Showcase ── */}
      {certificates.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shrink-0">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 font-heading">
                  Your Earned Academy Certifications
                </h3>
                <p className="text-xs text-slate-500">
                  Visible to students and parents searching for verified educators
                </p>
              </div>
            </div>
            <Badge variant="success" size="sm" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Profile Active
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="p-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50/40 via-white to-slate-50 flex items-start justify-between gap-3 group hover:border-amber-300 transition-all shadow-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">
                      {cert.badgeTitle}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {cert.courseTitle}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-mono font-semibold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      ID: {cert.certificateCode}
                    </span>
                  </div>
                </div>

                <Link href={`/tutor/training/certificates/${cert.id}`}>
                  <Button variant="outline" size="sm" className="text-xs font-bold shrink-0">
                    View
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. Filters & Course Catalogue ── */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 font-heading">
              Training Courses & Certification Tracks
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a course to start learning or review modules
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { id: "all", label: "All Courses" },
              { id: "mandatory", label: "Mandatory" },
              { id: "Classroom Tools", label: "Classroom Tools" },
              { id: "Pedagogy", label: "Pedagogy" },
              { id: "Safeguarding", label: "Safeguarding" },
              { id: "Exam Coaching", label: "Exam Coaching" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedFilter === f.id
                    ? "bg-slate-950 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const isDone = course.status === "completed";
            const inProgress = course.status === "in_progress";
            const progress = isDone ? 100 : course.progressPercentage || 0;

            return (
              <div
                key={course.id}
                className="flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all group"
              >
                <div>
                  {/* Thumbnail Banner */}
                  <div
                    className="relative h-44 w-full bg-slate-900 bg-cover bg-center overflow-hidden"
                    style={{ backgroundImage: `url(${course.thumbnailUrl})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                    
                    {/* Badges on Top of Image */}
                    <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                      <span className="text-[11px] font-extrabold bg-slate-950/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg border border-white/10">
                        {course.category}
                      </span>

                      {course.isMandatory && (
                        <span className="text-[11px] font-extrabold bg-rose-500 text-white px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                          Mandatory
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3.5 right-3.5 text-xs text-slate-300 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" /> {course.estimatedMinutes} mins
                      </span>
                      <span>•</span>
                      <span>{course.level}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 sm:p-6 space-y-3">
                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-[#14209C] transition-colors leading-snug font-heading">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {course.headline}
                    </p>

                    {/* Badge Reward Pill */}
                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100 flex items-center gap-2 text-xs font-bold text-amber-900">
                      <Award className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="truncate">Reward: {course.badgeTitle}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Progress & CTA */}
                <div className="p-5 sm:p-6 pt-0 space-y-3">
                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className={isDone ? "text-emerald-700" : "text-slate-500"}>
                        {isDone ? "Completed 100%" : inProgress ? `${progress}% Completed` : "Not Started"}
                      </span>
                      {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isDone ? "bg-emerald-500" : inProgress ? "bg-slate-950" : "bg-slate-200"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* CTA button */}
                  <Link href={`/tutor/training/${course.slug}`} className="block w-full">
                    <Button
                      variant={isDone ? "outline" : "default"}
                      size="default"
                      className={`w-full font-bold rounded-xl cursor-pointer ${
                        isDone
                          ? "border-slate-200 text-slate-800 hover:bg-slate-50"
                          : "bg-slate-950 hover:bg-slate-800 text-white"
                      }`}
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      {isDone ? "Review Modules" : inProgress ? "Continue Learning" : "Start Masterclass"}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
