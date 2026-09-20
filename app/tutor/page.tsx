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
  Target,
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
  const [activeQueueTab, setActiveQueueTab] = React.useState<"all" | "today">("all");

  const fetchDashboardData = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await tutorService.getDashboardData();
      setDashboardData(data);
    } catch (err) {
      console.error("[TutorDashboardPage] Failed to fetch data:", err);
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
  const headline = dashboardData?.headline || "Verified Educator & Academic Coach";
  const slug = dashboardData?.slug || "";

  // Filter lessons for today
  const todayLessons = React.useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return upcomingLessons.filter((l: any) => {
      if (!l.scheduledStart) return false;
      return new Date(l.scheduledStart).toISOString().slice(0, 10) === todayStr;
    });
  }, [upcomingLessons]);

  const filteredLessons = activeQueueTab === "today" ? todayLessons : upcomingLessons;

  if (loading) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-pulse">
        {/* Skeleton Greeting */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 rounded-full bg-slate-200 shrink-0" />
              <div className="space-y-2">
                <div className="h-6 bg-slate-200 rounded w-48" />
                <div className="h-4 bg-slate-200 rounded w-72" />
                <div className="h-3 bg-slate-200 rounded w-36" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-28 bg-slate-200 rounded-xl" />
              <div className="h-9 w-28 bg-slate-200 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Skeleton Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-white border border-slate-200 p-5 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-24" />
              <div className="h-7 bg-slate-200 rounded w-32" />
              <div className="h-3 bg-slate-200 rounded w-20" />
            </div>
          ))}
        </div>

        {/* Skeleton Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 rounded-3xl bg-white border border-slate-200 p-6" />
            <div className="h-48 rounded-3xl bg-white border border-slate-200 p-6" />
          </div>
          <div className="space-y-6">
            <div className="h-64 rounded-3xl bg-white border border-slate-200 p-6" />
            <div className="h-48 rounded-3xl bg-white border border-slate-200 p-6" />
          </div>
        </div>
      </div>
    );
  }

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
                <Badge variant="success" size="sm" className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified Tutor
                </Badge>
                {stats.isSuperTutor && (
                  <Badge variant="neutral" size="sm" className="gap-1 bg-amber-50 text-amber-800 border-amber-200 font-bold">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    Top 1% Super Tutor
                  </Badge>
                )}
              </div>

              <p className="text-xs text-slate-500 line-clamp-1 max-w-2xl">
                {headline}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs pt-1 text-slate-500">
                <span className="font-bold text-slate-900">${stats.hourlyRate || 35}/hr</span>
                <span>•</span>
                <span>Response time: &lt; {stats.responseTimeMinutes || 15} mins</span>
                <span>•</span>
                <span>Attendance: {stats.attendanceRate || 100}%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboardData}
              title="Refresh dashboard data"
              className="text-xs font-bold flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Refresh</span>
            </Button>

            {slug && (
              <Link href={`/tutors/${slug}`} target="_blank">
                <Button variant="outline" size="sm" className="font-bold text-xs flex items-center gap-1.5">
                  <span>Public Profile</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </Button>
              </Link>
            )}

            <Link href="/tutor/availability">
              <Button variant="outline" size="sm" className="font-bold text-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Working Hours</span>
              </Button>
            </Link>

            <Link href="/tutor/calendar">
              <Button variant="default" size="sm" className="font-bold bg-brand hover:brightness-90 text-white text-xs flex items-center gap-1.5 shadow-xs">
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
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 blur-[100px] pointer-events-none -z-0" />

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
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center space-y-4 shadow-sm">
          <div className="h-12 w-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No immediate upcoming classes today</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Your schedule is clear. Make sure your weekly availability is configured so students can book lessons with you.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-1">
            <Link href="/tutor/availability">
              <Button variant="default" size="sm" className="font-bold text-xs bg-brand hover:brightness-90 text-white gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Set Working Hours</span>
              </Button>
            </Link>
            <Link href="/tutor/calendar">
              <Button variant="outline" size="sm" className="font-bold text-xs">
                <span>View Full Timetable</span>
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* 3. EXECUTIVE KPI COMMAND STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Net Earnings"
          value={formatCurrency(stats.monthlyEarnings ?? 0)}
          icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
          description={
            stats.monthlyEarnings > 0
              ? "Net payout accrued this month"
              : "No earnings recorded this month"
          }
        />
        <StatCard
          title="Total Lessons Taught"
          value={stats.completedLessons ?? 0}
          icon={<BookOpen className="h-5 w-5 text-brand" />}
          description="Lifetime sessions completed"
        />
        <StatCard
          title="Active Students"
          value={stats.activeStudents ?? 0}
          icon={<Users className="h-5 w-5 text-brand" />}
          description="Enrolled learners"
        />
        <StatCard
          title="Reputation Score"
          value={`${stats.averageRating ?? 5.0} ★`}
          icon={<Star className="h-5 w-5 text-amber-500 fill-amber-400" />}
          description={
            stats.reviewCount > 0
              ? `${stats.reviewCount} verified student review${stats.reviewCount === 1 ? "" : "s"}`
              : "No reviews yet (New Tutor)"
          }
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
                  <Calendar className="h-4 w-4 text-brand" />
                  <span>Upcoming Teaching Queue ({upcomingLessons.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confirmed 1-on-1 student lessons and direct classroom access.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveQueueTab("all")}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      activeQueueTab === "all"
                        ? "bg-white text-slate-900 shadow-xs font-bold"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    All ({upcomingLessons.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveQueueTab("today")}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      activeQueueTab === "today"
                        ? "bg-white text-slate-900 shadow-xs font-bold"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Today ({todayLessons.length})
                  </button>
                </div>

                <Link href="/tutor/lessons" className="text-xs font-bold text-brand hover:underline flex items-center gap-1 ml-2">
                  <span>Lesson Hub</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {filteredLessons.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Calendar className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">
                  {activeQueueTab === "today" ? "No lessons scheduled for today." : "No scheduled lessons at the moment."}
                </p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  New student bookings will appear here as soon as they are confirmed.
                </p>
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
                          <span className="text-xs font-semibold text-brand">{lesson.subjectName}</span>
                          <Badge variant="neutral" size="xs" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">
                            Confirmed
                          </Badge>
                        </div>

                        <p className="text-xs text-slate-500">
                          {formatDate(lesson.scheduledStart)} at <strong>{formatTime(lesson.scheduledStart)}</strong> ({lesson.durationMinutes || 50} min)
                        </p>

                        {lesson.curriculumTopic && (
                          <p className="text-[11px] text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg w-fit mt-1 font-medium">
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
                          className="font-bold text-xs bg-brand hover:brightness-90 text-white flex items-center gap-1.5 shadow-xs"
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

              <Link href="/tutor/reviews" className="text-xs font-bold text-brand hover:underline flex items-center gap-1">
                <span>Reviews Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentReviews.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <Star className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No student reviews yet.</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Student ratings and comments will appear here automatically after completed sessions.
                </p>
              </div>
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

                      <div className="flex items-center gap-1 text-amber-600 text-xs font-bold bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg shadow-2xs">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        <span>{rev.rating}.0</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed italic">
                      &ldquo;{rev.comment}&rdquo;
                    </p>

                    {rev.tutorReply && (
                      <div className="p-3.5 rounded-xl bg-brand-50/70 border border-brand-100 text-xs space-y-1">
                        <span className="text-[10px] font-bold text-brand uppercase tracking-wider block">
                          Your Public Reply:
                        </span>
                        <p className="text-slate-700 text-xs leading-relaxed">{rev.tutorReply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Launchpad & Metrics */}
        <div className="space-y-6">
          {/* Quick Module Launchpad */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand" />
              <span>Instructor Suite</span>
            </h4>

            <div className="space-y-1.5 text-xs font-semibold">
              <Link
                href="/tutor/calendar"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100/80 text-slate-800 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-brand" />
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
                  <BookOpen className="w-4 h-4 text-brand" />
                  <span>Lessons & Workspace</span>
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
                href="/tutor/earnings"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100/80 text-slate-800 transition"
              >
                <div className="flex items-center gap-2.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Earnings & Payouts</span>
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

          {/* SuperTutor Accreditation or Growth Roadmap Card */}
          {stats.isSuperTutor ? (
            <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50/80 to-yellow-50/50 p-6 space-y-3.5 shadow-xs">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span>SuperTutor Elite Status</span>
              </div>
              <p className="text-xs text-amber-800/90 leading-relaxed">
                Your profile ranks in the top tier of instructors on Sabina LMS with a verified {stats.attendanceRate}% attendance record and {stats.averageRating} average student rating.
              </p>
              <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between text-xs text-amber-900 font-semibold">
                <span>Marketplace Rank:</span>
                <span className="font-bold text-amber-950">Top Recommended</span>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-3.5 shadow-xs">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                <Target className="w-4 h-4 text-brand" />
                <span>SuperTutor Accreditation Path</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Unlock top marketplace ranking, featured badge, and priority student search by meeting accreditation targets:
              </p>
              <div className="space-y-2 pt-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Student Rating (≥ 4.8★):</span>
                  <span className="font-bold text-slate-900">{stats.averageRating ?? 5.0} ★</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Completed Lessons (≥ 20):</span>
                  <span className="font-bold text-slate-900">{stats.completedLessons ?? 0} / 20</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Attendance Rate (≥ 95%):</span>
                  <span className="font-bold text-slate-900">{stats.attendanceRate ?? 100}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
