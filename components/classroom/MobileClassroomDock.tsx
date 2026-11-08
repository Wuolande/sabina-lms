"use client";

import * as React from "react";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  MessageSquare,
  Layout,
  Grid as GridIcon,
  Monitor,
  Sparkles,
  Settings,
  Hand,
  Trophy,
  Dices,
  Clock,
  X,
  FileText,
  PenTool,
  Lock,
} from "lucide-react";
import { StageLayoutMode } from "./ClassroomHeader";

interface MobileClassroomDockProps {
  // Media controls
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  onToggleMic?: () => void;
  onToggleCamera?: () => void;
  // Stage mode
  layoutMode: StageLayoutMode;
  onChangeLayout: (mode: StageLayoutMode) => void;
  hasScreenShare?: boolean;
  // Chat & Sidebar
  onToggleChat?: () => void;
  onOpenNotes?: () => void;
  unreadCount?: number;
  isChatOpen?: boolean;
  // Tools & Settings
  isTutor: boolean;
  onOpenSettings?: () => void;
  // Interactive Tools actions
  onAwardTrophy?: (message: string) => void;
  onRaiseHand?: () => void;
  isHandRaised?: boolean;
  onOpenTimer?: () => void;
  onOpenDice?: () => void;
  isWhiteboardAuthorized?: boolean;
  onToggleWhiteboardAuth?: () => void;
  // Call termination
  onEndLesson: () => void;
  endButtonLabel?: string;
}

