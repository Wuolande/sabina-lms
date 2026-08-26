"use client";

import * as React from "react";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  Clock,
  Video,
  FileText,
  CheckCircle2,
  XCircle,
  Search,
  Star,
  RefreshCw,
  Sparkles,
  MessageSquare,
  ArrowRight,
  Download,
  AlertCircle,
  Check,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Tabs } from "@/components/ui/Tabs";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { lessonService } from "@/services/lessonService";
import { formatDate, formatTime } from "@/lib/utils";

export default function StudentLessonsPage() {
  const [activeTab, setActiveTab] = React.useState("upcoming");
  const [lessons, setLessons] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  const fetchLessons = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await lessonService.getStudentLessons();
      setLessons(data);
    } catch {
      setLessons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const upcoming = lessons.filter((l) => l.status === "SCHEDULED" || l.status === "CONFIRMED" || l.status === "IN_PROGRESS" || l.status === "LIVE");
  const completed = lessons.filter((l) => l.status === "COMPLETED");
  const cancelled = lessons.filter((l) => l.status === "CANCELLED");
  const homeworkPending = lessons.filter((l) => l.homeworkAssigned && !l.studentHomeworkSubmittedAt);

  const currentList =
    activeTab === "upcoming"
      ? upcoming
      : activeTab === "completed"
      ? completed
      : activeTab === "homework"
      ? homeworkPending
      : cancelled;

  const filtered = currentList.filter(
    (l) =>
      (l.subjectName || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.tutorName || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.curriculumTopic || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              My Lessons & Classrooms
            </h1>
            <Badge variant="neutral" size="sm" className="bg-indigo-50 text-[#14209C] border-indigo-200">
              Student Workspace
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access live WebRTC classrooms, download tutor worksheets, track homework, and leave session reviews.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLessons}
            className="text-xs flex items-center gap-1 font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Link href="/find-tutors">
            <Button variant="default" size="sm" className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs">
              Book Another Lesson
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Scheduled Classes"
          value={upcoming.length}
          icon={<Calendar className="h-5 w-5 text-[#14209C]" />}
          description="Upcoming 1-on-1 sessions"
        />
        <StatCard
          title="Completed Lessons"
          value={completed.length}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          description="Lifetime sessions finished"
        />
        <StatCard
          title="Homework Assigned"
          value={homeworkPending.length}
          icon={<FileText className="h-5 w-5 text-amber-500" />}
          description="Pending submissions"
        />
        <StatCard
          title="Reviews Submitted"
          value={completed.filter((l) => l.hasReview).length}
          icon={<Star className="h-5 w-5 text-amber-400 fill-amber-400" />}
          description="Tutor feedback ratings"
        />
      </div>

      {/* 3. Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <Tabs
          tabs={[
            { id: "upcoming", label: "Upcoming", count: upcoming.length },
            { id: "completed", label: "Completed", count: completed.length },
            { id: "homework", label: "Homework Pending", count: homeworkPending.length },
            { id: "cancelled", label: "Cancelled", count: cancelled.length },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="line"
        />

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search tutor, subject, or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pl-9 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>

      {/* 4. Lessons Stream */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-3xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title={`No ${activeTab} lessons found`}
          description={
            activeTab === "upcoming"
              ? "You do not have any scheduled lessons right now. Discover verified educators on the marketplace."
              : activeTab === "homework"
              ? "You have completed all assigned homework tasks!"
              : "No lessons in this category."
          }
          actionLabel={activeTab === "upcoming" ? "Find a Tutor" : undefined}
          actionHref={activeTab === "upcoming" ? "/find-tutors" : undefined}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((lesson) => {
            const isLiveOrScheduled = lesson.status === "SCHEDULED" || lesson.status === "CONFIRMED" || lesson.status === "IN_PROGRESS" || lesson.status === "LIVE";
            const isCompleted = lesson.status === "COMPLETED";

            return (
              <div
                key={lesson.id}
                className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <Avatar
                    src={lesson.tutorAvatar}
                    fallbackName={lesson.tutorName}
                    size="lg"
                  />

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 truncate">
                        {lesson.subjectName}
                      </h3>
                      <Badge
                        variant={
                          isLiveOrScheduled
                            ? "default"
                            : isCompleted
                            ? "success"
                            : "destructive"
                        }
                        size="xs"
                        className="font-bold"
                      >
                        {lesson.status}
                      </Badge>
                      <span className="text-xs text-slate-400 font-mono">Ref: {lesson.bookingRef}</span>
                    </div>

                    <p className="text-xs text-slate-600">
                      Instructor: <strong className="text-slate-900">{lesson.tutorName}</strong>
                      {lesson.tutorHeadline && (
                        <span className="text-slate-400 text-[11px] block line-clamp-1 mt-0.5">
                          {lesson.tutorHeadline}
                        </span>
                      )}
                    </p>

                    {/* Schedule & Duration */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                      <span className="flex items-center gap-1 font-bold text-slate-800">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {formatDate(lesson.scheduledStart)} at {formatTime(lesson.scheduledStart)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {lesson.durationMinutes || 50} mins
                      </span>
                    </div>

                    {/* Topic & Homework Pill Strip */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {lesson.curriculumTopic && (
                        <span className="text-[11px] font-semibold bg-indigo-50 text-[#14209C] border border-indigo-100 px-2.5 py-0.5 rounded-full">
                          🎯 Topic: {lesson.curriculumTopic}
                        </span>
                      )}

                      {lesson.homeworkAssigned && (
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          lesson.studentHomeworkSubmittedAt
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-amber-50 text-amber-900 border-amber-200"
                        }`}>
                          📝 Homework: {lesson.homeworkAssigned} {lesson.homeworkDueDate && `(Due ${formatDate(lesson.homeworkDueDate)})`}
                        </span>
                      )}

                      {lesson.materialsCount > 0 && (
                        <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                          📁 {lesson.materialsCount} worksheet{lesson.materialsCount > 1 ? "s" : ""}
                        </span>
                      )}

                      {lesson.hasReview && (
                        <span className="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{lesson.reviewRating}★ Reviewed</span>
                          {lesson.tutorHasReplied && <span className="text-[#14209C] ml-1">· 💬 Tutor Replied</span>}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                  {isLiveOrScheduled && (
                    <Link href={`/lessons/${lesson.id}/classroom`}>
                      <Button
                        variant="default"
                        size="sm"
                        className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <Video className="h-4 w-4" />
                        <span>Launch Video Room</span>
                      </Button>
                    </Link>
                  )}

                  <Link href={`/student/lessons/${lesson.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs font-bold border-slate-200 hover:bg-slate-50 flex items-center gap-1.5"
                    >
                      <FileText className="h-3.5 w-3.5 text-slate-500" />
                      <span>Workspace & Files</span>
                    </Button>
                  </Link>

                  <Link href="/student/messages">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs p-2 text-slate-500 hover:text-slate-800"
                      title="Message Tutor"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
