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
  MoreVertical,
  ShieldCheck,
  Maximize2,
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
  trophiesCount?: number;
  isHandRaised?: boolean;
  videoElement?: React.ReactNode;
  onAwardTrophy?: () => void;
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
  trophiesCount = 0,
  isHandRaised = false,
  videoElement,
  onAwardTrophy,
  className = "",
}: ParticipantVideoCardProps) {
  const [showMenu, setShowMenu] = React.useState(false);

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
      {!isVideoOff && videoElement ? (
        <div className="w-full h-full object-cover">{videoElement}</div>
      ) : (
        <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
          <div className="relative">
            <Avatar
              src={avatarUrl}
              fallbackName={displayName}
              size="lg"
              className={isSpeaking ? "ring-4 ring-emerald-500 animate-pulse" : "ring-2 ring-slate-700"}
            />
            {isSpeaking && (
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500">
                <span className="h-2 w-2 rounded-full bg-white animate-ping" />
              </span>
            )}
          </div>
          <p className="text-xs font-bold text-white truncate max-w-[140px]">{displayName}</p>
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
        </div>

        {/* Trophy / Praise Badge */}
        <div className="flex items-center gap-1.5">
          {trophiesCount > 0 && (
            <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-400/60 px-2 py-0.5 rounded-full text-amber-300 text-[10px] font-black shadow-xs">
              <span>🏆</span>
              <span>x{trophiesCount}</span>
            </div>
          )}

          {/* Raised Hand Icon */}
          {isHandRaised && (
            <div className="flex items-center gap-1 bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black animate-bounce shadow-md">
              <Hand className="h-3 w-3 fill-slate-950" />
              <span>Hand Raised</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── BOTTOM CONTROLS & NAME BAR ─── */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between bg-slate-950/75 backdrop-blur-xs px-2.5 py-1.5 rounded-xl border border-slate-800/80 text-white">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-bold text-slate-200 truncate">{displayName}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mic Status */}
          <div
            className={`p-1 rounded-md ${
              isMuted ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"
            }`}
            title={isMuted ? "Microphone Muted" : "Microphone Active"}
          >
            {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          </div>

          {/* Video Status */}
          <div
            className={`p-1 rounded-md ${
              isVideoOff ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"
            }`}
            title={isVideoOff ? "Camera Off" : "Camera On"}
          >
            {isVideoOff ? <VideoOff className="h-3.5 w-3.5" /> : <VideoIcon className="h-3.5 w-3.5" />}
          </div>

          {/* Award Trophy quick button if not local */}
          {onAwardTrophy && !isLocal && (
            <button
              type="button"
              onClick={onAwardTrophy}
              title="Award Trophy (+1 🏆)"
              className="p-1 rounded-md bg-amber-500/20 text-amber-300 hover:bg-amber-500/40 transition pointer-events-auto"
            >
              <Trophy className="h-3.5 w-3.5 fill-amber-300" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
