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
} from "lucide-react";

export interface TimeSlot {
  time: string; // e.g. "09:00"
  period: "morning" | "afternoon" | "evening";
  isPopular?: boolean;
}

interface BookingCalendarProps {
  selectedDate: string; // "YYYY-MM-DD"
  selectedTime: string; // "HH:MM"
  onSelectSlot: (date: string, time: string) => void;
  durationMinutes?: number;
}

export function BookingCalendar({
  selectedDate,
  selectedTime,
  onSelectSlot,
  durationMinutes = 50,
}: BookingCalendarProps) {
  const [weekOffset, setWeekOffset] = React.useState(0);
  const [timeFilter, setTimeFilter] = React.useState<"all" | "morning" | "afternoon" | "evening">("all");
  const [timezone, setTimezone] = React.useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "UTC";
    }
  });

  // Generate 7 days for current weekOffset
  const weekDays = React.useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() + weekOffset * 7);

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const isPast = d.getTime() < today.getTime();
      const isToday = d.toDateString() === today.toDateString();
      const iso = d.toISOString().split("T")[0];

      days.push({
        date: d,
        iso,
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        dayNumber: d.getDate(),
        monthName: d.toLocaleDateString("en-US", { month: "short" }),
        isPast,
        isToday,
      });
    }
    return days;
  }, [weekOffset]);

  const initializedRef = React.useRef(false);
  React.useEffect(() => {
    if (!initializedRef.current && !selectedDate && weekDays.length > 0) {
      initializedRef.current = true;
      const firstValid = weekDays.find((d) => !d.isPast) || weekDays[0];
      if (firstValid) {
        onSelectSlot(firstValid.iso, "14:00");
      }
    }
  }, [weekDays, selectedDate, onSelectSlot]);

  // Mock realistic dynamic slots for any chosen date
  const getSlotsForDate = (dateIso: string): TimeSlot[] => {
    // Generate deterministic schedule based on date string hash
    const hash = dateIso.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const dayOfWeek = new Date(dateIso).getDay();

    // Weekend vs Weekday schedule
    if (dayOfWeek === 0) {
      // Sunday
      return [
        { time: "10:00", period: "morning" },
        { time: "11:30", period: "morning" },
        { time: "14:00", period: "afternoon", isPopular: true },
        { time: "15:30", period: "afternoon" },
        { time: "17:00", period: "evening" },
      ];
    }

    const allSlots: TimeSlot[] = [
      { time: "08:30", period: "morning" },
      { time: "09:30", period: "morning" },
      { time: "10:45", period: "morning" },
      { time: "12:00", period: "afternoon" },
      { time: "13:30", period: "afternoon", isPopular: hash % 2 === 0 },
      { time: "15:00", period: "afternoon", isPopular: true },
      { time: "16:30", period: "afternoon" },
      { time: "18:00", period: "evening", isPopular: hash % 3 === 0 },
      { time: "19:15", period: "evening" },
      { time: "20:30", period: "evening" },
    ];

    return allSlots;
  };

  const currentSlots = getSlotsForDate(selectedDate || weekDays[0]?.iso || "");
  const filteredSlots = currentSlots.filter((slot) => {
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

  const selectedDateObj = selectedDate ? new Date(selectedDate) : new Date();
  const selectedDateFormatted = selectedDateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

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
            {weekDays[0]?.monthName} {weekDays[0]?.date.getFullYear()}
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
              className="text-xs font-semibold text-emerald-700 hover:underline ml-1"
            >
              Today
            </button>
          )}
        </div>

        {/* Timezone Selector */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Globe className="h-3.5 w-3.5 text-slate-400" />
          <span>Timezone:</span>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50/80 px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value={timezone}>{timezone} (Local)</option>
            <option value="UTC">UTC (Universal)</option>
            <option value="America/New_York">New York (EST/EDT)</option>
            <option value="Europe/London">London (GMT/BST)</option>
            <option value="Asia/Dubai">Dubai (GST)</option>
            <option value="Asia/Singapore">Singapore (SGT)</option>
            <option value="Asia/Tokyo">Tokyo (JST)</option>
          </select>
        </div>
      </div>

      {/* ── Week Days Carousel Grid ── */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {weekDays.map((d) => {
          const isSelected = selectedDate === d.iso;
          return (
            <button
              key={d.iso}
              type="button"
              disabled={d.isPast}
              onClick={() => onSelectSlot(d.iso, selectedTime || "14:00")}
              className={`p-2.5 sm:p-3 rounded-2xl border text-center transition-all relative ${
                isSelected
                  ? "border-slate-950 bg-slate-950 text-white shadow-md font-bold scale-[1.02]"
                  : d.isPast
                  ? "border-slate-100 bg-slate-50/50 text-slate-300 cursor-not-allowed"
                  : "border-slate-200/80 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50/60"
              }`}
            >
              {d.isToday && !isSelected && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
              )}
              <span className={`text-[11px] block uppercase font-semibold ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                {d.dayName}
              </span>
              <span className="text-base sm:text-lg font-black block my-0.5 font-heading">
                {d.dayNumber}
              </span>
              <span className={`text-[10px] block font-medium ${isSelected ? "text-emerald-400" : "text-slate-400"}`}>
                {d.isPast ? "Past" : "Open"}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Time Period Filter Tabs ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTimeFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeFilter === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            All Day ({currentSlots.length})
          </button>
          <button
            type="button"
            onClick={() => setTimeFilter("morning")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
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
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
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
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
              timeFilter === "evening"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            <Sunset className="h-3.5 w-3.5 text-indigo-400" />
            <span>Evening</span>
          </button>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          {selectedDateFormatted}
        </span>
      </div>

      {/* ── Time Slots Grid ── */}
      <div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {filteredSlots.map((slot) => {
            const isSelected = selectedTime === slot.time;
            return (
              <button
                key={slot.time}
                type="button"
                onClick={() => onSelectSlot(selectedDate, slot.time)}
                className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all relative flex flex-col items-center justify-center gap-0.5 ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600 font-bold shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50/70"
                }`}
              >
                {slot.isPopular && !isSelected && (
                  <span className="absolute -top-2 px-1.5 py-0.2 rounded-full bg-amber-100 border border-amber-300/70 text-[9px] font-extrabold text-amber-900 tracking-tight">
                    POPULAR
                  </span>
                )}
                <div className="flex items-center gap-1.5">
                  <Clock className={`h-3.5 w-3.5 ${isSelected ? "text-emerald-700" : "text-slate-400"}`} />
                  <span>{slot.time}</span>
                </div>
                <span className={`text-[10px] ${isSelected ? "text-emerald-700 font-semibold" : "text-slate-400"}`}>
                  until {formatEndTime(slot.time, durationMinutes)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Selected Slot Status Banner ── */}
      {selectedDate && selectedTime && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
              <Check className="h-4 w-4" />
            </div>
            <div className="truncate">
              <p className="font-bold text-slate-900 truncate">
                {selectedDateFormatted}
              </p>
              <p className="text-slate-500 font-medium truncate">
                {selectedTime} – {formatEndTime(selectedTime, durationMinutes)} ({durationMinutes} min session)
              </p>
            </div>
          </div>
          <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md shrink-0">
            Slot Available
          </span>
        </div>
      )}

    </div>
  );
}
