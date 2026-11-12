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
  User,
  RefreshCw,
  Search,
  Hourglass,
  Layers,
  Award,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Tabs } from "@/components/ui/Tabs";
import { StatCard } from "@/components/ui/StatCard";
import { lessonService } from "@/services/lessonService";
import { LessonListItem } from "@/src/modules/lessons/domain/types";
import { formatDate, formatTime } from "@/lib/utils";

export default function TutorLessonsPage() {
  const [activeTab, setActiveTab] = React.useState("ALL");
  const [lessons, setLessons] = React.useState<LessonListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  const fetchLessons = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await lessonService.getTutorLessons();
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

  const upcomingCount = lessons.filter((l) => l.status === "SCHEDULED" || l.status === "LIVE").length;
  const completedCount = lessons.filter((l) => l.status === "COMPLETED").length;
  const cancelledCount = lessons.filter((l) => l.status === "CANCELLED").length;
  const totalWorksheets = lessons.reduce((acc, l) => acc + (l.materialsCount || 0), 0);

  const filtered = lessons.filter((l) => {
    if (activeTab === "UPCOMING" && l.status !== "SCHEDULED" && l.status !== "LIVE") return false;
    if (activeTab === "COMPLETED" && l.status !== "COMPLETED") return false;
    if (activeTab === "CANCELLED" && l.status !== "CANCELLED") return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      l.studentName.toLowerCase().includes(q) ||
      l.subjectName.toLowerCase().includes(q) ||
      (l.bookingRef && l.bookingRef.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Teaching Lessons & Materials Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track student milestones, attach worksheets & homework, and review feedback records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLessons}
            className="text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Link href="/tutor/calendar">
            <Button
              variant="default"
              size="sm"
              className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Timetable Calendar</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Upcoming Classes"
          value={upcomingCount}
          icon={<Hourglass className="h-5 w-5 text-indigo-600" />}
          description="Scheduled 1-on-1 sessions"
        />
        <StatCard
          title="Completed Sessions"
          value={completedCount}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          description="Total hours logged"
        />
        <StatCard
          title="Worksheets Shared"
          value={totalWorksheets}
          icon={<FileText className="h-5 w-5 text-amber-500" />}
          description="PDFs & homework files"
        />
        <StatCard
          title="Cancelled / Void"
          value={cancelledCount}
          icon={<BookOpen className="h-5 w-5 text-slate-400" />}
          description="Rescheduled or voided"
        />
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <Tabs
          tabs={[
            { id: "ALL", label: "All Lessons", count: lessons.length },
            { id: "UPCOMING", label: "Upcoming & Live", count: upcomingCount },
            { id: "COMPLETED", label: "Completed Sessions", count: completedCount },
            { id: "CANCELLED", label: "Cancelled", count: cancelledCount },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="line"
        />

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search student, subject, ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pl-9 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14209C]"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>

      {/* Lessons List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No lessons match your filter</h3>
          <p className="text-xs text-slate-400">
            Try switching tabs or adjusting search keywords.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((lesson) => (
            <div
              key={lesson.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-start gap-4">
                <Avatar
                  src={lesson.studentAvatar}
                  fallbackName={lesson.studentName}
                  size="lg"
                />

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {lesson.studentName}
                    </h3>
                    <Badge variant="subtle" size="sm">
                      {lesson.subjectName}
                    </Badge>
                    <Badge
                      variant={
                        lesson.status === "COMPLETED"
                          ? "success"
                          : lesson.status === "SCHEDULED"
                          ? "default"
                          : "destructive"
                      }
                      size="sm"
                      className="text-[10px] font-bold"
                    >
                      {lesson.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-500">
                    Ref: <span className="font-mono font-bold text-slate-700">{lesson.bookingRef}</span> · Focus: {lesson.lessonNotes || "Scheduled 50-minute teaching session."}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {formatDate(lesson.scheduledStart)} at {formatTime(lesson.scheduledStart)}
                    </span>
                    {lesson.materialsCount > 0 && (
                      <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-bold">
                        📁 {lesson.materialsCount} worksheets attached
                      </span>
                    )}
                    {lesson.hasStudentReviewed && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold">
                        ⭐ Reviewed by student
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {(lesson.status === "SCHEDULED" || lesson.status === "LIVE") && (
                  <Link href={`/lessons/${lesson.id}/classroom`}>
                    <Button
                      variant="default"
                      size="default"
                      className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white flex items-center gap-1.5"
                    >
                      <Video className="h-4 w-4" />
                      <span>Launch Classroom</span>
                    </Button>
                  </Link>
                )}

                <Link href={`/tutor/lessons/${lesson.id}`}>
                  <Button
                    variant="outline"
                    size="default"
                    className="text-xs font-semibold flex items-center gap-1.5"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Open Workspace</span>
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
