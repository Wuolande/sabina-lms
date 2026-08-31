"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Video,
  DollarSign,
  Users,
  Star,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  FileText,
  RefreshCw,
  MessageSquare,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Award,
  Layers,
  Check,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { StatCard } from "@/components/ui/StatCard";
import { tutorService } from "@/services/tutorService";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";

export default function TutorDashboardPage() {
  const [dashboardData, setDashboardData] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeQueueTab, setActiveQueueTab] = React.useState("all");

  const fetchDashboardData = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await tutorService.getDashboardData();
      setDashboardData(data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const stats = dashboardData?.stats || {};
  const user = dashboardData?.user || {};
  const upcomingLessons = dashboardData?.upcomingLessons || [];
  const recentReviews = dashboardData?.recentReviews || [];

  const nextLesson = upcomingLessons[0] || null;

  const displayName = user.displayName || "Tutor";
  const headline = dashboardData?.headline || "Verified Educator";
  const slug = dashboardData?.slug || "";

  // Filter lessons
  const filteredLessons = React.useMemo(() => {
    if (activeQueueTab === "today") {
      return upcomingLessons.slice(0, 2);
    }
    return upcomingLessons;
  }, [upcomingLessons, activeQueueTab]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. HERO GREETING & COMMAND BAR */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Avatar
              src={user.avatarUrl}
              fallbackName={displayName}
              size="xl"
              statusIndicator="online"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Welcome back, {displayName} 👋
                </h1>
                <Badge variant="success" size="sm" className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified Tutor
                </Badge>
                {stats.isSuperTutor && (
                  <Badge variant="neutral" size="sm" className="gap-1 bg-indigo-50 text-[#14209C] border-indigo-200">
                    <Sparkles className="h-3.5 w-3.5" />
                    Top 1% Super Tutor
                  </Badge>
                )}
              </div>

              <p className="text-xs text-slate-500 line-clamp-1 max-w-2xl">
                {headline}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs pt-1 text-slate-500">
                <span className="font-bold text-slate-900">${stats.hourlyRate || 50}/hr</span>
                <span>•</span>
                <span>Response time: &lt; {stats.responseTimeMinutes || 15} mins</span>
                <span>•</span>
                <span>Attendance: {stats.attendanceRate || 100}%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
            <Link href={`/tutors/${slug}`} target="_blank">
              <Button variant="outline" size="sm" className="font-bold text-xs flex items-center gap-1.5">
                <span>View Public Profile</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </Button>
            </Link>

            <Link href="/tutor/availability">
              <Button variant="outline" size="sm" className="font-bold text-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Working Hours</span>
              </Button>
            </Link>

            <Link href="/tutor/calendar">
              <Button variant="default" size="sm" className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Open Calendar</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. NEXT IMMEDIATE LESSON HERO CARD */}
      {nextLesson ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-3.5 z-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
              <Badge variant="secondary" size="sm" className="font-extrabold bg-amber-400 text-slate-950">
                NEXT 1-ON-1 SESSION
              </Badge>
              <span className="text-xs text-slate-300 font-mono">
                Ref: {nextLesson.bookingRef}
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                <span>{nextLesson.subjectName} with {nextLesson.studentName}</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                Topic Focus: {nextLesson.curriculumTopic || nextLesson.lessonNotes || "Scheduled 50-minute teaching session."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-amber-400" />
                <span>{formatDate(nextLesson.scheduledStart)}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-amber-400" />
                <span>{formatTime(nextLesson.scheduledStart)} – {formatTime(nextLesson.scheduledEnd)} ({nextLesson.durationMinutes} min)</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Check className="h-4 w-4" />
                <span>Confirmed & Ready</span>
              </div>
            </div>
          </div>

          <div className="z-10 flex flex-col sm:flex-row gap-3 shrink-0">
            <Link href={`/lessons/${nextLesson.id}/classroom`}>
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto font-black bg-amber-400 hover:bg-amber-500 text-slate-950 px-8 flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:scale-102 transition-transform"
              >
                <Video className="h-5 w-5" />
                <span>Enter Live Classroom</span>
              </Button>
            </Link>

            <Link href={`/tutor/lessons/${nextLesson.id}`}>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto font-bold border-slate-700 text-slate-200 hover:bg-slate-800 text-xs flex items-center justify-center gap-1.5"
              >
                <FileText className="h-4 w-4" />
                <span>Lesson 360 Workspace</span>
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center space-y-2">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-1" />
          <h3 className="text-sm font-bold text-slate-800">No immediate upcoming classes today</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Your schedule is clear. Check your available hours to make sure students can book lessons with you.
          </p>
        </div>
      )}

      {/* 3. EXECUTIVE KPI COMMAND STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Estimated Monthly Earnings"
          value={formatCurrency(stats.monthlyEarnings ?? 0)}
          icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
          trend={{ value: 18, isPositive: true, label: "vs last month" }}
        />
        <StatCard
          title="Total Lessons Taught"
          value={stats.completedLessons ?? 0}
          icon={<BookOpen className="h-5 w-5 text-[#14209C]" />}
          description="Lifetime sessions completed"
        />
        <StatCard
          title="Active Students"
          value={stats.activeStudents ?? 0}
          icon={<Users className="h-5 w-5 text-indigo-600" />}
          description="Enrolled learners"
        />
        <StatCard
          title="Reputation Score"
          value={`${stats.averageRating ?? 5.0} ★`}
          icon={<Star className="h-5 w-5 text-amber-500 fill-amber-400" />}
          description={`${stats.reviewCount ?? 0} verified reviews`}
        />
      </div>

      {/* 4. MAIN CONTENT: TEACHING QUEUE & REVIEWS (2 COLS) + LAUNCHPAD & METRICS (1 COL) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Lessons Queue */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#14209C]" />
                  <span>Upcoming Teaching Queue ({upcomingLessons.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confirmed 1-on-1 student lessons and classroom access.
                </p>
              </div>

              <Link href="/tutor/lessons" className="text-xs font-bold text-[#14209C] hover:underline flex items-center gap-1">
                <span>View Full Lesson Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {upcomingLessons.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                No scheduled lessons at the moment.
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredLessons.map((lesson: any) => (
                  <div
                    key={lesson.id}
                    className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar
                        src={lesson.studentAvatar}
                        fallbackName={lesson.studentName}
                        size="lg"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900">{lesson.studentName}</h4>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs font-semibold text-[#14209C]">{lesson.subjectName}</span>
                          <Badge variant="neutral" size="xs" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            Confirmed
                          </Badge>
                        </div>

                        <p className="text-xs text-slate-500">
                          {formatDate(lesson.scheduledStart)} at <strong>{formatTime(lesson.scheduledStart)}</strong> ({lesson.durationMinutes || 50} min)
                        </p>

                        {lesson.curriculumTopic && (
                          <p className="text-[11px] text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg w-fit mt-1">
                            🎯 Topic: {lesson.curriculumTopic}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Link href={`/lessons/${lesson.id}/classroom`}>
                        <Button
                          variant="default"
                          size="sm"
                          className="font-bold text-xs bg-[#14209C] hover:bg-[#0d1870] text-white flex items-center gap-1.5"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Live</span>
                        </Button>
                      </Link>

                      <Link href={`/tutor/lessons/${lesson.id}`}>
                        <Button variant="outline" size="sm" className="font-bold text-xs">
                          Workspace
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Student Reviews Stream */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
                  <span>Student Reviews & Feedback ({recentReviews.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verified reviews left by your students after completed lessons.
                </p>
              </div>

              <Link href="/tutor/reviews" className="text-xs font-bold text-[#14209C] hover:underline flex items-center gap-1">
                <span>Reviews Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentReviews.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No reviews yet.</div>
            ) : (
              <div className="space-y-4">
                {recentReviews.map((rev: any) => (
                  <div
                    key={rev.id}
                    className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={rev.studentAvatar}
                          fallbackName={rev.studentName}
                          size="sm"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{rev.studentName}</h4>
                          <span className="text-[10px] text-slate-400 font-medium">{rev.subjectName}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold bg-white border border-slate-200 px-2 py-0.5 rounded-lg">
                        <span>{rev.rating}★</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed italic">
                      “{rev.comment}”
                    </p>

                    {rev.tutorReply && (
                      <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs space-y-1">
                        <span className="text-[10px] font-bold text-[#14209C] uppercase tracking-wider block">
                          Your Public Reply:
                        </span>
                        <p className="text-slate-700 text-xs">{rev.tutorReply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Launchpad & Quick Tools */}
        <div className="space-y-6">
          {/* Quick Module Launchpad */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#14209C]" />
              <span>Instructor Suite</span>
            </h4>

            <div className="space-y-1.5 text-xs font-semibold">
              <Link
                href="/tutor/calendar"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100/80 text-slate-800 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-[#14209C]" />
                  <span>Timetable & Calendar</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                href="/tutor/availability"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100/80 text-slate-800 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Available Working Hours</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                href="/tutor/lessons"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100/80 text-slate-800 transition"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Lessons & Homework</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                href="/tutor/students"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100/80 text-slate-800 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-violet-600" />
                  <span>My Enrolled Students</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                href="/tutor/reviews"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100/80 text-slate-800 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span>Reputation & Reviews</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                href="/tutor/profile"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100/80 text-slate-800 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-rose-600" />
                  <span>Public Profile Studio</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                href="/tutor/settings"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100/80 text-slate-800 transition"
              >
                <div className="flex items-center gap-2.5">
                  <DollarSign className="w-4 h-4 text-teal-600" />
                  <span>Settings & Rates</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* SuperTutor Accreditation Card */}
          <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50/80 to-yellow-50/50 p-6 space-y-3.5 shadow-xs">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span>SuperTutor Elite Status</span>
            </div>
            <p className="text-xs text-amber-800/90 leading-relaxed">
              Your profile ranks in the top 1% of instructors on Sabina LMS due to a 100% attendance rate and 5.0 average student score.
            </p>
            <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between text-xs text-amber-900 font-semibold">
              <span>Platform Rank:</span>
              <span className="font-bold text-amber-950">#1 Top Rated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
