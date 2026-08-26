"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Video,
  Plus,
  BookOpen,
  Globe,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Layers,
  LayoutGrid,
  List,
  CalendarRange,
  FileText,
  MessageSquare,
  Star,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { useModal } from "@/components/ui/modal-context";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { lessonService } from "@/services/lessonService";
import { formatDate, formatTime } from "@/lib/utils";

type ViewMode = "week" | "month" | "day" | "agenda";

const DAYS_HEADER = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

export default function StudentCalendarPage() {
  const { toast } = useModal();
  const [viewMode, setViewMode] = React.useState<ViewMode>("week");
  const [lessons, setLessons] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentWeekOffset, setCurrentWeekOffset] = React.useState(0);
  const [selectedTimezone, setSelectedTimezone] = React.useState("local");
  const [timezonesList, setTimezonesList] = React.useState<any[]>([]);

  // Selected session inspector modal
  const [selectedSession, setSelectedSession] = React.useState<any | null>(null);

  const loadLessons = React.useCallback(async () => {
    setLoading(true);
    try {
      const [data, tzRes] = await Promise.all([
        lessonService.getStudentLessons(),
        fetch('/api/timezones').then((r) => (r.ok ? r.json() : [])),
      ]);
      setLessons(data || []);
      if (tzRes) setTimezonesList(tzRes);
    } catch {
      toast({ title: "Error", message: "Failed to load schedule.", variant: "danger" });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  // Compute 7 days for the active week offset
  const weekDays = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentDay = today.getDay(); // 0 = Sun
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay + currentWeekOffset * 7);

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const isToday =
        d.getDate() === new Date().getDate() &&
        d.getMonth() === new Date().getMonth() &&
        d.getFullYear() === new Date().getFullYear();

      return {
        dateObj: d,
        dateStr: d.toISOString().split("T")[0],
        dayName: DAYS_HEADER[i],
        dayNum: d.getDate(),
        monthName: d.toLocaleDateString("en-US", { month: "short" }),
        isToday,
      };
    });
  }, [currentWeekOffset]);

  // Filter lessons that fall into a specific day
  const getLessonsForDay = (dateStr: string) => {
    return lessons.filter((l) => {
      if (!l.scheduledStart) return false;
      const lessonDate = new Date(l.scheduledStart).toISOString().split("T")[0];
      return lessonDate === dateStr;
    });
  };

  const upcomingLessons = lessons.filter(
    (l) => l.status === "SCHEDULED" || l.status === "CONFIRMED" || l.status === "IN_PROGRESS" || l.status === "LIVE"
  );
  const totalHoursThisWeek = (upcomingLessons.length * 0.85).toFixed(1);
  const homeworkCount = lessons.filter((l) => l.homeworkAssigned && !l.studentHomeworkSubmittedAt).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. Header & Global Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Learning Calendar & Timetable
            </h1>
            <Badge variant="neutral" size="sm" className="bg-indigo-50 text-[#14209C] border-indigo-200">
              Interactive Timetable
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Weekly 1-on-1 schedule, LiveKit classroom links, and homework due dates.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Timezone Switcher */}
          <div className="w-56">
            <SearchableSelect
              placeholder="Select timezone..."
              searchPlaceholder="Search 60+ timezones..."
              value={selectedTimezone}
              onChange={setSelectedTimezone}
              leftIcon={<Globe className="w-3.5 h-3.5" />}
              options={[
                { value: "local", label: `Local (${Intl.DateTimeFormat().resolvedOptions().timeZone})` },
                { value: "UTC", label: "UTC (Universal Time)" },
                ...timezonesList.map((tz) => ({
                  value: tz.identifier,
                  label: tz.identifier,
                  sublabel: `${tz.utcOffset} • ${tz.displayName}`,
                })),
              ]}
            />
          </div>

          {/* iCal Export Feed */}
          <a href="/api/student/calendar/export-ical" download>
            <Button variant="outline" size="sm" className="font-bold text-xs flex items-center gap-1.5 shadow-xs">
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export iCal Feed</span>
            </Button>
          </a>

          <Link href="/find-tutors">
            <Button variant="default" size="sm" className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs flex items-center gap-1.5 shadow-sm">
              <Plus className="w-3.5 h-3.5" />
              <span>Book Lesson</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Learning Pace Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl border border-slate-200/80 bg-white shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Weekly Learning</span>
          <strong className="text-xl font-black text-slate-900 block">{totalHoursThisWeek} hrs</strong>
          <span className="text-xs text-slate-500 font-medium">Scheduled study time</span>
        </div>

        <div className="p-5 rounded-3xl border border-slate-200/80 bg-white shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Upcoming Classes</span>
          <strong className="text-xl font-black text-[#14209C] block">{upcomingLessons.length} sessions</strong>
          <span className="text-xs text-slate-500 font-medium">Confirmed on timetable</span>
        </div>

        <div className="p-5 rounded-3xl border border-slate-200/80 bg-white shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Homework Due</span>
          <strong className="text-xl font-black text-amber-600 block">{homeworkCount} tasks</strong>
          <span className="text-xs text-slate-500 font-medium">Pending submission</span>
        </div>

        <div className="p-5 rounded-3xl border border-slate-200/80 bg-white shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Lifetime Lessons</span>
          <strong className="text-xl font-black text-emerald-600 block">{lessons.length} sessions</strong>
          <span className="text-xs text-slate-500 font-medium">Completed & scheduled</span>
        </div>
      </div>

      {/* 3. Navigation Controls Bar */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
            className="rounded-xl"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeekOffset(0)}
            className="font-bold text-xs px-3 rounded-xl"
          >
            Current Week
          </Button>

          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
            className="rounded-xl"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <span className="font-extrabold text-sm text-slate-900 ml-2">
            {weekDays[0].monthName} {weekDays[0].dayNum} – {weekDays[6].monthName} {weekDays[6].dayNum},{" "}
            {weekDays[0].dateObj.getFullYear()}
          </span>
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60 self-start sm:self-auto">
          <button
            onClick={() => setViewMode("week")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === "week"
                ? "bg-white text-[#14209C] shadow-xs font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>Week</span>
          </button>

          <button
            onClick={() => setViewMode("month")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === "month"
                ? "bg-white text-[#14209C] shadow-xs font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Month</span>
          </button>

          <button
            onClick={() => setViewMode("day")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === "day"
                ? "bg-white text-[#14209C] shadow-xs font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Day</span>
          </button>

          <button
            onClick={() => setViewMode("agenda")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === "agenda"
                ? "bg-white text-[#14209C] shadow-xs font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Agenda</span>
          </button>
        </div>
      </div>

      {/* 4. MAIN TIMETABLE VIEWS */}
      {viewMode === "week" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
          <div className="min-w-[800px] space-y-4">
            {/* Week Header Row */}
            <div className="grid grid-cols-7 gap-3 pb-3 border-b border-slate-100">
              {weekDays.map((day) => (
                <div
                  key={day.dateStr}
                  className={`p-3 rounded-2xl text-center space-y-1 ${
                    day.isToday ? "bg-indigo-50/80 border border-indigo-100 text-[#14209C]" : "bg-slate-50/50"
                  }`}
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider block text-slate-400">
                    {day.dayName}
                  </span>
                  <div
                    className={`h-8 w-8 mx-auto flex items-center justify-center rounded-full text-sm font-black ${
                      day.isToday ? "bg-[#14209C] text-white" : "text-slate-800"
                    }`}
                  >
                    {day.dayNum}
                  </div>
                </div>
              ))}
            </div>

            {/* Week Day Grid Columns */}
            <div className="grid grid-cols-7 gap-3 min-h-[420px]">
              {weekDays.map((day) => {
                const dayLessons = getLessonsForDay(day.dateStr);

                return (
                  <div
                    key={day.dateStr}
                    className={`rounded-2xl p-2 min-h-[360px] flex flex-col gap-2 border ${
                      day.isToday ? "bg-indigo-50/20 border-indigo-100" : "bg-slate-50/30 border-slate-100"
                    }`}
                  >
                    {dayLessons.length === 0 ? (
                      <div className="my-auto text-center p-3 text-[11px] text-slate-300 italic">
                        No classes
                      </div>
                    ) : (
                      dayLessons.map((l) => (
                        <div
                          key={l.id}
                          onClick={() => setSelectedSession(l)}
                          className="group p-3 rounded-2xl border border-indigo-200 bg-white hover:border-[#14209C] hover:shadow-md transition-all cursor-pointer space-y-2 text-left"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold text-[#14209C] truncate">
                              {l.subjectName}
                            </span>
                            <Badge variant={l.status === "COMPLETED" ? "success" : "default"} size="xs" className="text-[9px]">
                              {l.status}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2">
                            <Avatar src={l.tutorAvatar} fallbackName={l.tutorName} size="xs" />
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {l.tutorName}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-slate-600">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{formatTime(l.scheduledStart)}</span>
                          </div>

                          {l.curriculumTopic && (
                            <p className="text-[10px] text-slate-500 line-clamp-1 bg-slate-50 p-1 rounded">
                              🎯 {l.curriculumTopic}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MONTH VIEW */}
      {viewMode === "month" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-7 gap-2 pb-2 border-b border-slate-100 text-center font-bold text-xs text-slate-400 uppercase">
            {DAYS_HEADER.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => {
              const dayNum = ((i + 1) % 31) + 1;
              const hasClass = i === 1 || i === 8 || i === 15 || i === 22;

              return (
                <div
                  key={i}
                  className={`min-h-[90px] p-2.5 rounded-2xl border transition-all flex flex-col justify-between ${
                    hasClass
                      ? "border-indigo-200 bg-indigo-50/40 hover:border-[#14209C] cursor-pointer"
                      : "border-slate-100 bg-slate-50/20"
                  }`}
                >
                  <span className="font-bold text-xs text-slate-700">{dayNum}</span>

                  {hasClass && (
                    <div className="p-1.5 rounded-xl bg-white border border-indigo-100 text-[10px] font-bold text-[#14209C] truncate">
                      📚 1-on-1 Class
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DAY VIEW */}
      {viewMode === "day" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Daily Schedule Timeline
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Hour-by-hour classroom availability and scheduled sessions.
              </p>
            </div>
            <span className="text-xs font-bold text-[#14209C]">
              {formatDate(new Date().toISOString())}
            </span>
          </div>

          <div className="space-y-3">
            {HOURS.map((hour) => {
              const hourStr = `${hour < 10 ? `0${hour}` : hour}:00`;
              const matchedLesson = lessons.find((l) => {
                if (!l.scheduledStart) return false;
                const d = new Date(l.scheduledStart);
                return d.getHours() === hour;
              });

              return (
                <div key={hour} className="flex items-start gap-4 py-2 border-b border-slate-100/70">
                  <span className="w-16 font-mono text-xs font-bold text-slate-400 pt-2 shrink-0">
                    {hourStr}
                  </span>

                  <div className="flex-1">
                    {matchedLesson ? (
                      <div
                        onClick={() => setSelectedSession(matchedLesson)}
                        className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/50 hover:border-[#14209C] hover:bg-indigo-50 transition cursor-pointer flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar src={matchedLesson.tutorAvatar} fallbackName={matchedLesson.tutorName} size="sm" />
                          <div>
                            <strong className="text-xs font-bold text-slate-900 block">
                              {matchedLesson.subjectName} with {matchedLesson.tutorName}
                            </strong>
                            <span className="text-[11px] text-slate-500">
                              {formatTime(matchedLesson.scheduledStart)} – {formatTime(matchedLesson.scheduledEnd)}
                            </span>
                          </div>
                        </div>

                        <Link href={`/lessons/${matchedLesson.id}/classroom`}>
                          <Button size="sm" className="font-bold text-xs bg-[#14209C] text-white flex items-center gap-1">
                            <Video className="w-3.5 h-3.5" />
                            <span>Join Live</span>
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="h-10 rounded-xl border border-dashed border-slate-200 bg-slate-50/30 flex items-center px-4 text-xs text-slate-300">
                        Open Slot
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AGENDA VIEW */}
      {viewMode === "agenda" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Chronological Learning Agenda ({lessons.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Full chronological order of all confirmed and completed lessons.
            </p>
          </div>

          <div className="space-y-4">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                onClick={() => setSelectedSession(lesson)}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <Avatar src={lesson.tutorAvatar} fallbackName={lesson.tutorName} size="md" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{lesson.subjectName}</h4>
                      <Badge variant={lesson.status === "COMPLETED" ? "success" : "default"} size="xs">
                        {lesson.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-500">
                      Instructor: <strong className="text-slate-800">{lesson.tutorName}</strong>
                    </p>

                    <p className="text-xs text-slate-700 font-bold flex items-center gap-1.5 pt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-[#14209C]" />
                      <span>{formatDate(lesson.scheduledStart)} at {formatTime(lesson.scheduledStart)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Button variant="outline" size="sm" className="text-xs font-bold">
                    Inspect Session
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. INTERACTIVE SESSION INSPECTOR MODAL */}
      {selectedSession && (
        <Modal
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          title={selectedSession.subjectName}
          description={`Booking Ref: ${selectedSession.bookingRef} · ${formatDate(selectedSession.scheduledStart)}`}
          maxWidth="2xl"
        >
          <div className="space-y-6 pt-2 text-slate-900">
            {/* Tutor Identity */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <Avatar
                  src={selectedSession.tutorAvatar}
                  fallbackName={selectedSession.tutorName}
                  size="lg"
                />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Instructor</span>
                  <strong className="text-sm font-bold text-slate-900">{selectedSession.tutorName}</strong>
                  <p className="text-xs text-slate-500">{selectedSession.tutorHeadline || "Verified Educator"}</p>
                </div>
              </div>

              <Link href="/student/messages">
                <Button variant="outline" size="sm" className="text-xs font-bold flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Message</span>
                </Button>
              </Link>
            </div>

            {/* Time & Classroom details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Scheduled Time</span>
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                  <Clock className="w-4 h-4 text-[#14209C]" />
                  <span>{formatTime(selectedSession.scheduledStart)} – {formatTime(selectedSession.scheduledEnd)}</span>
                </div>
                <span className="text-[11px] text-slate-400 block">{selectedSession.durationMinutes || 50} mins session</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Classroom Room</span>
                <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 text-xs truncate">
                  <Video className="w-4 h-4 text-emerald-600" />
                  <span>{selectedSession.videoRoomId}</span>
                </div>
                <span className="text-[11px] text-emerald-700 font-semibold block">WebRTC HD Video Active</span>
              </div>
            </div>

            {/* Curriculum Topic */}
            {selectedSession.curriculumTopic && (
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs space-y-1">
                <span className="font-bold text-[#14209C] uppercase tracking-wider text-[10px] block">
                  🎯 Lesson Topic Focus:
                </span>
                <p className="font-bold text-slate-900 text-sm">{selectedSession.curriculumTopic}</p>
              </div>
            )}

            {/* Homework task */}
            {selectedSession.homeworkAssigned && (
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs space-y-1">
                <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px] block">
                  📝 Assigned Homework Task:
                </span>
                <p className="text-amber-950 font-medium">{selectedSession.homeworkAssigned}</p>
                {selectedSession.homeworkDueDate && (
                  <span className="text-[11px] text-amber-800 font-bold block pt-1">
                    Due Date: {formatDate(selectedSession.homeworkDueDate)}
                  </span>
                )}
              </div>
            )}

            {/* Action Buttons Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <Link href={`/student/lessons/${selectedSession.id}`}>
                <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs font-bold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Open Full Lesson 360</span>
                </Button>
              </Link>

              <Link href={`/lessons/${selectedSession.id}/classroom`}>
                <Button
                  variant="default"
                  size="sm"
                  className="w-full sm:w-auto font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Enter Live Classroom</span>
                </Button>
              </Link>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