export function MobileClassroomDock({
  isMicEnabled,
  isCameraEnabled,
  onToggleMic,
  onToggleCamera,
  layoutMode,
  onChangeLayout,
  hasScreenShare = false,
  onToggleChat,
  onOpenNotes,
  unreadCount = 0,
  isChatOpen = false,
  isTutor,
  onOpenSettings,
  onAwardTrophy,
  onRaiseHand,
  isHandRaised = false,
  onOpenTimer,
  onOpenDice,
  isWhiteboardAuthorized = false,
  onToggleWhiteboardAuth,
  onEndLesson,
  endButtonLabel = "End",
}: MobileClassroomDockProps) {
  const [isToolsSheetOpen, setIsToolsSheetOpen] = React.useState(false);

  return (
    <>
      {/* ─── BOTTOM TOOLS DRAWER / ACTION SHEET ─── */}
      {isToolsSheetOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs"
            onClick={() => setIsToolsSheetOpen(false)}
          />

          <div className="relative z-10 bg-slate-900 border-t border-slate-700/80 rounded-t-3xl p-4 shadow-2xl space-y-3.5 max-h-[82vh] overflow-y-auto pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]">
            {/* Handle bar */}
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto" />

            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" /> Classroom Layouts & Tools
              </h3>
              <button
                type="button"
                onClick={() => setIsToolsSheetOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stage Layout Switcher Pills */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  onChangeLayout("classin_stage");
                  setIsToolsSheetOpen(false);
                }}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl border text-center transition ${
                  layoutMode === "classin_stage"
                    ? "bg-indigo-600 text-white border-indigo-400 shadow-md"
                    : "bg-slate-800 text-slate-300 border-slate-700"
                }`}
              >
                <Layout className="w-4 h-4" />
                <span className="text-[11px] font-bold">Whiteboard</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onChangeLayout("grid");
                  setIsToolsSheetOpen(false);
                }}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl border text-center transition ${
                  layoutMode === "grid"
                    ? "bg-indigo-600 text-white border-indigo-400 shadow-md"
                    : "bg-slate-800 text-slate-300 border-slate-700"
                }`}
              >
                <GridIcon className="w-4 h-4" />
                <span className="text-[11px] font-bold">Video Grid</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (hasScreenShare) {
                    onChangeLayout("screenshare");
                  } else {
                    onChangeLayout("split");
                  }
                  setIsToolsSheetOpen(false);
                }}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl border text-center transition ${
                  layoutMode === "screenshare" || layoutMode === "split"
                    ? "bg-indigo-600 text-white border-indigo-400 shadow-md"
                    : "bg-slate-800 text-slate-300 border-slate-700"
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span className="text-[11px] font-bold">
                  {hasScreenShare ? "Screen Share" : "Dual View"}
                </span>
              </button>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Live Notes Quick Button */}
              {onOpenNotes && (
                <button
                  type="button"
                  onClick={() => {
                    setIsToolsSheetOpen(false);
                    onOpenNotes();
                  }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-700/50 text-left transition"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-emerald-200">Shared Notes</p>
                    <p className="text-[10px] text-emerald-400/80">Live scratchpad</p>
                  </div>
                </button>
              )}

              {/* Tutor Pen Permission or Student Hand Raise */}
              {isTutor && onToggleWhiteboardAuth ? (
                <button
                  type="button"
                  onClick={() => {
                    onToggleWhiteboardAuth();
                    setIsToolsSheetOpen(false);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition ${
                    isWhiteboardAuthorized
                      ? "bg-emerald-950/40 border-emerald-700/60 text-emerald-200"
                      : "bg-slate-800 border-slate-700 text-slate-200"
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
                    {isWhiteboardAuthorized ? <PenTool className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold">
                      {isWhiteboardAuthorized ? "Lock Student Pen" : "Allow Student Pen"}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {isWhiteboardAuthorized ? "Student can draw" : "View-only for student"}
                    </p>
                  </div>
                </button>
              ) : null}

              {/* Hand Raise (Student) or Trophy Award (Tutor) */}
              {isTutor ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsToolsSheetOpen(false);
                    onAwardTrophy?.("Outstanding participation!");
                  }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-amber-950/40 hover:bg-amber-950/60 border border-amber-800/60 text-left transition"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-amber-200">Award Trophy</p>
                    <p className="text-[10px] text-amber-400/80">Celebrate student</p>
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsToolsSheetOpen(false);
                    onRaiseHand?.();
                  }}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition ${
                    isHandRaised
                      ? "bg-amber-500 text-slate-950 border-amber-400"
                      : "bg-slate-800 hover:bg-slate-750 border-slate-700 text-white"
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                    <Hand className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold">
                      {isHandRaised ? "Lower Hand" : "Raise Hand"}
                    </p>
                    <p className={`text-[10px] ${isHandRaised ? "text-slate-900" : "text-slate-400"}`}>
                      Notify tutor
                    </p>
                  </div>
                </button>
              )}

              {/* Class Timer Tool */}
              {onOpenTimer && (
                <button
                  type="button"
                  onClick={() => {
                    setIsToolsSheetOpen(false);
                    onOpenTimer();
                  }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left transition"
                >
                  <div className="w-9 h-9 rounded-xl bg-sky-600/20 text-sky-400 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white">Stopwatch</p>
                    <p className="text-[10px] text-slate-400">Activity timer</p>
                  </div>
                </button>
              )}

              {/* Rolling Dice Tool */}
              {onOpenDice && (
                <button
                  type="button"
                  onClick={() => {
                    setIsToolsSheetOpen(false);
                    onOpenDice();
                  }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left transition"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0">
                    <Dices className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white">Roll Dice</p>
                    <p className="text-[10px] text-slate-400">Synced 1–6</p>
                  </div>
                </button>
              )}

              {/* Device Settings */}
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={() => {
                    setIsToolsSheetOpen(false);
                    onOpenSettings();
                  }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left transition col-span-2"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-700 text-slate-300 flex items-center justify-center shrink-0">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white">Audio & Video Settings</p>
                    <p className="text-[10px] text-slate-400">Switch microphone, speaker, or camera</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── FLOATING BOTTOM DOCK (Mobile Only) ─── */}
      <div className="fixed bottom-2 inset-x-2 z-40 md:hidden flex items-center justify-between bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 px-2.5 py-1.5 rounded-2xl shadow-[0_12px_45px_rgba(0,0,0,0.7)] text-white select-none">
        {/* 1. Mic Button */}
        {onToggleMic && (
          <button
            type="button"
            onClick={onToggleMic}
            title={isMicEnabled ? "Mute Microphone" : "Unmute Microphone"}
            className={`flex flex-col items-center justify-center w-11 h-11 rounded-xl transition ${
              isMicEnabled
                ? "bg-slate-800 text-emerald-400 border border-slate-700 active:scale-95"
                : "bg-rose-600 text-white shadow-md shadow-rose-600/40 active:scale-95"
            }`}
          >
            {isMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            <span className="text-[8px] font-bold mt-0.5">
              {isMicEnabled ? "Mic" : "Muted"}
            </span>
          </button>
        )}

        {/* 2. Camera Button */}
        {onToggleCamera && (
          <button
            type="button"
            onClick={onToggleCamera}
            title={isCameraEnabled ? "Turn Off Camera" : "Turn On Camera"}
            className={`flex flex-col items-center justify-center w-11 h-11 rounded-xl transition ${
              isCameraEnabled
                ? "bg-slate-800 text-emerald-400 border border-slate-700 active:scale-95"
                : "bg-rose-600 text-white shadow-md shadow-rose-600/40 active:scale-95"
            }`}
          >
            {isCameraEnabled ? <VideoIcon className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            <span className="text-[8px] font-bold mt-0.5">
              {isCameraEnabled ? "Cam" : "Off"}
            </span>
          </button>
        )}

        {/* 3. Stage Switcher (Board vs Video) */}
        <button
          type="button"
          onClick={() =>
            onChangeLayout(layoutMode === "classin_stage" ? "grid" : "classin_stage")
          }
          title={
            layoutMode === "classin_stage"
              ? "Switch to Video Grid"
              : "Switch to Whiteboard Stage"
          }
          className={`flex flex-col items-center justify-center w-12 h-11 rounded-xl border transition ${
            layoutMode === "classin_stage"
              ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
              : "bg-slate-800 text-slate-300 border-slate-700 active:scale-95"
          }`}
        >
          {layoutMode === "classin_stage" ? (
            <Layout className="w-4 h-4" />
          ) : (
            <GridIcon className="w-4 h-4" />
          )}
          <span className="text-[8px] font-bold mt-0.5">
            {layoutMode === "classin_stage" ? "Board" : "Video"}
          </span>
        </button>

        {/* 4. Live Notes Quick Button */}
        {onOpenNotes && (
          <button
            type="button"
            onClick={onOpenNotes}
            title="Live Shared Notes"
            className="flex flex-col items-center justify-center w-11 h-11 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700 active:scale-95 transition"
          >
            <FileText className="w-4 h-4" />
            <span className="text-[8px] font-bold mt-0.5">Notes</span>
          </button>
        )}

        {/* 5. Chat Toggle */}
        {onToggleChat && (
          <button
            type="button"
            onClick={onToggleChat}
            title="Class Chat & Files"
            className={`relative flex flex-col items-center justify-center w-11 h-11 rounded-xl border transition ${
              isChatOpen
                ? "bg-indigo-600 text-white border-indigo-500"
                : "bg-slate-800 text-slate-300 border-slate-700 active:scale-95"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-[8px] font-bold mt-0.5">Chat</span>

            {unreadCount > 0 && !isChatOpen && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[8px] font-black text-white ring-2 ring-slate-900">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        )}

        {/* 6. More Actions & Tools Trigger */}
        <button
          type="button"
          onClick={() => setIsToolsSheetOpen(!isToolsSheetOpen)}
          title="Classroom Tools & Gamification"
          className="flex flex-col items-center justify-center w-11 h-11 rounded-xl bg-slate-800 text-amber-400 border border-slate-700 active:scale-95 transition"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[8px] font-bold mt-0.5">Tools</span>
        </button>

        {/* 7. Leave / End Call Button */}
        <button
          type="button"
          onClick={onEndLesson}
          title={endButtonLabel}
          className="flex flex-col items-center justify-center w-11 h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/40 active:scale-95 transition"
        >
          <PhoneOff className="w-4 h-4" />
          <span className="text-[8px] font-bold mt-0.5">
            {endButtonLabel.includes("Leave") ? "Leave" : "End"}
          </span>
        </button>
      </div>
    </>
  );
}
