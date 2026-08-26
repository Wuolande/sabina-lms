"use client";

import * as React from "react";
import Link from "next/link";
import {
  GraduationCap,
  Award,
  BookOpen,
  Users,
  CheckCircle2,
  TrendingUp,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TrainingCourse } from "@/src/modules/training/types/trainingTypes";
import { mockTrainingCourses } from "@/lib/mock-data/training";

export default function AdminTrainingDashboard() {
  const [courses, setCourses] = React.useState<TrainingCourse[]>(mockTrainingCourses);
  const [stats, setStats] = React.useState({
    totalCourses: 5,
    totalCertificatesIssued: 18,
    totalEnrollments: 42,
    averageCompletionRate: 85,
  });
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    fetch("/api/admin/training")
      .then((res) => res.json())
      .then((data) => {
        if (data.courses) setCourses(data.courses);
        if (data.stats) setStats(data.stats);
      })
      .catch((err) => console.error("Admin training fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredCourses = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.badgeTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ── 1. Top Header & Action ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading">
            Tutor Academy & Training Tracks
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Curate professional development courses, certification exams, and monitor tutor qualification rates
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/tutor/training" target="_blank">
            <Button variant="outline" size="default" className="font-bold text-xs" leftIcon={<ExternalLink className="h-4 w-4" />}>
              Preview Tutor View
            </Button>
          </Link>
        </div>
      </div>

      {/* ── 2. Stat Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Tracks</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-950 font-heading">{stats.totalCourses}</div>
          <span className="text-[11px] text-slate-400 block font-medium">5 Core Curriculums Live</span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Certificates Awarded</span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 font-heading">{stats.totalCertificatesIssued}</div>
          <span className="text-[11px] text-slate-400 block font-medium">Official badges active</span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tutors Enrolled</span>
            <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-950 font-heading">{stats.totalEnrollments}</div>
          <span className="text-[11px] text-slate-400 block font-medium">Active learners this month</span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Completion Rate</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 font-heading">{stats.averageCompletionRate}%</div>
          <span className="text-[11px] text-slate-400 block font-medium">Exam passing score: 80%+</span>
        </div>
      </div>

      {/* ── 3. Search & Course List Table ── */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-card overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search training tracks, categories, or badge titles..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span>Showing {filteredCourses.length} of {courses.length} courses</span>
          </div>
        </div>

        {/* Table List */}
        <div className="divide-y divide-slate-100 overflow-x-auto">
          {filteredCourses.map((course, idx) => (
            <div
              key={course.id}
              className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4 min-w-0">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold text-xs shrink-0">
                  {idx + 1}
                </span>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                      {course.title}
                    </h3>
                    <Badge variant="subtle" size="sm" className="bg-slate-100 text-slate-700">
                      {course.category}
                    </Badge>
                    {course.isMandatory && (
                      <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                        Mandatory
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">
                    {course.headline}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                    <span>{course.estimatedMinutes} mins</span>
                    <span>•</span>
                    <span>{course.level}</span>
                    <span>•</span>
                    <span className="text-amber-700 font-bold flex items-center gap-1">
                      <Award className="h-3 w-3" /> Badge: {course.badgeTitle}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <Link href={`/tutor/training/${course.slug}`}>
                  <Button variant="outline" size="sm" className="text-xs font-bold">
                    View Track
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
