"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Video,
  ArrowRight,
  TrendingUp,
  Award,
  BookOpen,
  Heart,
  MessageSquare,
  Search,
  FileText,
  Download,
  Flame,
  Compass,
  Check,
  Sparkles,
  CreditCard,
  Target,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { BookingModal } from "@/components/booking/BookingModal";
import { studentService } from "@/services/studentService";
import { messagingService } from "@/services/messagingService";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";

export default function StudentDashboardPage() {
  const [dashboardData, setDashboardData] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [conversations, setConversations] = React.useState<any[]>([]);
  const [bookingTutor, setBookingTutor] = React.useState<any | null>(null);
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = React.useState<number>(0);

  const loadDashboard = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await studentService.getDashboard360();
      setDashboardData(data);
      const convs = await messagingService.getConversations();
      setConversations(convs);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleBook = (tutor: any) => {
    setBookingTutor(tutor);
    setIsBookingOpen(true);
  };

  const handleQuickProgressBump = async (goalId: string, currentPercent: number) => {
    try {
      const newPercent = Math.min(100, currentPercent + 10);
      await studentService.updateGoalProgress(goalId, newPercent);
      loadDashboard();
    } catch (error) {
      console.error("Failed to update goal progress:", error);
    }
  };

  // Generate 7-day strip from today
  const daysOfWeek = React.useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const isToday = i === 0;
      const hasLesson = i === 0 || i === 2 || i === 4;
      return {
        dateObj: d,
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: d.getDate(),
        month: d.toLocaleDateString("en-US", { month: "short" }),
        isToday,
        hasLesson,
      };
    });
  }, []);

  const student = dashboardData?.student;
  const stats = dashboardData?.stats;
  const nextLesson = dashboardData?.nextLesson;
  const upcomingLessons: any[] = dashboardData?.upcomingLessons || [];
  const recentLessons: any[] = dashboardData?.recentLessons || [];
  const learningGoals: any[] = dashboardData?.learningGoals || [];
  const enrolledTutors: any[] = dashboardData?.enrolledTutors || [];
  const recentMaterials: any[] = dashboardData?.recentMaterials || [];

  const weeklyPacePercent = Math.min(
    100,
    Math.round(((stats?.weeklyPaceHours || 4.5) / (stats?.weeklyStudyHoursTarget || 6)) * 100)
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* ── 1. Header Welcome Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar
            src={student?.avatarUrl}
            fallbackName={student?.displayName || "Alex Rivera"}
            size="lg"
            className="ring-4 ring-slate-100 shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading">
                Good morning, {student?.firstName || "Alex"} 👋
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full shadow-xs">
                <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                {stats?.learningStreakDays || 14}-Day Streak
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Live schedule in <strong className="text-slate-800">{student?.timezone || "America/New_York"}</strong> • Target: <strong className="text-[#14209C]">{student?.targetExam || "IELTS 7.5+ & Advanced Math"}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link href="/find-tutors">
            <Button
              variant="default"
              size="default"
              className="font-extrabold bg-[#14209C] hover:bg-[#0d1870] text-white rounded-xl shadow-sm px-5 text-xs"
              leftIcon={<Search className="h-4 w-4" />}
            >
              Book New Lesson
            </Button>
          </Link>
          <Link href="/student/progress">
            <Button
              variant="outline"
              size="default"
              className="font-bold border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs"
              leftIcon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
            >
              Progress Hub
            </Button>
          </Link>
        </div>
      </div>

      {/* ── 2. NEXT LESSON HERO SPOTLIGHT CARD ── */}
      {nextLesson ? (
        <div className="rounded-3xl border border-[#0B1E8A]/20 bg-gradient-to-br from-[#0B1E8A] via-[#0E24A0] to-[#081566] p-6 sm:p-8 text-white shadow-elevation relative overflow-hidden">
          {/* Subtle background glow effect */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-accent-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3.5 max-w-2xl">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-wider bg-white/15 text-white backdrop-blur-xs px-3 py-1 rounded-full border border-white/20">
                  Next Live Classroom
                </span>
                <span className="text-xs font-bold text-[#F9C31C]">
                  Starts at {formatTime(nextLesson.scheduledStart)}
                </span>
                {nextLesson.homeworkAssigned && (
                  <span className="text-[10px] font-extrabold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                    Homework Assigned
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-heading leading-tight">
                  {nextLesson.curriculumTopic || nextLesson.subjectName} with {nextLesson.tutor?.displayName}
                </h2>
                <p className="text-xs sm:text-sm text-slate-200 mt-1.5 leading-relaxed">
                  {nextLesson.lessonNotes || "1-on-1 intensive practice session in our interactive WebRTC live classroom with collaborative notes and shared worksheets."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <Calendar className="h-4 w-4 text-[#F9C31C]" />
                  <span>{formatDate(nextLesson.scheduledStart)}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5 font-semibold">
                  <Clock className="h-4 w-4 text-[#F9C31C]" />
                  <span>
                    {formatTime(nextLesson.scheduledStart)} – {formatTime(nextLesson.scheduledEnd)} ({nextLesson.durationMinutes} mins)
                  </span>
                </div>
                <span>•</span>
                <span className="text-emerald-300 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  LiveKit Classroom Link Active
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <Link href={`/lessons/${nextLesson.id}/classroom`}>
                <Button
                  variant="default"
                  size="lg"
                  className="w-full font-black bg-[#F9C31C] hover:bg-[#e0ad10] text-slate-950 px-8 py-3.5 rounded-2xl shadow-card"
                  leftIcon={<Video className="h-5 w-5 fill-slate-950 text-slate-950" />}
                >
                  Join Video Classroom
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Link href={`/student/lessons/${nextLesson.id}`} className="flex-1">
                  <button
                    type="button"
                    className="w-full h-10 px-4 inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors border border-white/15"
                  >
                    Lesson 360 Workspace
                  </button>
                </Link>
                <Link href={`/student/messages`}>
                  <button
                    type="button"
                    title="Message Tutor"
                    className="h-10 w-10 inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/15"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">No scheduled sessions for today</h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Keep your learning streak active by booking your next 1-on-1 lesson with top verified instructors.
            </p>
          </div>
          <Link href="/find-tutors">
            <Button variant="default" className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white">
              Schedule a Lesson
            </Button>
          </Link>
        </div>
      )}

      {/* ── 3. METRIC KPI CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Hours Learned */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-slate-300 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Learning Time
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-[#14209C]">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
              {stats?.totalHoursLearned || 50.1} <span className="text-sm font-semibold text-slate-500">hrs</span>
            </div>
            <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" /> +12% vs last month
            </p>
          </div>
        </div>

        {/* Lessons Completed */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-slate-300 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Lessons Completed
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
              {stats?.completedLessons || 34} <span className="text-sm font-semibold text-slate-500">sessions</span>
            </div>
            <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> All reviews confirmed
            </p>
          </div>
        </div>

        {/* Learning Streak */}
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/70 to-orange-50/40 p-5 shadow-xs hover:border-amber-300 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Learning Streak
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400 text-slate-950 font-bold shadow-xs">
              <Flame className="h-4 w-4 fill-slate-950" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-950 font-heading">
              {stats?.learningStreakDays || 14} <span className="text-sm font-semibold text-slate-700">Days</span>
            </div>
            <p className="text-[11px] font-semibold text-amber-800 mt-1">
              🔥 Top 5% consistency this week
            </p>
          </div>
        </div>

        {/* Weekly Pace */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-slate-300 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Weekly Study Pace
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-[#14209C]">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
              {stats?.weeklyPaceHours || 4.5} <span className="text-sm font-semibold text-slate-500">/ {stats?.weeklyStudyHoursTarget || 6} hrs</span>
            </div>
            <p className="text-[11px] font-semibold text-[#14209C] mt-1">
              {weeklyPacePercent}% of weekly goal achieved
            </p>
          </div>
        </div>
      </div>

      {/* ── 4. Weekly Interactive Calendar Strip ── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 font-heading">
              <Calendar className="h-4 w-4 text-emerald-600" />
              Weekly Timetable & Schedule Strip
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Current study week overview with fast session jumping.
            </p>
          </div>

          <Link
            href="/student/calendar"
            className="text-xs font-bold text-[#14209C] hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            Full Timetable Studio <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {daysOfWeek.map((day, idx) => {
            const isSelected = selectedDayIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedDayIndex(idx)}
                className={`flex flex-col items-center justify-center p-2.5 sm:p-3.5 rounded-2xl border transition-all text-center cursor-pointer ${
                  isSelected
                    ? "border-[#14209C] bg-[#14209C] text-white shadow-xs"
                    : day.isToday
                    ? "border-indigo-200 bg-indigo-50/50 text-slate-900 font-bold"
                    : "border-slate-100 bg-slate-50/60 hover:bg-slate-100 text-slate-700"
                }`}
              >
                <span className={`text-[10px] uppercase font-bold ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                  {day.dayName}
                </span>
                <span className={`text-base sm:text-lg font-black my-0.5 ${isSelected ? "text-white" : "text-slate-900"}`}>
                  {day.dayNum}
                </span>
                {day.hasLesson && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full mt-1 ${
                      isSelected ? "bg-[#F9C31C]" : "bg-emerald-500"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 5. MAIN 2-COLUMN DASHBOARD GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* ═══════════════════════════════════════════════════════════
            LEFT 2 COLS: Upcoming Lessons, Goals & Materials Hub
        ═══════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Lessons Queue */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 font-heading">
                  <BookOpen className="h-4 w-4 text-[#14209C]" />
                  Upcoming Confirmed Lessons
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct access to your scheduled 1-on-1 classes
                </p>
              </div>
              <Link href="/student/lessons" className="text-xs font-bold text-[#14209C] hover:underline">
                View all ({upcomingLessons.length}) →
              </Link>
            </div>

            {upcomingLessons.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No upcoming lessons scheduled.</p>
            ) : (
              <div className="space-y-3.5">
                {upcomingLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 hover:border-slate-300 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                  >
                    <div className="flex items-start gap-3.5">
                      <Avatar
                        src={lesson.tutor?.avatarUrl}
                        fallbackName={lesson.tutor?.displayName || "Instructor"}
                        size="md"
                        statusIndicator="online"
                        superTutor={lesson.tutor?.isSuperTutor}
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-sm font-bold text-slate-900">
                            {lesson.curriculumTopic || lesson.subjectName}
                          </strong>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs font-semibold text-slate-700">
                            {lesson.tutor?.displayName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                          <span>{formatDate(lesson.scheduledStart)}</span>
                          <span>•</span>
                          <strong className="text-slate-800">
                            {formatTime(lesson.scheduledStart)} – {formatTime(lesson.scheduledEnd)}
                          </strong>
                          <span className="text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded-md font-bold text-slate-600">
                            {lesson.durationMinutes} mins
                          </span>
                          {lesson.homeworkAssigned && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              Homework Due
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Link href={`/lessons/${lesson.id}/classroom`}>
                        <Button
                          variant="default"
                          size="sm"
                          className="font-bold text-xs bg-[#14209C] hover:bg-[#0d1870] text-white rounded-xl shadow-xs"
                          leftIcon={<Video className="h-3.5 w-3.5" />}
                        >
                          Enter Room
                        </Button>
                      </Link>
                      <Link href={`/student/lessons/${lesson.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl"
                        >
                          360 Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Learning Goals with Quick Progress Bumping */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 font-heading">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  Active Learning Goals & Milestones ({learningGoals.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mastery progression towards your target exams
                </p>
              </div>
              <Link href="/student/progress" className="text-xs font-bold text-[#14209C] hover:underline">
                Manage all goals →
              </Link>
            </div>

            <div className="space-y-4">
              {learningGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="p-4 rounded-2xl bg-slate-50/50 border border-slate-200/80 space-y-2.5 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 font-bold text-sm">
                        {goal.title}
                      </strong>
                      <Badge variant="subtle" size="sm" className="bg-white text-slate-700 border-slate-200 font-bold">
                        {goal.subjectName || "General"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-[#14209C] text-sm">
                        {goal.progressPercent}%
                      </span>
                      {goal.progressPercent < 100 && (
                        <button
                          onClick={() => handleQuickProgressBump(goal.id, goal.progressPercent)}
                          className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-[#14209C] transition cursor-pointer"
                          title="Add 10% progress"
                        >
                          +10%
                        </button>
                      )}
                    </div>
                  </div>

                  {goal.description && (
                    <p className="text-xs text-slate-500">
                      {goal.description}
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div className="h-2 w-full rounded-full bg-slate-200/80 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        goal.progressPercent >= 100 ? "bg-emerald-600" : "bg-[#14209C]"
                      }`}
                      style={{ width: `${goal.progressPercent}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-400 pt-0.5">
                    <span>Target Date: {goal.targetDate || "Dec 2026"}</span>
                    <span className="font-semibold text-emerald-700">
                      {goal.progressPercent >= 100 ? "✓ Completed Milestone" : "In Progress"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Lesson Materials & Study PDF Resources */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 font-heading">
                  <FileText className="h-4 w-4 text-[#14209C]" />
                  Recent Lesson Materials & Worksheets
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Worksheets and annotated notes uploaded by your tutors
                </p>
              </div>
            </div>

            {recentMaterials.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No uploaded worksheets yet.</p>
            ) : (
              <div className="space-y-3">
                {recentMaterials.slice(0, 4).map((mat) => (
                  <div
                    key={mat.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-slate-300 transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-[#14209C] shrink-0 border border-indigo-100">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {mat.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {mat.subjectName} • with {mat.tutorName}
                        </p>
                      </div>
                    </div>

                    <a
                      href={mat.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs shrink-0"
                    >
                      <Download className="h-3.5 w-3.5 text-[#14209C]" />
                      Download
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            RIGHT 1 COL: Enrolled Tutors, Messages & Fast Booking
        ═══════════════════════════════════════════════════════════ */}
        <div className="space-y-8">
          {/* Enrolled & Regular Tutors */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 font-heading">
                <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
                My Instructors ({enrolledTutors.length})
              </h3>
              <Link href="/find-tutors" className="text-xs font-bold text-[#14209C] hover:underline">
                Explore tutors →
              </Link>
            </div>

            <div className="space-y-3">
              {enrolledTutors.map((tut) => (
                <div
                  key={tut.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/40 transition-all shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      src={tut.avatarUrl}
                      fallbackName={tut.displayName || "Instructor"}
                      size="sm"
                      statusIndicator="online"
                      superTutor={tut.isSuperTutor}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {tut.displayName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {formatCurrency(tut.hourlyRate, tut.currency)}/hr • {tut.totalLessonsTogether} sessions together
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-extrabold text-slate-900 border-slate-200 hover:bg-slate-100 rounded-xl px-3"
                    onClick={() => handleBook(tut)}
                  >
                    Book
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Messages Snippet */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 font-heading">
                <MessageSquare className="h-4 w-4 text-[#14209C]" />
                Recent Messages
              </h3>
              <Link href="/student/messages" className="text-xs font-bold text-[#14209C] hover:underline">
                Open inbox →
              </Link>
            </div>

            <div className="space-y-2">
              {conversations.slice(0, 3).map((conv) => {
                const otherUser = conv.tutor || conv.participants?.[1];
                return (
                  <Link
                    key={conv.id}
                    href={`/student/messages?conv=${conv.id}`}
                    className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                  >
                    <Avatar
                      src={otherUser?.avatarUrl}
                      fallbackName={otherUser?.displayName || "Tutor"}
                      size="sm"
                      statusIndicator="online"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {otherUser?.displayName}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span className="h-2 w-2 rounded-full bg-[#14209C] shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {conv.lastMessageText || conv.lastMessage?.content || "Click to open conversation..."}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Quick Hub Shortcut Banner */}
          <div className="rounded-3xl p-6 bg-gradient-to-br from-indigo-950 via-slate-900 to-[#14209C] text-white shadow-card space-y-3">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#F9C31C]" />
              <span>Learning Roadmap</span>
            </div>
            <h4 className="text-sm font-black font-heading leading-snug">
              Prepare for your IELTS 7.5+ and ML milestones
            </h4>
            <p className="text-xs text-indigo-200 leading-relaxed">
              Review homework worksheets, track study targets, and synchronize your calendar feed.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <Link href="/student/progress">
                <Button size="sm" variant="default" className="font-bold bg-[#F9C31C] text-slate-950 hover:bg-[#e0ad10] text-xs">
                  View Roadmap
                </Button>
              </Link>
              <Link href="/student/payments">
                <Button size="sm" variant="outline" className="font-bold bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs">
                  Receipts
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        tutor={bookingTutor}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </div>
  );
}
