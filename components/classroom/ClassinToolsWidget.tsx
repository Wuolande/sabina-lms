"use client";

import * as React from "react";
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Dices,
  Hand,
  X,
  Sparkles,
  Check,
  Pencil,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ClassinToolsWidgetProps {
  isTutor: boolean;
  studentName?: string;
  onAwardTrophy: (message: string) => void;
  onRaiseHand: () => void;
  isHandRaised?: boolean;
  onSyncTimer?: (action: "start" | "pause" | "reset" | "set", seconds?: number) => void;
  syncedTimerState?: { isRunning: boolean; seconds: number };
  onSyncDice?: (value: number) => void;
  syncedDiceValue?: { value: number; rolledBy?: string; timestamp: number } | null;
  isWhiteboardAuthorized?: boolean;
  onToggleWhiteboardAuth?: () => void;
  externalTimerOpen?: boolean;
  onChangeTimerOpen?: (open: boolean) => void;
  externalDiceOpen?: boolean;
  onChangeDiceOpen?: (open: boolean) => void;
}

export function ClassinToolsWidget({
  isTutor,
  studentName = "Student",
  onAwardTrophy,
  onRaiseHand,
  isHandRaised = false,
  onSyncTimer,
  syncedTimerState,
  onSyncDice,
  syncedDiceValue,
  isWhiteboardAuthorized = false,
  onToggleWhiteboardAuth,
  externalTimerOpen,
  onChangeTimerOpen,
  externalDiceOpen,
  onChangeDiceOpen,
}: ClassinToolsWidgetProps) {
  const [internalTimerOpen, setInternalTimerOpen] = React.useState(false);
  const [internalDiceOpen, setInternalDiceOpen] = React.useState(false);
  const [isTrophyModalOpen, setIsTrophyModalOpen] = React.useState(false);

  const isTimerOpen = externalTimerOpen !== undefined ? externalTimerOpen : internalTimerOpen;
  const setIsTimerOpen = (next: boolean) => {
    setInternalTimerOpen(next);
    onChangeTimerOpen?.(next);
  };

  const isDiceOpen = externalDiceOpen !== undefined ? externalDiceOpen : internalDiceOpen;
  const setIsDiceOpen = (next: boolean) => {
    setInternalDiceOpen(next);
    onChangeDiceOpen?.(next);
  };

  // Timer internal state
  const [timerSeconds, setTimerSeconds] = React.useState(120);
  const [initialSeconds, setInitialSeconds] = React.useState(120);
  const [isTimerRunning, setIsTimerRunning] = React.useState(false);

  // Sync with external synced timer state
  React.useEffect(() => {
    if (syncedTimerState) {
      setTimerSeconds(syncedTimerState.seconds);
      setIsTimerRunning(syncedTimerState.isRunning);
      if (syncedTimerState.isRunning) {
        setInternalTimerOpen(true);
        onChangeTimerOpen?.(true);
      }
    }
  }, [syncedTimerState]);

  // Timer countdown loop
  React.useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsTimerRunning(false);
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.type = "sine";
              osc.frequency.setValueAtTime(880, audioCtx.currentTime);
              gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.8);
            } catch {}
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  // Dice roll state
  const [diceValue, setDiceValue] = React.useState(1);
  const [isRolling, setIsRolling] = React.useState(false);

  React.useEffect(() => {
    if (syncedDiceValue && syncedDiceValue.value) {
      setDiceValue(syncedDiceValue.value);
      setInternalDiceOpen(true);
      onChangeDiceOpen?.(true);
    }
  }, [syncedDiceValue]);

  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    let count = 0;
    const finalValue = Math.floor(Math.random() * 6) + 1;
    const rollInterval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count > 10) {
        clearInterval(rollInterval);
        setDiceValue(finalValue);
        setIsRolling(false);
        onSyncDice?.(finalValue);
      }
    }, 75);
  };

  // Trophy custom praise message
  const [selectedPraise, setSelectedPraise] = React.useState(
    "🌟 Perfect Pronunciation & Fluency!"
  );

  const praisePresets = [
    "🌟 Perfect Pronunciation & Fluency!",
    "🎯 Accurate Solution & Clear Logic!",
    "⚡ Lightning Fast Problem Solver!",
    "💡 Fantastic Vocabulary & Expression!",
    "🔥 Super Focus & Great Dedication!",
  ];

  const handleStartTimer = () => {
    setIsTimerRunning(true);
    onSyncTimer?.("start", timerSeconds);
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
    onSyncTimer?.("pause", timerSeconds);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(initialSeconds);
    onSyncTimer?.("reset", initialSeconds);
  };

  const handleSetPreset = (sec: number) => {
    setInitialSeconds(sec);
    setTimerSeconds(sec);
    setIsTimerRunning(false);
    onSyncTimer?.("set", sec);
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <>
      {/* ─── DOCKED DESKTOP LEFT RAIL (Zero overlap with video cards or whiteboard) ─── */}
      <div className="hidden md:flex flex-col items-center gap-2 py-3 px-2 bg-slate-900/90 border-r border-slate-800 shrink-0 z-20 select-none">
        {/* Timer Trigger */}
        <button
          type="button"
          onClick={() => {
            setIsTimerOpen(!isTimerOpen);
            setIsDiceOpen(false);
          }}
          title="Interactive Classroom Timer"
          className={`w-12 py-2 rounded-xl transition flex flex-col items-center gap-1 text-[10px] font-bold ${
            isTimerOpen || isTimerRunning
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-300 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>{isTimerRunning ? formatTimer(timerSeconds) : "Timer"}</span>
        </button>

        {/* Dice Tool Trigger */}
        <button
          type="button"
          onClick={() => {
            setIsDiceOpen(!isDiceOpen);
            setIsTimerOpen(false);
          }}
          title="Interactive 3D Rolling Dice"
          className={`w-12 py-2 rounded-xl transition flex flex-col items-center gap-1 text-[10px] font-bold ${
            isDiceOpen
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
              : "text-slate-300 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Dices className="h-4 w-4" />
          <span>Dice</span>
        </button>

        {/* Tutor Pen Authorization Shortcut */}
        {isTutor && onToggleWhiteboardAuth && (
          <button
            type="button"
            onClick={onToggleWhiteboardAuth}
            title={
              isWhiteboardAuthorized
                ? "Student Whiteboard Pen: Authorized (Click to Lock)"
                : "Authorize Student to Draw on Whiteboard"
            }
            className={`w-12 py-2 rounded-xl transition flex flex-col items-center gap-1 text-[10px] font-bold border ${
              isWhiteboardAuthorized
                ? "bg-emerald-600/25 border-emerald-500/50 text-emerald-300"
                : "border-transparent text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            {isWhiteboardAuthorized ? (
              <Pencil className="h-4 w-4 text-emerald-400" />
            ) : (
              <Lock className="h-4 w-4 text-slate-400" />
            )}
            <span>{isWhiteboardAuthorized ? "Pen ON" : "Pen Lock"}</span>
          </button>
        )}

        {/* Tutor Trophy Praise Trigger */}
        {isTutor && (
          <button
            type="button"
            onClick={() => {
              setIsTrophyModalOpen(true);
              setIsTimerOpen(false);
              setIsDiceOpen(false);
            }}
            title="Award Praise Trophy to Student"
            className="w-12 py-2 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-bold transition flex flex-col items-center gap-1 text-[10px] hover:scale-105 shadow-md shadow-amber-500/20"
          >
            <Trophy className="h-4 w-4 fill-slate-950" />
            <span>Award</span>
          </button>
        )}

        {/* Student Raise Hand */}
        {!isTutor && (
          <button
            type="button"
            onClick={onRaiseHand}
            title={isHandRaised ? "Hand is Raised (Click to Lower)" : "Raise Hand to Ask Question"}
            className={`w-12 py-2 rounded-xl transition flex flex-col items-center gap-1 text-[10px] font-bold ${
              isHandRaised
                ? "bg-amber-500 text-slate-950 animate-bounce shadow-md shadow-amber-500/40"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Hand className={`h-4 w-4 ${isHandRaised ? "fill-slate-950" : ""}`} />
            <span>{isHandRaised ? "Raised" : "Raise"}</span>
          </button>
        )}
      </div>

      {/* ─── FLOATING TIMER WIDGET ─── */}
      {isTimerOpen && (
        <div className="fixed md:absolute inset-x-3 md:inset-x-auto md:left-20 top-16 z-40 w-auto md:w-72 max-w-sm mx-auto rounded-2xl bg-slate-900/98 backdrop-blur-md border border-slate-700/80 p-4 shadow-2xl animate-in fade-in zoom-in-95 text-white">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-400">
              <Clock className="h-4 w-4" />
              <span>Exercise Countdown</span>
            </div>
            <button
              type="button"
              onClick={() => setIsTimerOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="py-4 text-center">
            <div className="font-mono font-black text-4xl sm:text-5xl tracking-widest text-indigo-400">
              {formatTimer(timerSeconds)}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5 pb-3">
            {[
              { label: "2m", sec: 120 },
              { label: "5m", sec: 300 },
              { label: "10m", sec: 600 },
              { label: "15m", sec: 900 },
            ].map(({ label, sec }) => (
              <button
                key={sec}
                type="button"
                onClick={() => handleSetPreset(sec)}
                className={`py-1 text-[10px] font-bold rounded-lg border transition ${
                  initialSeconds === sec && !isTimerRunning
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            {!isTimerRunning ? (
              <Button
                variant="default"
                size="sm"
                onClick={handleStartTimer}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5"
              >
                <Play className="h-3.5 w-3.5 fill-white" />
                <span>Start</span>
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handlePauseTimer}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5"
              >
                <Pause className="h-3.5 w-3.5 fill-white" />
                <span>Pause</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetTimer}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs px-3"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ─── FLOATING DICE WIDGET ─── */}
      {isDiceOpen && (
        <div className="fixed md:absolute inset-x-3 md:inset-x-auto md:left-20 top-20 z-40 w-auto md:w-64 max-w-xs mx-auto rounded-2xl bg-slate-900/98 backdrop-blur-md border border-slate-700/80 p-4 shadow-2xl animate-in fade-in zoom-in-95 text-white">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-400">
              <Dices className="h-4 w-4" />
              <span>Interactive Dice</span>
            </div>
            <button
              type="button"
              onClick={() => setIsDiceOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex flex-col items-center justify-center py-4">
            <div
              className={`flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black text-4xl shadow-lg border-2 border-white/60 transition-transform ${
                isRolling ? "rotate-180 scale-90" : "scale-100"
              }`}
            >
              {diceValue}
            </div>
            <span className="text-[11px] text-slate-400 mt-2 font-medium">
              {isRolling ? "Rolling..." : `Rolled a ${diceValue}!`}
            </span>
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={rollDice}
            disabled={isRolling}
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/30"
          >
            {isRolling ? "Rolling..." : "Roll Dice 🎲"}
          </Button>
        </div>
      )}

      {/* ─── TUTOR PRAISE TROPHY MODAL ─── */}
      {isTrophyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-amber-500/40 p-5 sm:p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Award Praise Trophy</h3>
                  <p className="text-[11px] text-slate-400">Reward {studentName} for great performance</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTrophyModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Select Compliment / Reason
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {praisePresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSelectedPraise(preset)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold text-left transition ${
                      selectedPraise === preset
                        ? "bg-amber-500/15 border-amber-500/60 text-amber-300"
                        : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span>{preset}</span>
                    {selectedPraise === preset && <Check className="h-4 w-4 text-amber-400" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <input
                type="text"
                placeholder="Or write custom feedback note..."
                value={selectedPraise}
                onChange={(e) => setSelectedPraise(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTrophyModalOpen(false)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  onAwardTrophy(selectedPraise);
                  setIsTrophyModalOpen(false);
                }}
                className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black text-xs gap-1.5 shadow-md shadow-amber-500/30"
              >
                <Sparkles className="h-4 w-4" />
                <span>Send Trophy (+1 🏆)</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
