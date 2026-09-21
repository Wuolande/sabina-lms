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
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  MessageSquare,
  ChevronDown,
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
  // Tutor extensions
  isTutor?: boolean;
  onExtendLesson?: (minutes: number) => void;
  isExtending?: boolean;
  // Mobile sidebar integration
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
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
  durationMinutes = 50,
  isTrial = false,
  endButtonLabel = "End Class",
  isMicEnabled = true,
  isCameraEnabled = true,
  isScreenSharing = false,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  isTutor = false,
  onExtendLesson,
  isExtending = false,
  onToggleSidebar,
  sidebarOpen = false,
}: ClassroomHeaderProps) {
  const isOvertime = secondsRemaining <= 0;
  const isEndingSoon = secondsRemaining < 300 && secondsRemaining > 0;

  const formatTimer = (totalSeconds: number) => {
    const absSeconds = Math.abs(totalSeconds);
    const mins = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    const formatted = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    return totalSeconds < 0 ? `+${formatted}` : formatted;
  };

  const [isExtendMenuOpen, setIsExtendMenuOpen] = React.useState(false);
  const [isMobileLayoutMenuOpen, setIsMobileLayoutMenuOpen] = React.useState(false);

  return (
    <header className="flex h-13 sm:h-14 w-full items-center justify-between border-b border-slate-800 bg-slate-900/95 px-2.5 sm:px-4 backdrop-blur-md shrink-0 select-none z-30 text-white">
      {/* ─── LEFT: Lesson Title & Tutor/Student Info ─── */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-heading font-black text-xs sm:text-sm text-white tracking-tight truncate max-w-[120px] sm:max-w-[200px] md:max-w-xs">
              {lessonTitle}
            </span>
            <Badge
              variant="subtle"
              size="sm"
              className={
                isTrial
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30 text-[9px] sm:text-[10px] font-bold px-1.5 py-0"
                  : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[9px] sm:text-[10px] font-bold px-1.5 py-0"
              }
            >
              {isTrial ? `🎁 ${durationMinutes}m` : `${durationMinutes}m`}
            </Badge>
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate max-w-[120px] sm:max-w-none hidden xs:inline">
            {tutorName} {studentName ? `• ${studentName}` : ""}
          </span>
        </div>
      </div>

      {/* ─── CENTER: Layout Switcher & Class Countdown (Always Visible!) ─── */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Desktop Layout Mode Switcher */}
        <div className="hidden md:flex items-center bg-slate-950/80 rounded-xl p-0.5 border border-slate-800 text-slate-400">
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

        {/* Mobile Layout Switcher Dropdown */}
        <div className="relative md:hidden">
          <button
            type="button"
            onClick={() => setIsMobileLayoutMenuOpen(!isMobileLayoutMenuOpen)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-bold"
          >
            {layoutMode === "grid" ? (
              <GridIcon className="h-3 w-3 text-indigo-400" />
            ) : layoutMode === "split" ? (
              <Columns className="h-3 w-3 text-indigo-400" />
            ) : (
              <Layout className="h-3 w-3 text-indigo-400" />
            )}
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {isMobileLayoutMenuOpen && (
            <div className="absolute top-full mt-1 left-0 z-50 flex flex-col bg-slate-900 border border-slate-700 rounded-xl p-1 shadow-2xl min-w-[130px] animate-in fade-in zoom-in-95">
              <button
                type="button"
                onClick={() => {
                  onChangeLayout("classin_stage");
                  setIsMobileLayoutMenuOpen(false);
                }}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold transition ${
                  layoutMode === "classin_stage" ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Layout className="h-3.5 w-3.5" />
                <span>Stage (Board+Cam)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeLayout("grid");
                  setIsMobileLayoutMenuOpen(false);
                }}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold transition ${
                  layoutMode === "grid" ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <GridIcon className="h-3.5 w-3.5" />
                <span>Video Focus</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeLayout("split");
                  setIsMobileLayoutMenuOpen(false);
                }}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold transition ${
                  layoutMode === "split" ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Columns className="h-3.5 w-3.5" />
                <span>Split View</span>
              </button>
            </div>
          )}
        </div>

        {/* Live Lesson Countdown Timer (Visible on all devices!) */}
        <div className="flex items-center gap-1.5">
          <div
            className={`flex items-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 border transition ${
              isOvertime
                ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                : isEndingSoon
                ? "bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse"
                : "bg-slate-950/80 border-slate-800 text-slate-200"
            }`}
            title={
              isOvertime
                ? "Class in Overtime"
                : isEndingSoon
                ? "Less than 5 minutes remaining in this class"
                : "Lesson Time Remaining"
            }
          >
            <Clock
              className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${
                isOvertime ? "text-amber-400" : isEndingSoon ? "text-rose-400" : "text-indigo-400"
              }`}
            />
            <span className="font-mono text-[11px] sm:text-xs font-bold tracking-wider">
              {formatTimer(secondsRemaining)}
              {isOvertime && <span className="text-[9px] font-extrabold uppercase ml-1 hidden xs:inline">Overtime</span>}
            </span>
          </div>

          {/* Tutor Live Time Extension Button & Dropdown */}
          {isTutor && onExtendLesson && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsExtendMenuOpen(!isExtendMenuOpen)}
                disabled={isExtending}
                title="Extend lesson duration"
                className="flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 transition"
              >
                <span>{isExtending ? "..." : "+Ext"}</span>
              </button>

              {isExtendMenuOpen && (
                <div className="absolute top-full mt-1.5 left-0 z-50 flex flex-col bg-slate-900 border border-slate-700 rounded-xl p-1 shadow-2xl min-w-[120px] animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 border-b border-slate-800">
                    Add Class Time:
                  </div>
                  {[5, 10, 15].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        setIsExtendMenuOpen(false);
                        onExtendLesson(mins);
                      }}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-200 hover:text-white hover:bg-indigo-600 transition text-left"
                    >
                      <span>+{mins} minutes</span>
                      <span className="text-[10px] text-indigo-300 font-normal">free</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── RIGHT: Media Controls, Chat Toggle & End Call ─── */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Mic Toggle Button */}
        {onToggleMic && (
          <button
            type="button"
            onClick={onToggleMic}
            title={isMicEnabled ? "Mute Microphone" : "Unmute Microphone"}
            className={`flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold transition ${
              isMicEnabled
                ? "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
                : "bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/30"
            }`}
          >
            {isMicEnabled ? <Mic className="h-3.5 w-3.5 text-emerald-400" /> : <MicOff className="h-3.5 w-3.5" />}
            <span className="hidden xl:inline text-[11px] ml-1">{isMicEnabled ? "Mute" : "Unmute"}</span>
          </button>
        )}

        {/* Video Toggle Button */}
        {onToggleCamera && (
          <button
            type="button"
            onClick={onToggleCamera}
            title={isCameraEnabled ? "Stop Camera" : "Start Camera"}
            className={`flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold transition ${
              isCameraEnabled
                ? "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
                : "bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/30"
            }`}
          >
            {isCameraEnabled ? <VideoIcon className="h-3.5 w-3.5 text-emerald-400" /> : <VideoOff className="h-3.5 w-3.5" />}
            <span className="hidden xl:inline text-[11px] ml-1">{isCameraEnabled ? "Stop Cam" : "Start Cam"}</span>
          </button>
        )}

        {/* Screen Share Button (Desktop Only) */}
        {onToggleScreenShare && (
          <button
            type="button"
            onClick={onToggleScreenShare}
            title={isScreenSharing ? "Stop Sharing Screen" : "Share Your Screen"}
            className={`hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
              isScreenSharing
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700"
            }`}
          >
            {isScreenSharing ? <MonitorOff className="h-3.5 w-3.5" /> : <MonitorUp className="h-3.5 w-3.5" />}
            <span className="hidden xl:inline text-[11px]">{isScreenSharing ? "Stop Share" : "Share"}</span>
          </button>
        )}

        {/* Chat & Notes Sidebar Toggle (Mobile & Desktop) */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            title="Class Chat & Live Notes"
            className={`flex items-center justify-center p-1.5 sm:p-2 rounded-xl transition border ${
              sidebarOpen
                ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border-slate-700"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        )}

        {/* Device Settings Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          title="Audio & Video Device Settings"
          className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition"
        >
          <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
          } font-extrabold text-xs px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1`}
        >
          <PhoneOff className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{endButtonLabel}</span>
        </Button>
      </div>
    </header>
  );
}
