"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Video,
  Plus,
  User,
  Calendar as CalendarIcon,
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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useModal } from "@/components/ui/modal-context";
import { lessonService } from "@/services/lessonService";
import { formatDate, formatTime } from "@/lib/utils";

type ViewMode = "week" | "month" | "day" | "agenda";

const DAYS_HEADER = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

export default function TutorCalendarPage() {
  const { toast } = useModal();
  const [viewMode, setViewMode] = React.useState<ViewMode>("week");
  const [scheduleData, setScheduleData] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [currentWeekOffset, setCurrentWeekOffset] = React.useState(0);
  const [selectedTimezone, setSelectedTimezone] = React.useState("local");
  const [timezonesList, setTimezonesList] = React.useState<any[]>([]);

  // Selected session drawer / modal
  const [selectedSession, setSelectedSession] = React.useState<any | null>(null);

  const loadSchedule = React.useCallback(async () => {
    setLoading(true);
    try {
      const [data, tzRes] = await Promise.all([
        lessonService.getTutorSchedule360(),
        fetch('/api/timezones').then((r) => (r.ok ? r.json() : [])),
      ]);
      setScheduleData(data);
      if (tzRes) setTimezonesList(tzRes);
    } catch {
      toast({ title: "Error", message: "Failed to load timetable.", variant: "danger" });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // Compute 7 days for the active week offset
  const weekDays = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + currentWeekOffset * 7);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const isToday = d.toDateString() === new Date().toDateString();
      const iso = d.toISOString().split("T")[0];
      return {
        date: d,
        iso,
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        dayNumber: d.getDate(),
        monthName: d.toLocaleDateString("en-US", { month: "short" }),
        isToday,
      };
    });
  }, [currentWeekOffset]);

  const upcomingLessons = scheduleData?.upcomingLessons || [];
  const exceptions = scheduleData?.exceptions || [];

  // Filter lessons for a specific day
  const getLessonsForDay = (dateIso: string) => {
    return upcomingLessons.filter((l: any) => l.scheduledStart.startsWith(dateIso));
  };

  const isDayBlocked = (dateIso: string) => {
    return exceptions.find((e: any) => e.date === dateIso && e.isBlocked);
  };

  const handleExportIcs = () => {
    window.location.href = "/api/tutor/schedule/export-ical";
    toast({
      title: "Calendar Feed Exported",
      message: "Your .ics timetable file has been generated for Google/Apple Calendar.",
      variant: "success",
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header with Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Teaching Timetable & Live Schedule
            </h1>
            <Badge variant="subtle" size="sm" className="font-bold">
              {upcomingLessons.length} Scheduled
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time visual agenda synchronized with student bookings, working hours, and video rooms.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timezone Selector */}
          <div className="w-56">
            <SearchableSelect
              placeholder="Select timezone..."
              searchPlaceholder="Search 60+ timezones..."
              value={selectedTimezone}
              onChange={setSelectedTimezone}
              leftIcon={<Globe className="w-3.5 h-3.5" />}
              options={[
                { value: "local", label: `Local (${Intl.DateTimeFormat().resolvedOptions().timeZone})` },
                { value: "UTC", label: "UTC (Universal Standard)" },
                ...timezonesList.map((tz) => ({
                  value: tz.identifier,
                  label: tz.identifier,
                  sublabel: `${tz.utcOffset} • ${tz.displayName}`,
                })),
              ]}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportIcs}
            className="text-xs font-bold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-[#14209C]" />
            <span>Sync iCal / Google</span>
          </Button>

          <Link href="/tutor/availability">
            <Button
              variant="default"
              size="sm"
              className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs"
            >
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              <span>Manage Working Hours</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. View Mode Bar & Navigation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeekOffset(0)}
            className="text-xs font-bold"
          >
            Today / This Week
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <span className="text-xs font-bold text-slate-700 ml-2">
            {weekDays[0]?.monthName} {weekDays[0]?.dayNumber} – {weekDays[6]?.monthName} {weekDays[6]?.dayNumber}, {weekDays[0]?.date.getFullYear()}
          </span>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          {[
            { id: "week", label: "Week Grid", icon: LayoutGrid },
            { id: "month", label: "Month", icon: CalendarRange },
            { id: "day", label: "Day View", icon: Layers },
            { id: "agenda", label: "Agenda", icon: List },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setViewMode(id as ViewMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. CALENDAR VIEWS */}

      {/* A. WEEK VIEW */}
      {viewMode === "week" && (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Week Days Header */}
          <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50/70 text-center text-xs">
            <div className="p-3 border-r border-slate-200 font-mono text-[11px] text-slate-400">
              TIME (UTC)
            </div>
            {weekDays.map((day) => (
              <div
                key={day.iso}
                className={`p-3 border-r last:border-r-0 border-slate-200 ${
                  day.isToday ? "bg-indigo-50/60" : ""
                }`}
              >
                <span className="block text-[11px] font-bold text-slate-400 uppercase">
                  {day.dayName}
                </span>
                <div
                  className={`text-sm font-extrabold mx-auto h-7 w-7 flex items-center justify-center rounded-full mt-0.5 ${
                    day.isToday ? "bg-[#14209C] text-white shadow-sm" : "text-slate-800"
                  }`}
                >
                  {day.dayNumber}
                </div>
              </div>
            ))}
          </div>

          {/* Hourly Slots Grid */}
          <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
            {HOURS.map((hour) => {
              const timeString = `${String(hour).padStart(2, "0")}:00`;
              return (
                <div key={hour} className="grid grid-cols-8 min-h-[56px]">
                  {/* Hour Label */}
                  <div className="p-2 border-r border-slate-200 text-[11px] font-mono text-slate-400 text-right pr-3 flex items-center justify-end bg-slate-50/40">
                    {timeString}
                  </div>

                  {/* 7 Day Columns for this Hour */}
                  {weekDays.map((day) => {
                    const lessonsInSlot = upcomingLessons.filter((l: any) => {
                      if (!l.scheduledStart.startsWith(day.iso)) return false;
                      const lessonHour = new Date(l.scheduledStart).getUTCHours();
                      return lessonHour === hour;
                    });

                    const blocked = isDayBlocked(day.iso);

                    return (
                      <div
                        key={day.iso}
                        className={`p-1.5 border-r last:border-r-0 border-slate-100 relative transition ${
                          day.isToday ? "bg-indigo-50/10" : ""
                        } ${blocked ? "bg-slate-100/50" : "hover:bg-slate-50/60"}`}
                      >
                        {blocked && (
                          <div className="h-full rounded-lg bg-rose-50 border border-rose-200/60 p-1 text-[10px] text-rose-700 font-bold flex items-center justify-center text-center">
                            ⛔ Time-off
                          </div>
                        )}

                        {lessonsInSlot.map((lesson: any) => (
                          <button
                            key={lesson.id}
                            type="button"
                            onClick={() => setSelectedSession(lesson)}
                            className="w-full text-left p-2 rounded-xl bg-[#14209C] text-white shadow-sm hover:scale-[1.02] transition space-y-0.5 cursor-pointer block"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-indigo-200">
                                {formatTime(lesson.scheduledStart)}
                              </span>
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            </div>
                            <strong className="text-xs font-bold block truncate">
                              {lesson.studentName}
                            </strong>
                            <span className="text-[10px] text-indigo-200 truncate block">
                              {lesson.subjectName}
                            </span>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* B. MONTH VIEW */}
      {viewMode === "month" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-7 gap-2 text-center pb-3 border-b border-slate-100 font-bold text-xs text-slate-400">
            {DAYS_HEADER.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }, (_, i) => {
              const dayNum = (i % 31) + 1;
              const hasLessons = i === 10 || i === 14 || i === 22;
              return (
                <div
                  key={i}
                  className={`h-24 rounded-2xl border p-2 flex flex-col justify-between transition ${
                    i === 14
                      ? "border-[#14209C] bg-indigo-50/40"
                      : "border-slate-100 bg-slate-50/40 hover:bg-slate-50"
                  }`}
                >
                  <span className={`text-xs font-bold ${i === 14 ? "text-[#14209C]" : "text-slate-700"}`}>
                    {dayNum}
                  </span>

                  {hasLessons && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold bg-[#14209C] text-white px-2 py-0.5 rounded-md block truncate">
                        📖 1 Class
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* C. DAY VIEW */}
      {viewMode === "day" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Today's Teaching Schedule ({formatDate(new Date().toISOString())})
              </h3>
              <p className="text-xs text-slate-500">Live timeline with student objectives and materials.</p>
            </div>
          </div>

          <div className="space-y-4">
            {upcomingLessons.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-8">No lessons scheduled for today.</p>
            ) : (
              upcomingLessons.map((lesson: any) => (
                <div
                  key={lesson.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <Avatar src={lesson.studentAvatar} fallbackName={lesson.studentName} size="lg" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900">{lesson.studentName}</h4>
                        <Badge variant="default" size="sm">
                          {lesson.subjectName}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">
                        Focus: {lesson.lessonNotes || "1-on-1 IELTS & General Masterclass"}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                        <span className="font-semibold text-slate-800">
                          🕒 {formatTime(lesson.scheduledStart)} – {formatTime(lesson.scheduledEnd)}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[11px] text-slate-400">Ref: {lesson.bookingRef}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/lessons/${lesson.id}/classroom`}>
                      <Button
                        variant="default"
                        className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs flex items-center gap-1.5"
                      >
                        <Video className="w-4 h-4" />
                        <span>Launch Video Room</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* D. AGENDA VIEW */}
      {viewMode === "agenda" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            All Upcoming Classes ({upcomingLessons.length})
          </h3>

          <div className="space-y-3">
            {upcomingLessons.map((lesson: any) => (
              <div
                key={lesson.id}
                onClick={() => setSelectedSession(lesson)}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <Avatar src={lesson.studentAvatar} fallbackName={lesson.studentName} size="md" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{lesson.studentName}</h4>
                    <p className="text-xs text-slate-500">{lesson.subjectName} · {lesson.studentEmail}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right text-xs">
                    <span className="font-bold text-slate-900 block">{formatDate(lesson.scheduledStart)}</span>
                    <span className="text-slate-500">{formatTime(lesson.scheduledStart)}</span>
                  </div>
                  <Badge variant="default" size="sm">
                    {lesson.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SESSION INSPECTION MODAL / DRAWER */}
      {selectedSession && (
        <Modal
          isOpen={Boolean(selectedSession)}
          onClose={() => setSelectedSession(null)}
          title={`Classroom: ${selectedSession.subjectName}`}
          description={`Scheduled session with ${selectedSession.studentName}`}
        >
          <div className="space-y-5 pt-2 text-xs text-slate-800">
            {/* Student card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <Avatar src={selectedSession.studentAvatar} fallbackName={selectedSession.studentName} size="md" />
              <div>
                <strong className="text-sm font-bold text-slate-900 block">{selectedSession.studentName}</strong>
                <span className="text-[11px] text-slate-400">{selectedSession.studentEmail}</span>
              </div>
            </div>

            {/* Schedule details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Scheduled Date</span>
                <span className="font-bold text-slate-900 text-sm block mt-0.5">
                  {formatDate(selectedSession.scheduledStart)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Session Time</span>
                <span className="font-bold text-slate-900 text-sm block mt-0.5">
                  {formatTime(selectedSession.scheduledStart)} – {formatTime(selectedSession.scheduledEnd)}
                </span>
              </div>
            </div>

            {/* Pre-lesson notes */}
            {selectedSession.lessonNotes && (
              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
                <span className="text-[10px] font-bold text-indigo-900 uppercase block mb-0.5">Student Focus:</span>
                <p className="text-indigo-800">{selectedSession.lessonNotes}</p>
              </div>
            )}

            {/* LiveKit Video Room */}
            <div className="p-3 rounded-xl bg-slate-900 text-white space-y-1">
              <span className="text-[10px] font-bold text-indigo-300 uppercase block">Encrypted LiveKit Room</span>
              <span className="font-mono text-xs block">{selectedSession.videoRoomId}</span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setSelectedSession(null)}>
                Close
              </Button>
              <Link href={`/lessons/${selectedSession.id}/classroom`}>
                <Button variant="default" className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white flex items-center gap-1.5">
                  <Video className="w-4 h-4" />
                  <span>Launch Live Classroom</span>
                </Button>
              </Link>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
