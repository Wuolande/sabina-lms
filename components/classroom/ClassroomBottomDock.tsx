"use client";

import * as React from "react";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  MonitorUp,
  MonitorOff,
  Settings,
  Hand,
  PhoneOff,
  Pencil,
  Lock,
  VolumeX,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ClassroomBottomDockProps {
  isTutor: boolean;
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  isScreenSharing?: boolean;
  isHandRaised?: boolean;
  isWhiteboardAuthorized?: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare?: () => void;
  onRaiseHand?: () => void;
  onOpenSettings: () => void;
  onEndLesson: () => void;
  // Tutor moderation shortcuts
  onRemoteMuteStudent?: () => void;
  onToggleWhiteboardAuth?: () => void;
}

export function ClassroomBottomDock({
  isTutor,
  isMicEnabled,
  isCameraEnabled,
  isScreenSharing = false,
  isHandRaised = false,
  isWhiteboardAuthorized = false,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onRaiseHand,
  onOpenSettings,
  onEndLesson,
  onRemoteMuteStudent,
  onToggleWhiteboardAuth,
}: ClassroomBottomDockProps) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-slate-900/95 backdrop-blur-lg px-4 py-2.5 rounded-2xl border border-slate-700/80 shadow-[0_15px_45px_rgba(0,0,0,0.6)] text-white select-none">
      
      {/* ─── AUDIO TOGGLE ─── */}
      <button
        type="button"
        onClick={onToggleMic}
        title={isMicEnabled ? "Mute Microphone" : "Unmute Microphone"}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
          isMicEnabled
            ? "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
            : "bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/30"
        }`}
      >
        {isMicEnabled ? <Mic className="h-4 w-4 text-emerald-400" /> : <MicOff className="h-4 w-4" />}
        <span className="hidden sm:inline">{isMicEnabled ? "Mute" : "Unmute"}</span>
      </button>

      {/* ─── VIDEO TOGGLE ─── */}
      <button
        type="button"
        onClick={onToggleCamera}
        title={isCameraEnabled ? "Turn Off Camera" : "Turn On Camera"}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
          isCameraEnabled
            ? "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
            : "bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/30"
        }`}
      >
        {isCameraEnabled ? <VideoIcon className="h-4 w-4 text-emerald-400" /> : <VideoOff className="h-4 w-4" />}
        <span className="hidden sm:inline">{isCameraEnabled ? "Stop Video" : "Start Video"}</span>
      </button>

      {/* ─── SCREEN SHARE ─── */}
      {onToggleScreenShare && (
        <button
          type="button"
          onClick={onToggleScreenShare}
          title={isScreenSharing ? "Stop Sharing Screen" : "Share Your Screen"}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
            isScreenSharing
              ? "bg-indigo-600 text-white shadow-indigo-600/30"
              : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700"
          }`}
        >
          {isScreenSharing ? <MonitorOff className="h-4 w-4" /> : <MonitorUp className="h-4 w-4" />}
          <span className="hidden md:inline">{isScreenSharing ? "Stop Share" : "Share"}</span>
        </button>
      )}

      {/* ─── SEPARATOR ─── */}
      <div className="h-5 w-px bg-slate-700 mx-1" />

      {/* ─── TUTOR MODERATION SHORTCUTS ─── */}
      {isTutor && (
        <>
          {/* Whiteboard Pen Authorization */}
          {onToggleWhiteboardAuth && (
            <button
              type="button"
              onClick={onToggleWhiteboardAuth}
              title={
                isWhiteboardAuthorized
                  ? "Whiteboard: Student Authorized to Draw (Click to Lock)"
                  : "Whiteboard: Student Locked in View Mode (Click to Authorize Pen)"
              }
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border ${
                isWhiteboardAuthorized
                  ? "bg-indigo-600/30 border-indigo-500 text-indigo-300 hover:bg-indigo-600/50"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              {isWhiteboardAuthorized ? (
                <Pencil className="h-4 w-4 text-indigo-400" />
              ) : (
                <Lock className="h-4 w-4 text-amber-400" />
              )}
              <span className="hidden lg:inline">
                {isWhiteboardAuthorized ? "Pen: Authorized" : "Pen: Locked"}
              </span>
            </button>
          )}

          {/* Mute Student */}
          {onRemoteMuteStudent && (
            <button
              type="button"
              onClick={onRemoteMuteStudent}
              title="Remote Mute Student"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-rose-900/60 hover:text-rose-200 border border-slate-700 transition"
            >
              <VolumeX className="h-4 w-4" />
              <span className="hidden lg:inline">Mute Student</span>
            </button>
          )}

          <div className="h-5 w-px bg-slate-700 mx-1" />
        </>
      )}

      {/* ─── STUDENT RAISE HAND ─── */}
      {!isTutor && onRaiseHand && (
        <button
          type="button"
          onClick={onRaiseHand}
          title={isHandRaised ? "Hand is Raised (Click to Lower)" : "Raise Hand to Ask Question"}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
            isHandRaised
              ? "bg-amber-500 text-slate-950 animate-bounce shadow-md shadow-amber-500/30"
              : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700"
          }`}
        >
          <Hand className={`h-4 w-4 ${isHandRaised ? "fill-slate-950" : ""}`} />
          <span className="hidden sm:inline">{isHandRaised ? "Lower Hand" : "Raise Hand"}</span>
        </button>
      )}

      {/* ─── DEVICE SETTINGS ─── */}
      <button
        type="button"
        onClick={onOpenSettings}
        title="Audio & Video Settings"
        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition"
      >
        <Settings className="h-4 w-4" />
      </button>

      {/* ─── END CLASS ─── */}
      <button
        type="button"
        onClick={onEndLesson}
        title="Leave or End Classroom Session"
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition shadow-md shadow-rose-600/30"
      >
        <PhoneOff className="h-4 w-4" />
        <span className="hidden sm:inline">End Class</span>
      </button>
    </div>
  );
}
