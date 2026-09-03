"use client";

import * as React from "react";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Trophy,
  Hand,
  Sparkles,
  ShieldCheck,
  Pencil,
  Lock,
  WifiOff,
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
        <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
          <div className="relative">
            <Avatar
              src={avatarUrl}
              fallbackName={displayName}
              size="lg"
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
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-white truncate max-w-[150px]">{displayName}</p>
            {!isConnected && !isLocal && (
              <p className="text-[10px] text-slate-500 font-medium">Waiting to connect...</p>
            )}
          </div>
        </div>
      )}

      {/* ─── TOP STATUS BADGES ─── */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
        {/* Role Badge */}
        <div className="flex items-center gap-1.5">
          <Badge
            variant="subtle"
            size="sm"
            className={`text-[10px] font-black uppercase tracking-wider py-0.5 px-2 ${
              role === "TUTOR"
                ? "bg-indigo-600/90 text-white border-indigo-500"
                : "bg-emerald-600/90 text-white border-emerald-500"
            }`}
          >
            {role === "TUTOR" ? "👨‍🏫 Tutor" : "🎓 Student"}
          </Badge>

          {isLocal && (
            <span className="text-[10px] font-bold text-slate-300 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">
              You
            </span>
          )}

          {!isLocal && !isConnected && (
            <span className="text-[10px] font-bold text-slate-400 bg-slate-900/90 px-2 py-0.5 rounded-full border border-slate-700 flex items-center gap-1">
              <WifiOff className="w-3 h-3 text-slate-500" />
              Offline
            </span>
          )}
        </div>

        {/* Trophy / Praise Badge / Raised Hand */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {trophiesCount > 0 && (
            <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-400/60 px-2 py-0.5 rounded-full text-amber-300 text-[10px] font-black shadow-xs">
              <span>🏆</span>
              <span>x{trophiesCount}</span>
            </div>
          )}

          {isHandRaised && (
            <div className="flex items-center gap-1 bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black animate-bounce shadow-md">
              <Hand className="h-3 w-3 fill-slate-950" />
              <span>Hand Raised</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── BOTTOM CONTROLS & NAME BAR ─── */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-white">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-bold text-slate-200 truncate">{displayName}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* ─── LOCAL USER TOGGLES ─── */}
          {isLocal ? (
            <>
              {/* Mic Toggle Button */}
              <button
                type="button"
                onClick={onToggleMic}
                title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                className={`p-1.5 rounded-lg transition ${
                  isMuted
                    ? "bg-rose-600 text-white hover:bg-rose-700"
                    : "bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50 border border-emerald-500/40"
                }`}
              >
                {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              </button>

              {/* Video Toggle Button */}
              <button
                type="button"
                onClick={onToggleCamera}
                title={isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
                className={`p-1.5 rounded-lg transition ${
                  isVideoOff
                    ? "bg-rose-600 text-white hover:bg-rose-700"
                    : "bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50 border border-emerald-500/40"
                }`}
              >
                {isVideoOff ? <VideoOff className="h-3.5 w-3.5" /> : <VideoIcon className="h-3.5 w-3.5" />}
              </button>
            </>
          ) : (
            // ─── REMOTE USER DISPLAY & TUTOR MODERATION CONTROLS ───
            <>
              {/* Remote Mic Indicator */}
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
                {isMuted || !isConnected ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              </div>

              {/* Remote Video Indicator */}
              <div
                className={`p-1 rounded-md ${
                  !isConnected
                    ? "bg-slate-800 text-slate-500"
                    : isVideoOff
                    ? "bg-rose-500/20 text-rose-400"
                    : "bg-emerald-500/20 text-emerald-400"
                }`}
                title={!isConnected ? "Offline" : isVideoOff ? "Camera Off" : "Camera On"}
              >
                {isVideoOff || !isConnected ? <VideoOff className="h-3.5 w-3.5" /> : <VideoIcon className="h-3.5 w-3.5" />}
              </div>

              {/* ─── TUTOR MODERATION BUTTONS (When Tutor views Student) ─── */}
              {canModerate && isConnected && (
                <>
                  <div className="h-3 w-px bg-slate-700 mx-0.5" />

                  {/* Remote Mute Student */}
                  {onRemoteMuteStudent && (
                    <button
                      type="button"
                      onClick={onRemoteMuteStudent}
                      title="Mute Student Microphone"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 border border-slate-700 transition"
                    >
                      <MicOff className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* ClassIn Whiteboard Pen Authorize / Lock */}
                  {onToggleWhiteboardAuth && (
                    <button
                      type="button"
                      onClick={onToggleWhiteboardAuth}
                      title={
                        isWhiteboardAuthorized
                          ? "Student Pen Authorized (Click to Lock)"
                          : "Authorize Student to Draw on Whiteboard"
                      }
                      className={`p-1.5 rounded-lg border transition ${
                        isWhiteboardAuthorized
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                          : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                      }`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Award Trophy */}
                  {onAwardTrophy && (
                    <button
                      type="button"
                      onClick={onAwardTrophy}
                      title="Award Trophy (+1 🏆)"
                      className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/40 border border-amber-500/30 transition"
                    >
                      <Trophy className="h-3.5 w-3.5 fill-amber-300" />
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
