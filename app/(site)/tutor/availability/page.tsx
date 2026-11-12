"use client";

import * as React from "react";
import {
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Copy,
  Calendar as CalendarIcon,
  Sliders,
  Sparkles,
  Save,
  Check,
  Palmtree,
  Hourglass,
  CalendarRange,
  Globe,
  Eye,
  Wand2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { useModal } from "@/components/ui/modal-context";
import { lessonService } from "@/services/lessonService";
import { TutorAvailabilityRuleItem, TutorScheduleSettings } from "@/src/modules/lessons/domain/types";
import { formatDate } from "@/lib/utils";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const WORLD_TIMEZONES = [
  { label: "UTC (Coordinated Universal Time)", value: "UTC" },
  { label: "New York (EST/EDT, UTC-5/-4)", value: "America/New_York" },
  { label: "London (GMT/BST, UTC+0/+1)", value: "Europe/London" },
  { label: "Paris / Berlin (CET/CEST, UTC+1/+2)", value: "Europe/Paris" },
  { label: "Dubai (GST, UTC+4)", value: "Asia/Dubai" },
  { label: "Nairobi (EAT, UTC+3)", value: "Africa/Nairobi" },
  { label: "Singapore / Hong Kong (SGT, UTC+8)", value: "Asia/Singapore" },
  { label: "Tokyo (JST, UTC+9)", value: "Asia/Tokyo" },
  { label: "Sydney (AEST/AEDT, UTC+10/+11)", value: "Australia/Sydney" },
];

interface SlotConflictInfo {
  dayIdx: number;
  slotIdx: number;
  message: string;
}

function timeToMinutes(t: string): number {
  if (!t) return 0;
  const parts = t.split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

function formatDuration(startMin: number, endMin: number): string {
  const diff = endMin - startMin;
  if (diff <= 0) return '';
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function findSlotConflicts(rules: TutorAvailabilityRuleItem[]): Map<string, SlotConflictInfo> {
  const conflictMap = new Map<string, SlotConflictInfo>();

  for (let day = 0; day <= 6; day++) {
    const daySlots: { slot: TutorAvailabilityRuleItem; originalIndex: number }[] = [];
    let count = 0;
    for (const r of rules) {
      if (r.dayOfWeek === day) {
        daySlots.push({ slot: r, originalIndex: count });
        count++;
      }
    }

    // 1. Check inversions or invalid durations
    daySlots.forEach(({ slot, originalIndex }) => {
      if (!slot.isActive) return;
      const startMin = timeToMinutes(slot.startTime);
      const endMin = timeToMinutes(slot.endTime);

      if (endMin <= startMin) {
        conflictMap.set(`${day}-${originalIndex}`, {
          dayIdx: day,
          slotIdx: originalIndex,
          message: 'End time must be after start time.',
        });
      } else if (endMin - startMin < 15) {
        conflictMap.set(`${day}-${originalIndex}`, {
          dayIdx: day,
          slotIdx: originalIndex,
          message: 'Minimum shift length is 15 minutes.',
        });
      }
    });

    // 2. Check pairwise overlaps among active slots on this day
    for (let i = 0; i < daySlots.length; i++) {
      const a = daySlots[i];
      if (!a.slot.isActive) continue;
      const startA = timeToMinutes(a.slot.startTime);
      const endA = timeToMinutes(a.slot.endTime);
      if (endA <= startA) continue;

      for (let j = i + 1; j < daySlots.length; j++) {
        const b = daySlots[j];
        if (!b.slot.isActive) continue;
        const startB = timeToMinutes(b.slot.startTime);
        const endB = timeToMinutes(b.slot.endTime);
        if (endB <= startB) continue;

        // Collision test: startA < endB && endA > startB
        if (startA < endB && endA > startB) {
          conflictMap.set(`${day}-${a.originalIndex}`, {
            dayIdx: day,
            slotIdx: a.originalIndex,
            message: `Overlaps with Shift #${j + 1} (${b.slot.startTime.slice(0, 5)}–${b.slot.endTime.slice(0, 5)})`,
          });
          conflictMap.set(`${day}-${b.originalIndex}`, {
            dayIdx: day,
            slotIdx: b.originalIndex,
            message: `Overlaps with Shift #${i + 1} (${a.slot.startTime.slice(0, 5)}–${a.slot.endTime.slice(0, 5)})`,
          });
        }
      }
    }
  }

  return conflictMap;
}

export default function TutorAvailabilityPage() {
  const { toast } = useModal();
  const [activeTab, setActiveTab] = React.useState("weekly");

  // Tab 1: Weekly Multi-Slot Rules
  const [rules, setRules] = React.useState<TutorAvailabilityRuleItem[]>([
    { tutorId: "", dayOfWeek: 1, startTime: "09:00:00", endTime: "17:00:00", isActive: true },
    { tutorId: "", dayOfWeek: 2, startTime: "09:00:00", endTime: "17:00:00", isActive: true },
    { tutorId: "", dayOfWeek: 3, startTime: "09:00:00", endTime: "17:00:00", isActive: true },
    { tutorId: "", dayOfWeek: 4, startTime: "09:00:00", endTime: "17:00:00", isActive: true },
    { tutorId: "", dayOfWeek: 5, startTime: "09:00:00", endTime: "17:00:00", isActive: true },
  ]);

  // Real-time conflict detector
  const conflicts = React.useMemo(() => findSlotConflicts(rules), [rules]);
  const hasConflicts = conflicts.size > 0;

  // Tab 2: Exceptions / Time-Off
  const [exceptions, setExceptions] = React.useState<any[]>([]);
  const [isExceptionModalOpen, setIsExceptionModalOpen] = React.useState(false);
  const [newExceptionDate, setNewExceptionDate] = React.useState("");
  const [newExceptionReason, setNewExceptionReason] = React.useState("");
  const [isAllDayException, setIsAllDayException] = React.useState(true);
  const [exceptionStartTime, setExceptionStartTime] = React.useState("14:00");
  const [exceptionEndTime, setExceptionEndTime] = React.useState("17:00");

  // Tab 3: Settings & Policies
  const [settings, setSettings] = React.useState<TutorScheduleSettings>({
    bufferMinutes: 10,
    minNoticeHours: 4,
    maxAdvanceDays: 30,
    defaultLessonDuration: 50,
  });

  // Tab 4: Live Slot Preview & Timezone Tester
  const [previewDate, setPreviewDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [previewTz, setPreviewTz] = React.useState("UTC");
  const [previewData, setPreviewData] = React.useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);

  const [loading, setLoading] = React.useState(true);
  const [savingWeekly, setSavingWeekly] = React.useState(false);
  const [savingSettings, setSavingSettings] = React.useState(false);

  const loadScheduleData = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await lessonService.getTutorSchedule360();
      if (data) {
        if (data.rules && data.rules.length > 0) {
          setRules(data.rules);
        }
        if (data.exceptions) {
          setExceptions(data.exceptions);
        }
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch {
      toast({ title: "Error", message: "Failed to load schedule rules.", variant: "danger" });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadScheduleData();
  }, [loadScheduleData]);

  // Load preview data when tab 4 is active or date/tz changes
  const loadPreview = React.useCallback(async () => {
    setPreviewLoading(true);
    try {
      const data = await lessonService.getSchedulePreview(previewDate, previewTz);
      setPreviewData(data);
    } catch {
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [previewDate, previewTz]);

  React.useEffect(() => {
    if (activeTab === "preview") {
      loadPreview();
    }
  }, [activeTab, loadPreview]);

  // Multi-Slot Operations
  const getDaySlots = (dayIdx: number) => {
    return rules.filter((r) => r.dayOfWeek === dayIdx);
  };

  const addSlotToDay = (dayIdx: number) => {
    const existing = getDaySlots(dayIdx);
    let newStart = "14:00:00";
    let newEnd = "18:00:00";

    if (existing.length > 0) {
      let maxEndMin = 0;
      for (const slot of existing) {
        const m = timeToMinutes(slot.endTime);
        if (m > maxEndMin) maxEndMin = m;
      }

      if (maxEndMin + 60 <= 23 * 60) {
        const startMin = Math.min(23 * 60, maxEndMin + 30);
        const endMin = Math.min(24 * 60 - 1, startMin + 2 * 60);
        const startH = Math.floor(startMin / 60);
        const startM = startMin % 60;
        const endH = Math.floor(endMin / 60);
        const endM = endMin % 60;
        newStart = `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}:00`;
        newEnd = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}:00`;
      } else {
        let minStartMin = 24 * 60;
        for (const slot of existing) {
          const m = timeToMinutes(slot.startTime);
          if (m < minStartMin) minStartMin = m;
        }
        if (minStartMin >= 120) {
          const startMin = Math.max(7 * 60, minStartMin - 2 * 60);
          const endMin = minStartMin;
          const startH = Math.floor(startMin / 60);
          const startM = startMin % 60;
          const endH = Math.floor(endMin / 60);
          const endM = endMin % 60;
          newStart = `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}:00`;
          newEnd = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}:00`;
        } else {
          newStart = "18:00:00";
          newEnd = "20:00:00";
        }
      }
    }

    setRules([
      ...rules,
      {
        tutorId: "",
        dayOfWeek: dayIdx,
        startTime: newStart,
        endTime: newEnd,
        isActive: true,
      },
    ]);
  };

  const removeSlot = (dayIdx: number, slotIndex: number) => {
    let dayCount = 0;
    const newRules = rules.filter((r) => {
      if (r.dayOfWeek === dayIdx) {
        const isTarget = dayCount === slotIndex;
        dayCount++;
        return !isTarget;
      }
      return true;
    });
    setRules(newRules);
  };

  const updateSlotTime = (dayIdx: number, slotIndex: number, field: "startTime" | "endTime", val: string) => {
    const formatted = val.length === 5 ? `${val}:00` : val;
    let dayCount = 0;
    const newRules = rules.map((r) => {
      if (r.dayOfWeek === dayIdx) {
        if (dayCount === slotIndex) {
          dayCount++;
          return { ...r, [field]: formatted };
        }
        dayCount++;
      }
      return r;
    });
    setRules(newRules);
  };

  const toggleDayActive = (dayIdx: number) => {
    const slots = getDaySlots(dayIdx);
    if (slots.length === 0) {
      // Add standard 09:00 - 17:00 slot
      setRules([
        ...rules,
        {
          tutorId: "",
          dayOfWeek: dayIdx,
          startTime: "09:00:00",
          endTime: "17:00:00",
          isActive: true,
        },
      ]);
    } else {
      // Toggle all slots for this day
      const anyActive = slots.some((s) => s.isActive);
      setRules(
        rules.map((r) => (r.dayOfWeek === dayIdx ? { ...r, isActive: !anyActive } : r))
      );
    }
  };

  // Schedule Presets
  const applyPreset = (presetType: "9to5" | "mornings" | "evenings" | "flexible") => {
    let newRules: TutorAvailabilityRuleItem[] = [];

    switch (presetType) {
      case "9to5":
        // Mon-Fri 09:00 - 17:00
        newRules = [1, 2, 3, 4, 5].map((d) => ({
          tutorId: "",
          dayOfWeek: d,
          startTime: "09:00:00",
          endTime: "17:00:00",
          isActive: true,
        }));
        break;

      case "mornings":
        // Mon-Sat 07:00 - 12:00
        newRules = [1, 2, 3, 4, 5, 6].map((d) => ({
          tutorId: "",
          dayOfWeek: d,
          startTime: "07:00:00",
          endTime: "12:00:00",
          isActive: true,
        }));
        break;

      case "evenings":
        // Mon-Fri 17:00 - 21:00 + Sat/Sun 10:00 - 16:00
        newRules = [
          ...[1, 2, 3, 4, 5].map((d) => ({
            tutorId: "",
            dayOfWeek: d,
            startTime: "17:00:00",
            endTime: "21:00:00",
            isActive: true,
          })),
          ...[0, 6].map((d) => ({
            tutorId: "",
            dayOfWeek: d,
            startTime: "10:00:00",
            endTime: "16:00:00",
            isActive: true,
          })),
        ];
        break;

      case "flexible":
        // Split shift 09:00-13:00 and 16:00-20:00 on weekdays
        newRules = [1, 2, 3, 4, 5].flatMap((d) => [
          {
            tutorId: "",
            dayOfWeek: d,
            startTime: "09:00:00",
            endTime: "13:00:00",
            isActive: true,
          },
          {
            tutorId: "",
            dayOfWeek: d,
            startTime: "16:00:00",
            endTime: "20:00:00",
            isActive: true,
          },
        ]);
        break;
    }

    setRules(newRules);
    toast({
      title: "Preset Applied",
      message: "Schedule template loaded. Remember to click 'Save Working Hours' to finalize.",
      variant: "success",
    });
  };

  const copyMondayToWeekdays = () => {
    const mondaySlots = getDaySlots(1);
    if (mondaySlots.length === 0) return;

    // Filter out Tue-Fri
    const preserved = rules.filter((r) => r.dayOfWeek < 2 || r.dayOfWeek > 5);
    const newWeekdays = [2, 3, 4, 5].flatMap((d) =>
      mondaySlots.map((m) => ({
        ...m,
        dayOfWeek: d,
      }))
    );

    setRules([...preserved, ...newWeekdays]);
    toast({
      title: "Schedule Copied",
      message: "Monday's shifts replicated to Tuesday through Friday.",
      variant: "success",
    });
  };

  const handleSaveWeekly = async () => {
    if (hasConflicts) {
      toast({
        title: "Scheduling Conflicts Detected",
        message: "Please fix all overlapping shifts and invalid intervals before saving.",
        variant: "destructive" as any,
      });
      return;
    }
    setSavingWeekly(true);
    try {
      const res = await fetch("/api/tutor/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast({
          title: "Working Hours Saved",
          message: "Your weekly recurring shifts have been safely updated.",
          variant: "success",
        });
        loadScheduleData();
      } else {
        toast({
          title: "Save Failed",
          message: data.error || "Failed to save shifts due to validation errors.",
          variant: "destructive" as any,
        });
      }
    } catch (err: any) {
      toast({
        title: "Network Error",
        message: err.message || "Failed to reach server.",
        variant: "destructive" as any,
      });
    } finally {
      setSavingWeekly(false);
    }
  };

  // Handle Time-off Exceptions
  const handleAddException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExceptionDate) return;

    if (!isAllDayException) {
      const sMin = timeToMinutes(exceptionStartTime);
      const eMin = timeToMinutes(exceptionEndTime);
      if (eMin <= sMin) {
        toast({
          title: "Invalid Time Interval",
          message: "End time must be strictly after start time.",
          variant: "destructive" as any,
        });
        return;
      }
    }

    const ok = await lessonService.addTimeOffException({
      date: newExceptionDate,
      isBlocked: true,
      startTime: isAllDayException ? undefined : `${exceptionStartTime}:00`,
      endTime: isAllDayException ? undefined : `${exceptionEndTime}:00`,
      reason: newExceptionReason || "Personal / Holiday",
    });

    if (ok) {
      toast({
        title: "Time-Off Added",
        message: `Date ${newExceptionDate} is now blocked from student bookings.`,
        variant: "success",
      });
      setIsExceptionModalOpen(false);
      setNewExceptionDate("");
      setNewExceptionReason("");
      loadScheduleData();
    }
  };

  const handleDeleteException = async (id: string) => {
    const ok = await lessonService.deleteTimeOffException(id);
    if (ok) {
      toast({ title: "Exception Removed", message: "Time-off block removed.", variant: "warning" });
      loadScheduleData();
    }
  };

  // Handle Booking Policies & Buffers
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    const ok = await lessonService.saveScheduleSettings(settings);
    setSavingSettings(false);
    if (ok) {
      toast({
        title: "Booking Policies Saved",
        message: "Buffer times and advance booking windows have been updated.",
        variant: "success",
      });
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Availability & Working Hours
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure multi-slot daily shifts, holiday overrides, booking buffers, and test student booking views.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadScheduleData}
            className="text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: "weekly", label: "Weekly Working Hours", icon: <Clock className="w-4 h-4" /> },
          { id: "exceptions", label: "Time-Off & Holidays", count: exceptions.length, icon: <Palmtree className="w-4 h-4" /> },
          { id: "policies", label: "Booking Buffer & Policies", icon: <Sliders className="w-4 h-4" /> },
          { id: "preview", label: "Student Slot Preview", icon: <Globe className="w-4 h-4" /> },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="line"
      />

      {/* TAB 1: WEEKLY WORKING HOURS (MULTI-SLOT) */}
      {activeTab === "weekly" && (
        <div className="space-y-6">
          {/* Quick Preset Strip */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-[#14209C]" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Quick Schedule Templates & Presets
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <button
                type="button"
                onClick={() => applyPreset("9to5")}
                className="p-3 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 transition text-left space-y-1"
              >
                <strong className="block text-slate-900 font-bold">Standard 9–5</strong>
                <span className="text-[11px] text-slate-500 block">Mon–Fri 9am–5pm</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset("mornings")}
                className="p-3 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 transition text-left space-y-1"
              >
                <strong className="block text-slate-900 font-bold">Morning Shifts</strong>
                <span className="text-[11px] text-slate-500 block">Mon–Sat 7am–12pm</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset("evenings")}
                className="p-3 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 transition text-left space-y-1"
              >
                <strong className="block text-slate-900 font-bold">Evenings & Weekends</strong>
                <span className="text-[11px] text-slate-500 block">5pm–9pm + Weekends</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset("flexible")}
                className="p-3 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 transition text-left space-y-1"
              >
                <strong className="block text-slate-900 font-bold">Split Shifts</strong>
                <span className="text-[11px] text-slate-500 block">Morning + Evening</span>
              </button>
            </div>
          </div>

          {/* Daily Schedule Rows */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Recurring Shifts (Local Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Add multiple time slots per day for split shifts or breaks.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={copyMondayToWeekdays}
                className="text-xs font-bold flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-[#14209C]" />
                <span>Replicate Monday to Tue–Fri</span>
              </Button>
            </div>

            <div className="space-y-6 divide-y divide-slate-100">
              {DAYS.map((dayName, dayIdx) => {
                const daySlots = getDaySlots(dayIdx);
                const isDayActive = daySlots.some((s) => s.isActive);

                return (
                  <div
                    key={dayName}
                    className="pt-6 first:pt-0 flex flex-col md:flex-row md:items-start justify-between gap-4"
                  >
                    {/* Day name & toggle */}
                    <div className="flex items-center gap-3 w-48 shrink-0">
                      <input
                        type="checkbox"
                        checked={isDayActive}
                        onChange={() => toggleDayActive(dayIdx)}
                        className="h-4 w-4 rounded text-[#14209C] focus:ring-[#14209C] cursor-pointer"
                      />
                      <div>
                        <span
                          className={`text-sm font-bold block ${
                            isDayActive ? "text-slate-900" : "text-slate-400"
                          }`}
                        >
                          {dayName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {isDayActive ? `${daySlots.length} active shift(s)` : "Unavailable"}
                        </span>
                      </div>
                    </div>

                    {/* Slots list */}
                    <div className="flex-1 space-y-2.5">
                      {isDayActive ? (
                        <>
                          {daySlots.map((slot, slotIdx) => {
                            const conflict = conflicts.get(`${dayIdx}-${slotIdx}`);
                            const sMin = timeToMinutes(slot.startTime);
                            const eMin = timeToMinutes(slot.endTime);
                            const durationStr = formatDuration(sMin, eMin);

                            return (
                              <div
                                key={slotIdx}
                                className={`p-3 rounded-2xl border transition-all ${
                                  conflict
                                    ? "bg-rose-50/70 border-rose-300 ring-1 ring-rose-200"
                                    : "bg-slate-50/70 border-slate-200/80 hover:border-slate-300"
                                }`}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 flex-1">
                                    {/* From Input */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5">
                                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        From
                                      </span>
                                      <input
                                        type="time"
                                        value={slot.startTime.slice(0, 5)}
                                        onChange={(e) =>
                                          updateSlotTime(dayIdx, slotIdx, "startTime", e.target.value)
                                        }
                                        className={`w-full sm:w-28 rounded-xl border bg-white px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 ${
                                          conflict
                                            ? "border-rose-400 focus:ring-rose-500"
                                            : "border-slate-200 focus:ring-[#14209C]"
                                        }`}
                                      />
                                    </div>

                                    <span className="hidden sm:inline text-slate-400 font-bold">–</span>

                                    {/* To Input */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5">
                                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        To
                                      </span>
                                      <input
                                        type="time"
                                        value={slot.endTime.slice(0, 5)}
                                        onChange={(e) =>
                                          updateSlotTime(dayIdx, slotIdx, "endTime", e.target.value)
                                        }
                                        className={`w-full sm:w-28 rounded-xl border bg-white px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 ${
                                          conflict
                                            ? "border-rose-400 focus:ring-rose-500"
                                            : "border-slate-200 focus:ring-[#14209C]"
                                        }`}
                                      />
                                    </div>

                                    {/* Duration Indicator */}
                                    {durationStr && !conflict && (
                                      <span className="col-span-2 sm:col-auto inline-flex items-center text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md w-fit">
                                        {durationStr}
                                      </span>
                                    )}
                                  </div>

                                  {/* Remove Button */}
                                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                                    <button
                                      type="button"
                                      onClick={() => removeSlot(dayIdx, slotIdx)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition ml-auto flex items-center gap-1 text-xs"
                                      title="Remove shift slot"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span className="sm:hidden text-[11px] font-medium text-rose-600">Remove Shift</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Inline Conflict Warning */}
                                {conflict && (
                                  <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-700 bg-rose-100/80 px-2.5 py-1.5 rounded-xl border border-rose-200">
                                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-rose-600" />
                                    <span>{conflict.message}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          <button
                            type="button"
                            onClick={() => addSlotToDay(dayIdx)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#14209C] hover:underline pt-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Another Slot for {dayName}</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 italic py-2 block">Day off</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Global Conflict Warning Banner */}
            {hasConflicts && (
              <div className="mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <span className="font-bold block text-sm text-rose-900">Scheduling Conflicts Detected</span>
                  <span className="mt-0.5 block">
                    Some shifts have overlapping hours or end before their start time. Please resolve highlighted conflicts before saving.
                  </span>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <Button
                variant="default"
                disabled={savingWeekly || hasConflicts}
                onClick={handleSaveWeekly}
                className="font-bold bg-[#14209C] hover:bg-[#0d1870] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingWeekly ? "Saving Shifts..." : "Save Working Hours"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TIME-OFF & HOLIDAYS */}
      {activeTab === "exceptions" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Holiday & Vacation Overrides
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Block specific calendar dates or partial-day hours so students cannot schedule sessions while you are away.
              </p>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={() => setIsExceptionModalOpen(true)}
              className="font-bold bg-[#14209C] text-white text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Time-Off Date</span>
            </Button>
          </div>

          {exceptions.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Palmtree className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">No active time-off blocks</h4>
              <p className="text-xs text-slate-400">
                You are available according to your standard weekly schedule.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {exceptions.map((ex) => (
                <div
                  key={ex.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 font-bold">
                      ⛔
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {formatDate(ex.date)} {ex.startTime && `(${ex.startTime.slice(0, 5)} – ${ex.endTime.slice(0, 5)})`}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {ex.reason || "Vacation / Unavailable"}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteException(ex.id)}
                    className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    <span>Delete</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BOOKING POLICIES & BUFFERS */}
      {activeTab === "policies" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Booking Buffer & Lead Time Policies
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Protect your schedule with automated breaks and minimum notice before classes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            {/* Buffer between lessons */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <label className="block font-bold text-slate-900 uppercase tracking-wider">
                Buffer Time Between Classes
              </label>
              <p className="text-[11px] text-slate-500">
                Automatic break window before and after every teaching session.
              </p>
              <select
                value={settings.bufferMinutes}
                onChange={(e) =>
                  setSettings({ ...settings, bufferMinutes: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800"
              >
                <option value={0}>0 minutes (Back to back)</option>
                <option value={5}>5 minutes quick break</option>
                <option value={10}>10 minutes standard break</option>
                <option value={15}>15 minutes break</option>
                <option value={30}>30 minutes extended break</option>
              </select>
            </div>

            {/* Minimum notice */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <label className="block font-bold text-slate-900 uppercase tracking-wider">
                Minimum Advance Notice
              </label>
              <p className="text-[11px] text-slate-500">
                How far in advance students must book before the session starts.
              </p>
              <select
                value={settings.minNoticeHours}
                onChange={(e) =>
                  setSettings({ ...settings, minNoticeHours: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800"
              >
                <option value={1}>1 hour in advance</option>
                <option value={2}>2 hours in advance</option>
                <option value={4}>4 hours in advance (Recommended)</option>
                <option value={12}>12 hours in advance</option>
                <option value={24}>24 hours (1 full day)</option>
                <option value={48}>48 hours (2 full days)</option>
              </select>
            </div>

            {/* Max Advance Booking Window */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <label className="block font-bold text-slate-900 uppercase tracking-wider">
                Maximum Future Booking Horizon
              </label>
              <p className="text-[11px] text-slate-500">
                How far into the future students can schedule classes.
              </p>
              <select
                value={settings.maxAdvanceDays}
                onChange={(e) =>
                  setSettings({ ...settings, maxAdvanceDays: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800"
              >
                <option value={7}>7 days (1 week ahead)</option>
                <option value={14}>14 days (2 weeks ahead)</option>
                <option value={30}>30 days (1 month ahead)</option>
                <option value={60}>60 days (2 months ahead)</option>
                <option value={90}>90 days (3 months ahead)</option>
              </select>
            </div>

            {/* Default Session Length */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <label className="block font-bold text-slate-900 uppercase tracking-wider">
                Default 1-on-1 Class Length
              </label>
              <p className="text-[11px] text-slate-500">
                Standard curriculum lesson length.
              </p>
              <select
                value={settings.defaultLessonDuration}
                onChange={(e) =>
                  setSettings({ ...settings, defaultLessonDuration: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800"
              >
                <option value={25}>25 minutes (Fast express session)</option>
                <option value={50}>50 minutes (Standard academic hour)</option>
                <option value={75}>75 minutes (Extended intensive)</option>
                <option value={80}>80 minutes (Double session)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button
              variant="default"
              disabled={savingSettings}
              onClick={handleSaveSettings}
              className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingSettings ? "Saving Policies..." : "Save Policies & Buffers"}</span>
            </Button>
          </div>
        </div>
      )}

      {/* TAB 4: LIVE STUDENT SLOT PREVIEW & TIMEZONE TESTER */}
      {activeTab === "preview" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#14209C]" />
                <span>Live Student Booking Simulator</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate how students in different world timezones see your open booking slots.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadPreview}
              className="text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${previewLoading ? "animate-spin" : ""}`} />
              <span>Recalculate Slots</span>
            </Button>
          </div>

          {/* Timezone & Date Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Select Test Date
              </label>
              <Input
                type="date"
                value={previewDate}
                onChange={(e) => setPreviewDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Simulate Student Timezone
              </label>
              <select
                value={previewTz}
                onChange={(e) => setPreviewTz(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800"
              >
                {WORLD_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Slots Output */}
          {previewLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !previewData || previewData.isBlocked ? (
            <div className="p-8 rounded-2xl bg-amber-50/70 border border-amber-100 text-center space-y-1">
              <span className="text-sm font-bold text-amber-900 block">⛔ Date Blocked from Bookings</span>
              <p className="text-xs text-amber-700">
                You have a holiday/time-off exception registered for {formatDate(previewDate)}.
              </p>
            </div>
          ) : previewData.slots.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 text-center space-y-1">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <span className="text-sm font-bold text-slate-700 block">No Available Slots on this Date</span>
              <p className="text-xs text-slate-400">
                Check your weekly working hours to ensure shifts are enabled for this day of the week.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">
                  {previewData.slots.filter((s: any) => s.available).length} Open Slot(s) Found
                </span>
                <span className="text-slate-400 text-[11px]">
                  Duration: {settings.defaultLessonDuration}m · Buffer: {settings.bufferMinutes}m
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {previewData.slots.map((slot: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      slot.available
                        ? "bg-emerald-50/60 border-emerald-200 text-emerald-900 font-bold"
                        : "bg-slate-100 border-slate-200 text-slate-400 line-through text-xs"
                    }`}
                  >
                    <span className="text-xs font-mono">{slot.time}</span>
                    <span className="text-[10px] block font-normal opacity-80">
                      {slot.available ? "Open" : "Booked"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Time-Off Exception Modal */}
      <Modal
        isOpen={isExceptionModalOpen}
        onClose={() => setIsExceptionModalOpen(false)}
        title="Add Vacation / Time-Off Block"
        description="Select a date and choose whether to block the whole day or partial hours."
      >
        <form onSubmit={handleAddException} className="space-y-4 pt-2 text-slate-900">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Date (YYYY-MM-DD)
            </label>
            <Input
              type="date"
              required
              value={newExceptionDate}
              onChange={(e) => setNewExceptionDate(e.target.value)}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAllDayException}
                onChange={(e) => setIsAllDayException(e.target.checked)}
                className="h-4 w-4 rounded text-[#14209C] focus:ring-[#14209C]"
              />
              <span className="text-xs font-bold text-slate-800">Block Entire Day</span>
            </label>
          </div>

          {!isAllDayException && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Start Time</label>
                <Input
                  type="time"
                  value={exceptionStartTime}
                  onChange={(e) => setExceptionStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">End Time</label>
                <Input
                  type="time"
                  value={exceptionEndTime}
                  onChange={(e) => setExceptionEndTime(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Reason / Label (e.g. Conference, Family Event)
            </label>
            <Input
              placeholder="e.g. Cambridge ELT Annual Conference"
              value={newExceptionReason}
              onChange={(e) => setNewExceptionReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsExceptionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" type="submit" className="font-bold bg-[#14209C] text-white">
              Block Time-Off
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
