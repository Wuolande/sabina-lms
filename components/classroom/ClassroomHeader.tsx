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
  MonitorUp,
  MonitorOff,
  Wifi,
  Radio,
  ShieldCheck,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
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
  durationMinutes?: number;
  isTrial?: boolean;
  endButtonLabel?: string;
  // Media controls
  isMicEnabled?: boolean;
  isCameraEnabled?: boolean;
  isScreenSharing?: boolean;
  onToggleMic?: () => void;
  onToggleCamera?: () => void;
  onToggleScreenShare?: () => void;
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
  durationMinutes = 50,
  isTrial = false,
  endButtonLabel = "End Class",
  isMicEnabled = true,
  isCameraEnabled = true,
  isScreenSharing = false,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
}: ClassroomHeaderProps) {
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isEndingSoon = secondsRemaining < 300 && secondsRemaining > 0;

  return (
    <header className="flex h-14 w-full items-center justify-between border-b border-slate-800 bg-slate-900/90 px-3 sm:px-4 backdrop-blur-md shrink-0 select-none z-30 text-white">
      {/* ─── LEFT: Lesson Title & Tutor/Student Info ─── */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-heading font-black text-sm text-white tracking-tight truncate max-w-[200px] sm:max-w-xs">
              {lessonTitle}
            </span>
            <Badge
              variant="subtle"
              size="sm"
              className={
                isTrial
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] font-bold"
                  : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px] font-bold"
              }
            >
              {isTrial ? `🎁 Trial (${durationMinutes}m)` : `${durationMinutes}m`}
            </Badge>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            {tutorName} {studentName ? `• ${studentName}` : ""}
          </span>
        </div>
      </div>

      {/* ─── CENTER: Layout Switcher & Class Countdown ─── */}
      <div className="hidden md:flex items-center gap-3">
        {/* Layout Mode Switcher */}
        <div className="flex items-center bg-slate-950/80 rounded-xl p-0.5 border border-slate-800 text-slate-400">
          <button
            type="button"
            onClick={() => onChangeLayout("classin_stage")}
            title="ClassIn Stage (Top Videos + Wide Board)"
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
            title="Dual Stage (Split View)"
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

          {isScreenSharing && (
            <button
              type="button"
              onClick={() => onChangeLayout("screenshare")}
              title="Screen Share Presentation"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                layoutMode === "screenshare"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "hover:text-white hover:bg-slate-800"
              }`}
            >
              <Monitor className="h-3.5 w-3.5 text-sky-400" />
              <span className="text-[11px]">Screen Share</span>
            </button>
          )}
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

      {/* ─── RIGHT: Media Controls, Settings & End Call ─── */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Mic Toggle Button */}
        {onToggleMic && (
          <button
            type="button"
            onClick={onToggleMic}
            title={isMicEnabled ? "Mute Microphone" : "Unmute Microphone"}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
              isMicEnabled
                ? "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
                : "bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/30"
            }`}
          >
            {isMicEnabled ? <Mic className="h-3.5 w-3.5 text-emerald-400" /> : <MicOff className="h-3.5 w-3.5" />}
            <span className="hidden xl:inline text-[11px]">{isMicEnabled ? "Mute" : "Unmute"}</span>
          </button>
        )}

        {/* Video Toggle Button */}
        {onToggleCamera && (
          <button
            type="button"
            onClick={onToggleCamera}
            title={isCameraEnabled ? "Stop Camera" : "Start Camera"}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
              isCameraEnabled
                ? "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
                : "bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/30"
            }`}
          >
            {isCameraEnabled ? <VideoIcon className="h-3.5 w-3.5 text-emerald-400" /> : <VideoOff className="h-3.5 w-3.5" />}
            <span className="hidden xl:inline text-[11px]">{isCameraEnabled ? "Stop Cam" : "Start Cam"}</span>
          </button>
        )}

        {/* Screen Share Button */}
        {onToggleScreenShare && (
          <button
            type="button"
            onClick={onToggleScreenShare}
            title={isScreenSharing ? "Stop Sharing Screen" : "Share Your Screen"}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
              isScreenSharing
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700"
            }`}
          >
            {isScreenSharing ? <MonitorOff className="h-3.5 w-3.5" /> : <MonitorUp className="h-3.5 w-3.5" />}
            <span className="hidden xl:inline text-[11px]">{isScreenSharing ? "Stop Share" : "Share"}</span>
          </button>
        )}

        <div className="h-4 w-px bg-slate-800 mx-0.5" />

        {/* Device Settings Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          title="Audio & Video Device Settings"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition"
        >
          <Settings className="h-4 w-4" />
        </button>

        {/* End Class / Leave Room Button */}
        <Button
          variant="default"
          size="sm"
          onClick={onEndLesson}
          className={`${
            endButtonLabel.includes("Leave")
              ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm"
              : "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20"
          } font-extrabold text-xs flex items-center gap-1.5`}
        >
          <PhoneOff className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{endButtonLabel}</span>
        </Button>
      </div>
    </header>
  );
}
