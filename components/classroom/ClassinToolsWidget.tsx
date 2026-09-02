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
  Volume2,
  Sparkles,
  Check,
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
}

export function ClassinToolsWidget({
  isTutor,
  studentName = "Student",
  onAwardTrophy,
  onRaiseHand,
  isHandRaised = false,
  onSyncTimer,
  syncedTimerState,
}: ClassinToolsWidgetProps) {
  // Widget open states
  const [isTimerOpen, setIsTimerOpen] = React.useState(false);
  const [isDiceOpen, setIsDiceOpen] = React.useState(false);
  const [isTrophyModalOpen, setIsTrophyModalOpen] = React.useState(false);

  // Timer internal state
  const [timerSeconds, setTimerSeconds] = React.useState(120); // default 2 mins
  const [initialSeconds, setInitialSeconds] = React.useState(120);
  const [isTimerRunning, setIsTimerRunning] = React.useState(false);

  // Sync with external synced timer state if provided
  React.useEffect(() => {
    if (syncedTimerState) {
      setTimerSeconds(syncedTimerState.seconds);
      setIsTimerRunning(syncedTimerState.isRunning);
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
            // Play alarm chime
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.type = "sine";
              osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
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

  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    let count = 0;
    const rollInterval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count > 12) {
        clearInterval(rollInterval);
        setIsRolling(false);
      }
    }, 80);
  };

  // Praise templates
  const [selectedPraise, setSelectedPraise] = React.useState("Great Answer! Excellent work!");
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
      {/* ─── FLOATING CLASSIN TOOLS PALETTE ─── */}
      <div className="absolute left-4 top-18 z-30 flex flex-col items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-2xl">
        {/* Timer Trigger */}
        <button
          type="button"
          onClick={() => setIsTimerOpen(!isTimerOpen)}
          title="Interactive Classroom Timer"
          className={`p-2.5 rounded-xl transition flex flex-col items-center gap-1 text-[10px] font-bold ${
            isTimerOpen || isTimerRunning
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-300 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Clock className="h-5 w-5" />
          <span>Timer</span>
        </button>

        {/* Dice Tool Trigger */}
        <button
          type="button"
          onClick={() => setIsDiceOpen(!isDiceOpen)}
          title="Interactive 3D Rolling Dice"
          className={`p-2.5 rounded-xl transition flex flex-col items-center gap-1 text-[10px] font-bold ${
            isDiceOpen
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
              : "text-slate-300 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Dices className="h-5 w-5" />
          <span>Dice</span>
        </button>

        {/* Tutor Trophy Praise Trigger (for Tutors) */}
        {isTutor && (
          <button
            type="button"
            onClick={() => setIsTrophyModalOpen(true)}
            title="Award Praise Trophy to Student"
            className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-bold transition flex flex-col items-center gap-1 text-[10px] hover:scale-105 shadow-md shadow-amber-500/20"
          >
            <Trophy className="h-5 w-5 fill-slate-950" />
            <span>Award</span>
          </button>
        )}

        {/* Student Raise Hand (for Students) */}
        {!isTutor && (
          <button
            type="button"
            onClick={onRaiseHand}
            title={isHandRaised ? "Hand is Raised (Click to Lower)" : "Raise Hand to Ask Question"}
            className={`p-2.5 rounded-xl transition flex flex-col items-center gap-1 text-[10px] font-bold ${
              isHandRaised
                ? "bg-amber-500 text-slate-950 animate-bounce shadow-md shadow-amber-500/40"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Hand className={`h-5 w-5 ${isHandRaised ? "fill-slate-950" : ""}`} />
            <span>{isHandRaised ? "Raised" : "Raise"}</span>
          </button>
        )}
      </div>

      {/* ─── FLOATING TIMER WIDGET ─── */}
      {isTimerOpen && (
        <div className="absolute left-20 top-18 z-40 w-72 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700/80 p-4 shadow-2xl animate-in fade-in slide-in-from-left-4 text-white">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-400">
              <Clock className="h-4 w-4" />
              <span>Exercise Countdown</span>
            </div>
            <button
              onClick={() => setIsTimerOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Large Countdown Display */}
          <div className="text-center py-4">
            <span
              className={`font-mono text-4xl font-black tracking-wider ${
                timerSeconds <= 10 && timerSeconds > 0
                  ? "text-rose-400 animate-pulse"
                  : timerSeconds === 0
                  ? "text-rose-500"
                  : "text-white"
              }`}
            >
              {formatTimer(timerSeconds)}
            </span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-4 gap-1.5 pb-3">
            {[
              { label: "30s", sec: 30 },
              { label: "1m", sec: 60 },
              { label: "2m", sec: 120 },
              { label: "3m", sec: 180 },
              { label: "5m", sec: 300 },
              { label: "10m", sec: 600 },
              { label: "15m", sec: 900 },
              { label: "20m", sec: 1200 },
            ].map(({ label, sec }) => (
              <button
                key={sec}
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

          {/* Controls */}
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
        <div className="absolute left-20 top-36 z-40 w-64 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700/80 p-4 shadow-2xl animate-in fade-in slide-in-from-left-4 text-white">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-400">
              <Dices className="h-4 w-4" />
              <span>Interactive Dice</span>
            </div>
            <button
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
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs gap-1.5 shadow-md shadow-amber-500/20"
          >
            <Dices className="h-4 w-4" />
            <span>{isRolling ? "Rolling..." : "Roll Dice"}</span>
          </Button>
        </div>
      )}

      {/* ─── AWARD TROPHY PRAISE MODAL (Tutor Only) ─── */}
      {isTrophyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-amber-500/40 p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] text-white space-y-4">
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
                onClick={() => setIsTrophyModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Praise Presets */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Select Compliment / Reason
              </label>
              <div className="space-y-1.5">
                {praisePresets.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setSelectedPraise(preset)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition flex items-center justify-between ${
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

            {/* Custom note */}
            <div>
              <input
                type="text"
                placeholder="Or write custom feedback note..."
                value={selectedPraise}
                onChange={(e) => setSelectedPraise(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>

            {/* Action Buttons */}
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
