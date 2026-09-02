"use client";

import * as React from "react";
import {
  Clock,
  PhoneOff,
  Settings,
  Layout,
  Columns,
  Grid as GridIcon,
  Monitor,
  Wifi,
  Radio,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export type StageLayoutMode = "classin_stage" | "split" | "grid" | "screenshare";

interface ClassroomHeaderProps {
  lessonTitle: string;
  tutorName: string;
  studentName?: string;
  secondsRemaining: number;
  layoutMode: StageLayoutMode;
  onChangeLayout: (mode: StageLayoutMode) => void;
  onOpenSettings: () => void;
  onEndLesson: () => void;
  latencyMs?: number;
}

export function ClassroomHeader({
  lessonTitle,
  tutorName,
  studentName,
  secondsRemaining,
  layoutMode,
  onChangeLayout,
  onOpenSettings,
  onEndLesson,
  latencyMs = 28,
}: ClassroomHeaderProps) {
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const isEndingSoon = secondsRemaining <= 300 && secondsRemaining > 0; // < 5 mins

  return (
    <header className="flex h-14 w-full items-center justify-between border-b border-slate-800 bg-slate-900/95 px-3 sm:px-5 shrink-0 select-none text-white">
      {/* ─── LEFT: Status, Lesson Info ─── */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        <Badge
          variant="subtle"
          size="sm"
          className="bg-rose-500/20 text-rose-300 border-rose-500/30 flex items-center gap-1.5 animate-pulse"
        >
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          <span className="font-black text-[10px] tracking-wider uppercase">LIVE CLASS</span>
        </Badge>

        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        <div className="min-w-0">
          <h2 className="text-xs sm:text-sm font-black text-white leading-tight truncate max-w-[140px] sm:max-w-xs font-heading">
            {lessonTitle}
          </h2>
          <span className="text-[10px] text-slate-400 font-medium block truncate">
            {tutorName} {studentName ? `• ${studentName}` : ""}
          </span>
        </div>
      </div>

      {/* ─── CENTER: Layout Switcher & Lesson Timer ─── */}
      <div className="flex items-center gap-3">
        {/* Stage Layout Switcher */}
        <div className="hidden md:flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-slate-400">
          <button
            type="button"
            onClick={() => onChangeLayout("classin_stage")}
            title="ClassIn Stage (Top Video + Large Whiteboard)"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              layoutMode === "classin_stage"
                ? "bg-indigo-600 text-white shadow-xs"
                : "hover:text-white hover:bg-slate-800"
            }`}
          >
            <Layout className="h-3.5 w-3.5" />
            <span className="text-[11px]">ClassIn Stage</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeLayout("split")}
            title="Side-by-Side Dual Stage (50/50 Split)"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              layoutMode === "split"
                ? "bg-indigo-600 text-white shadow-xs"
                : "hover:text-white hover:bg-slate-800"
            }`}
          >
            <Columns className="h-3.5 w-3.5" />
            <span className="text-[11px]">Dual Stage</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeLayout("grid")}
            title="Video Grid (Focus on Participants)"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              layoutMode === "grid"
                ? "bg-indigo-600 text-white shadow-xs"
                : "hover:text-white hover:bg-slate-800"
            }`}
          >
            <GridIcon className="h-3.5 w-3.5" />
            <span className="text-[11px]">Video Grid</span>
          </button>
        </div>

        {/* Live Lesson Countdown Timer */}
        <div
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 border transition ${
            isEndingSoon
              ? "bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse"
              : "bg-slate-950/80 border-slate-800 text-slate-200"
          }`}
          title={isEndingSoon ? "Less than 5 minutes remaining in this class" : "Lesson Time Remaining"}
        >
          <Clock className={`h-3.5 w-3.5 ${isEndingSoon ? "text-rose-400" : "text-indigo-400"}`} />
          <span className="font-mono text-xs font-bold tracking-wider">
            {formatTimer(secondsRemaining)}
          </span>
        </div>
      </div>

      {/* ─── RIGHT: Signal Quality, Device Settings & End Call ─── */}
      <div className="flex items-center gap-2">
        {/* Network Quality Badge */}
        <div
          className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full"
          title={`Connection status: Ultra-low latency (${latencyMs}ms)`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
          <Wifi className="h-3 w-3" />
          <span>{latencyMs}ms</span>
        </div>

        {/* Device Settings Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          title="Audio & Video Device Settings"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition"
        >
          <Settings className="h-4 w-4" />
        </button>

        {/* End Class Button */}
        <Button
          variant="default"
          size="sm"
          onClick={onEndLesson}
          className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/20"
        >
          <PhoneOff className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">End Class</span>
        </Button>
      </div>
    </header>
  );
}
