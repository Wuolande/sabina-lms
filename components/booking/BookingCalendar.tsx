"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  Sun,
  Sunrise,
  Sunset,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { utcToLocalDateString } from "@/src/shared/utils/timezone";

export interface TimeSlot {
  time: string; // e.g. "09:00"
  utcStartTime: string; // ISO 8601 UTC timestamp
  utcEndTime: string;
  period: "morning" | "afternoon" | "evening";
  available: boolean;
  reason?: string;
  isPopular?: boolean;
}

interface BookingCalendarProps {
  selectedDate: string; // "YYYY-MM-DD"
  selectedTime: string; // "HH:MM"
  onSelectSlot: (date: string, time: string, utcStartTime?: string) => void;
  durationMinutes?: number;
  tutorSlug?: string;
  tutorId?: string;
  tutorTimezone?: string;
  initialTimezone?: string;
  onTimezoneChange?: (tz: string) => void;
}

export function BookingCalendar({
  selectedDate,
  selectedTime,
  onSelectSlot,
  durationMinutes = 50,
  tutorSlug,
  tutorId,
  tutorTimezone,
  initialTimezone,
  onTimezoneChange,
}: BookingCalendarProps) {
  const [weekOffset, setWeekOffset] = React.useState(0);
  const [timeFilter, setTimeFilter] = React.useState<"all" | "morning" | "afternoon" | "evening">("all");
  const [timezone, setTimezone] = React.useState(() => {
    if (initialTimezone) return initialTimezone;
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  });

  const [slots, setSlots] = React.useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  // Sync external timezone changes if passed
  React.useEffect(() => {
    if (initialTimezone && initialTimezone !== timezone) {
      setTimezone(initialTimezone);
    }
  }, [initialTimezone]);

  const handleTimezoneSelect = (newTz: string) => {
    setTimezone(newTz);
    onTimezoneChange?.(newTz);
  };

  // Generate 7 days for current weekOffset in viewer's timezone
  const weekDays = React.useMemo(() => {
    const days = [];
    const now = new Date();
    // Today's date string in the selected timezone
    const todayStr = utcToLocalDateString(now, timezone);
    const [tY, tM, tD] = todayStr.split("-").map(Number);
    const baseDate = new Date(Date.UTC(tY, tM - 1, tD, 12, 0, 0));

    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(baseDate.getDate() + weekOffset * 7);

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      const isPast = iso < todayStr;
      const isToday = iso === todayStr;

      days.push({
        date: d,
        iso,
        dayName: d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
        dayNumber: d.getUTCDate(),
        monthName: d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
        isPast,
        isToday,
      });
    }
    return days;
  }, [weekOffset, timezone]);

  const activeDate = selectedDate || weekDays.find((d) => !d.isPast)?.iso || weekDays[0]?.iso || "";

  // Fetch real slots whenever activeDate, timezone, duration, or tutor changes
  React.useEffect(() => {
    const targetIdentifier = tutorSlug || tutorId;
    if (!targetIdentifier || !activeDate) return;

    let isSubscribed = true;
    setIsLoadingSlots(true);
    setFetchError(null);

    const params = new URLSearchParams({
      date: activeDate,
      tz: timezone,
      duration: String(durationMinutes),
    });

    fetch(`/api/tutors/${targetIdentifier}/slots?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (!isSubscribed) return;
        const fetchedSlots: TimeSlot[] = (data.slots || []).map((s: any) => ({
          time: s.time,
          utcStartTime: s.utcStartTime,
          utcEndTime: s.utcEndTime,
          period: s.period || "morning",
          available: s.available ?? true,
          reason: s.reason,
          isPopular: s.period === "afternoon" || s.period === "evening",
        }));
        setSlots(fetchedSlots);

        // If currently selected slot is not available or not in slots, auto-select first available
        if (fetchedSlots.length > 0) {
          const matching = fetchedSlots.find((s) => s.time === selectedTime && s.available);
          if (!matching) {
            const firstAvail = fetchedSlots.find((s) => s.available);
            if (firstAvail) {
              onSelectSlot(activeDate, firstAvail.time, firstAvail.utcStartTime);
            }
          }
        }
      })
      .catch((err: any) => {
        if (!isSubscribed) return;
        console.error("[BookingCalendar] Error fetching slots:", err);
        setFetchError("Unable to load real-time slots. Please try another date.");
        setSlots([]);
      })
      .finally(() => {
        if (isSubscribed) setIsLoadingSlots(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [activeDate, timezone, durationMinutes, tutorSlug, tutorId]);

  const filteredSlots = slots.filter((slot) => {
    if (timeFilter === "all") return true;
    return slot.period === timeFilter;
  });

  const formatEndTime = (startTime: string, dur: number) => {
    if (!startTime) return "";
    const [h, m] = startTime.split(":").map(Number);
    const totalMinutes = h * 60 + m + dur;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    return `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;
  };

  const selectedDateParts = activeDate ? activeDate.split("-").map(Number) : [];
  const selectedDateFormatted = selectedDateParts.length === 3
    ? new Date(Date.UTC(selectedDateParts[0], selectedDateParts[1] - 1, selectedDateParts[2], 12)).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      })
    : "Select Date";

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs">
      
      {/* ── Header: Month & Week Navigation + Timezone ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekOffset((prev) => Math.max(0, prev - 1))}
            disabled={weekOffset === 0}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Previous Week"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <span className="text-sm font-bold text-slate-900 font-heading">
            {weekDays[0]?.monthName} {weekDays[0]?.date.getUTCFullYear()}
            {weekDays[0]?.monthName !== weekDays[6]?.monthName && ` - ${weekDays[6]?.monthName}`}
          </span>

          <button
            type="button"
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
            title="Next Week"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {weekOffset > 0 && (
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className="text-xs font-semibold text-brand hover:underline ml-1"
            >
              Today
            </button>
          )}
        </div>

        {/* Timezone Selector */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Globe className="h-3.5 w-3.5 text-brand shrink-0" />
          <span className="font-semibold text-slate-700">Your Timezone:</span>
          <select
            value={timezone}
            onChange={(e) => handleTimezoneSelect(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50/80 px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
          >
            <option value={timezone}>{timezone} (Current)</option>
            <option value="America/New_York">New York (EDT/EST, UTC-4)</option>
            <option value="America/Chicago">Chicago (CDT/CST, UTC-5)</option>
            <option value="America/Los_Angeles">Los Angeles (PDT/PST, UTC-7)</option>
            <option value="Europe/London">London (BST/GMT, UTC+1)</option>
            <option value="Europe/Paris">Paris / Berlin (CEST/CET, UTC+2)</option>
            <option value="Asia/Dubai">Dubai (GST, UTC+4)</option>
            <option value="Asia/Singapore">Singapore / Hong Kong (SGT, UTC+8)</option>
            <option value="Asia/Tokyo">Tokyo (JST, UTC+9)</option>
            <option value="Australia/Sydney">Sydney (AEST, UTC+10)</option>
            <option value="UTC">UTC (Universal Time Coordinated)</option>
          </select>
        </div>
      </div>

      {/* ── Week Days Carousel Grid ── */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {weekDays.map((d) => {
          const isSelected = activeDate === d.iso;
          return (
            <button
              key={d.iso}
              type="button"
              disabled={d.isPast}
              onClick={() => onSelectSlot(d.iso, selectedTime || "")}
              className={`p-1.5 sm:p-3 rounded-xl sm:rounded-2xl border text-center transition-all relative cursor-pointer ${
                isSelected
                  ? "border-brand bg-brand text-white shadow-md font-bold scale-[1.02]"
                  : d.isPast
                  ? "border-slate-100 bg-slate-50/50 text-slate-300 cursor-not-allowed"
                  : "border-slate-200/80 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50/60"
              }`}
            >
              {d.isToday && !isSelected && (
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-brand" />
              )}
              <span className={`block text-[10px] uppercase font-bold tracking-wider ${
                isSelected ? "text-white/80" : "text-slate-400"
              }`}>
                {d.dayName}
              </span>
              <span className={`text-sm sm:text-base font-black mt-0.5 block ${
                isSelected ? "text-white" : "text-slate-800"
              }`}>
                {d.dayNumber}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Time Filter Tabs & Date Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTimeFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              timeFilter === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            All Day ({slots.filter((s) => s.available).length})
          </button>
          <button
            type="button"
            onClick={() => setTimeFilter("morning")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              timeFilter === "morning"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            <Sunrise className="h-3.5 w-3.5 text-amber-500" />
            <span>Morning</span>
          </button>
          <button
            type="button"
            onClick={() => setTimeFilter("afternoon")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              timeFilter === "afternoon"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            <Sun className="h-3.5 w-3.5 text-amber-500" />
            <span>Afternoon</span>
          </button>
          <button
            type="button"
            onClick={() => setTimeFilter("evening")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              timeFilter === "evening"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            <Sunset className="h-3.5 w-3.5 text-indigo-400" />
            <span>Evening</span>
          </button>
        </div>

        <span className="text-xs text-slate-500 font-semibold">
          {selectedDateFormatted}
        </span>
      </div>

      {/* ── Time Slots Grid ── */}
      <div>
        {isLoadingSlots ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((idx) => (
              <div
                key={idx}
                className="h-14 rounded-xl bg-slate-100 border border-slate-200/60 animate-pulse"
              />
            ))}
          </div>
        ) : fetchError ? (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{fetchError}</span>
          </div>
        ) : filteredSlots.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
            <Clock className="h-8 w-8 text-slate-300 mx-auto" />
            <span className="text-xs sm:text-sm font-bold text-slate-700 block">
              No Open Slots on {selectedDateFormatted}
            </span>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              This tutor has no bookable hours scheduled on this date in your selected timezone ({timezone}). Please choose another date or change time filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {filteredSlots.map((slot) => {
              const isSelected = selectedTime === slot.time && slot.available;
              return (
                <button
                  key={slot.time + slot.utcStartTime}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => onSelectSlot(activeDate, slot.time, slot.utcStartTime)}
                  className={`min-h-[48px] py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all relative flex flex-col items-center justify-center gap-0.5 active:scale-[0.98] ${
                    !slot.available
                      ? "border-slate-100 bg-slate-50/60 text-slate-300 line-through cursor-not-allowed"
                      : isSelected
                      ? "border-brand bg-brand-50/70 text-brand ring-2 ring-brand font-bold shadow-xs cursor-pointer"
                      : "border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50/70 cursor-pointer"
                  }`}
                  title={slot.available ? "Click to select slot" : slot.reason || "Slot unavailable"}
                >
                  {slot.isPopular && slot.available && !isSelected && (
                    <span className="absolute -top-2 px-1.5 py-0.2 rounded-full bg-amber-100 border border-amber-300/70 text-[9px] font-extrabold text-amber-900 tracking-tight">
                      OPEN
                    </span>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Clock className={`h-3.5 w-3.5 ${isSelected ? "text-brand" : slot.available ? "text-slate-400" : "text-slate-300"}`} />
                    <span>{slot.time}</span>
                  </div>
                  <span className={`text-[10px] ${
                    !slot.available
                      ? "text-slate-400 no-underline font-normal"
                      : isSelected
                      ? "text-brand font-semibold"
                      : "text-slate-400"
                  }`}>
                    {slot.available ? `until ${formatEndTime(slot.time, durationMinutes)}` : (slot.reason?.includes("Notice") ? "Notice req." : "Booked")}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Selected Slot Status Banner ── */}
      {activeDate && selectedTime && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand shrink-0">
              <Check className="h-4 w-4" />
            </div>
            <div className="truncate">
              <p className="font-bold text-slate-900 truncate">
                {selectedDateFormatted}
              </p>
              <p className="text-slate-500 font-medium truncate">
                {selectedTime} – {formatEndTime(selectedTime, durationMinutes)} ({durationMinutes}m · <span className="font-mono text-slate-700">{timezone}</span>)
              </p>
            </div>
          </div>
          <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md shrink-0">
            Slot Selected
          </span>
        </div>
      )}

    </div>
  );
}
