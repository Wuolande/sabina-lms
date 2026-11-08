"use client";

import * as React from "react";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Trophy,
  Hand,
  Pencil,
  WifiOff,
  Wifi,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";

interface ParticipantVideoCardProps {
  displayName: string;
  avatarUrl?: string;
  role: "TUTOR" | "STUDENT";
  isLocal?: boolean;
  isSpeaking?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isConnected?: boolean;
  trophiesCount?: number;
  isHandRaised?: boolean;
  videoElement?: React.ReactNode;
  onAwardTrophy?: () => void;
  // Local user interactive toggles
  onToggleMic?: () => void;
  onToggleCamera?: () => void;
  // Tutor moderation over student
  canModerate?: boolean;
  isWhiteboardAuthorized?: boolean;
  onToggleWhiteboardAuth?: () => void;
  onRemoteMuteStudent?: () => void;
  className?: string;
  /** Compact mode for top video strip so avatar & bars never overlap */
  compact?: boolean;
  /** Connection quality: 'excellent' | 'good' | 'poor' | 'lost' | undefined */
  connectionQuality?: "excellent" | "good" | "poor" | "lost";
}

export function ParticipantVideoCard({
  displayName,
  avatarUrl,
  role,
  isLocal = false,
  isSpeaking = false,
  isMuted = false,
  isVideoOff = false,
  isConnected = true,
  trophiesCount = 0,
  isHandRaised = false,
  videoElement,
  onAwardTrophy,
  onToggleMic,
  onToggleCamera,
  canModerate = false,
  isWhiteboardAuthorized = false,
  onToggleWhiteboardAuth,
  onRemoteMuteStudent,
  className = "",
  compact = false,
  connectionQuality,
}: ParticipantVideoCardProps) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl bg-slate-900 border overflow-hidden transition-all duration-300 shadow-md ${
        isSpeaking
          ? "border-emerald-400 ring-2 ring-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          : isHandRaised
          ? "border-amber-400 ring-2 ring-amber-400/50"
          : "border-slate-800"
      } ${className}`}
    >
      {/* Video Content or Avatar Fallback */}
      {!isVideoOff && isConnected && videoElement ? (
        <div className="w-full h-full object-cover">{videoElement}</div>
      ) : (
        <div
          className={`flex flex-col items-center justify-center text-center ${
            compact ? "pb-3 pt-1" : "p-4 space-y-2"
          }`}
        >
          <div className="relative">
            <Avatar
              src={avatarUrl}
              fallbackName={displayName}
              size={compact ? "md" : "lg"}
              className={
                isSpeaking
                  ? "ring-4 ring-emerald-500 animate-pulse"
                  : !isConnected && !isLocal
                  ? "opacity-50 ring-2 ring-slate-800"
                  : "ring-2 ring-slate-700"
              }
            />
            {isSpeaking && (
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500">
                <span className="h-2 w-2 rounded-full bg-white animate-ping" />
              </span>
            )}
          </div>
          {!compact && (
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-white truncate max-w-[160px]">{displayName}</p>
              {!isConnected && !isLocal && (
                <p className="text-[10px] text-slate-500 font-medium">Waiting to connect...</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── TOP STATUS BADGES ─── */}
      <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2.5 right-1.5 sm:right-2.5 flex items-center justify-between gap-1 pointer-events-none z-10">
        {/* Role Badge */}
        <div className="flex items-center gap-1 min-w-0">
          <Badge
            variant="subtle"
            size="sm"
            className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider py-0.5 px-1.5 sm:px-2 shrink-0 ${
              role === "TUTOR"
                ? "bg-indigo-600/90 text-white border-indigo-500"
                : "bg-emerald-600/90 text-white border-emerald-500"
            }`}
          >
            {role === "TUTOR" ? "👨‍🏫 Tutor" : "🎓 Student"}
          </Badge>

          {isLocal && (
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 bg-slate-800/85 px-1.5 py-0.5 rounded border border-slate-700 shrink-0">
              You
            </span>
          )}

          {!isLocal && !isConnected && (
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 bg-slate-900/90 px-1.5 py-0.5 rounded-full border border-slate-700 flex items-center gap-1 shrink-0">
              <WifiOff className="w-2.5 h-2.5 text-slate-500" />
              <span className="hidden sm:inline">Waiting</span>
            </span>
          )}
        </div>

        {/* Trophy / Praise Badge / Raised Hand */}
        <div className="flex items-center gap-1 pointer-events-auto shrink-0">
          {trophiesCount > 0 && (
            <div className="flex items-center gap-0.5 bg-amber-500/20 border border-amber-400/60 px-1.5 sm:px-2 py-0.5 rounded-full text-amber-300 text-[9px] sm:text-[10px] font-black shadow-xs">
              <span>🏆</span>
              <span>x{trophiesCount}</span>
            </div>
          )}

          {isHandRaised && (
            <div className="flex items-center gap-1 bg-amber-500 text-slate-950 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black animate-bounce shadow-md">
              <Hand className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-slate-950" />
              <span className="hidden xs:inline">Hand Raised</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── BOTTOM CONTROLS & NAME BAR ─── */}
      <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 right-1 sm:right-2 flex items-center justify-between gap-1 bg-slate-950/85 backdrop-blur-md px-2 sm:px-2.5 py-1 rounded-xl border border-slate-800/90 text-white z-10">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] sm:text-xs font-bold text-slate-200 truncate">
            {displayName}
          </span>
          {connectionQuality && (
            <span
              title={`Connection: ${connectionQuality}`}
              className={`shrink-0 ${
                connectionQuality === "excellent"
                  ? "text-emerald-400"
                  : connectionQuality === "good"
                  ? "text-amber-300"
                  : connectionQuality === "poor"
                  ? "text-rose-400"
                  : "text-slate-500"
              }`}
            >
              {connectionQuality === "lost" ? (
                <WifiOff className="w-3 h-3" />
              ) : (
                <Wifi className="w-3 h-3" />
              )}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {isLocal ? (
            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={onToggleMic}
                title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                className={`p-1 sm:p-1.5 rounded-lg transition ${
                  isMuted
                    ? "bg-rose-600 text-white hover:bg-rose-700"
                    : "bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50 border border-emerald-500/40"
                }`}
              >
                {isMuted ? <MicOff className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <Mic className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
              </button>

              <button
                type="button"
                onClick={onToggleCamera}
                title={isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
                className={`p-1 sm:p-1.5 rounded-lg transition ${
                  isVideoOff
                    ? "bg-rose-600 text-white hover:bg-rose-700"
                    : "bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50 border border-emerald-500/40"
                }`}
              >
                {isVideoOff ? <VideoOff className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <VideoIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
              </button>
            </div>
          ) : (
            <>
              <div
                className={`p-1 rounded-md ${
                  !isConnected
                    ? "bg-slate-800 text-slate-500"
                    : isMuted
                    ? "bg-rose-500/20 text-rose-400"
                    : "bg-emerald-500/20 text-emerald-400"
                }`}
                title={!isConnected ? "Offline" : isMuted ? "Muted" : "Active"}
              >
                {isMuted || !isConnected ? <MicOff className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <Mic className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
              </div>

              <div
                className={`hidden xs:block p-1 rounded-md ${
                  !isConnected
                    ? "bg-slate-800 text-slate-500"
                    : isVideoOff
                    ? "bg-rose-500/20 text-rose-400"
                    : "bg-emerald-500/20 text-emerald-400"
                }`}
                title={!isConnected ? "Offline" : isVideoOff ? "Camera Off" : "Camera On"}
              >
                {isVideoOff || !isConnected ? <VideoOff className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <VideoIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
              </div>

              {/* ─── TUTOR MODERATION BUTTONS (Always available when Tutor views Student card) ─── */}
              {canModerate && (
                <>
                  <div className="h-3 w-px bg-slate-700 mx-0.5" />

                  {onRemoteMuteStudent && isConnected && (
                    <button
                      type="button"
                      onClick={onRemoteMuteStudent}
                      title="Mute Student Microphone"
                      className="p-1 sm:p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 border border-slate-700 transition"
                    >
                      <MicOff className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </button>
                  )}

                  {onToggleWhiteboardAuth && (
                    <button
                      type="button"
                      onClick={onToggleWhiteboardAuth}
                      title={
                        isWhiteboardAuthorized
                          ? "Student Pen Authorized (Click to Lock)"
                          : "Authorize Student to Draw on Whiteboard"
                      }
                      className={`p-1 sm:p-1.5 rounded-lg border transition ${
                        isWhiteboardAuthorized
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                          : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                      }`}
                    >
                      <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </button>
                  )}

                  {onAwardTrophy && (
                    <button
                      type="button"
                      onClick={onAwardTrophy}
                      title="Award Trophy (+1 🏆)"
                      className="p-1 sm:p-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/40 border border-amber-500/30 transition"
                    >
                      <Trophy className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-amber-300" />
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
