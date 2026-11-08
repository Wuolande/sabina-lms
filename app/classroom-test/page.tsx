"use client";

import * as React from "react";
import Link from "next/link";
import {
  Video,
  GraduationCap,
  UserCheck,
  Copy,
  Check,
  ExternalLink,
  RotateCcw,
  Columns,
  Smartphone,
  Sparkles,
  PenTool,
  FileText,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const SANDBOX_ID = "test-classroom";

export default function ClassroomTestHubPage() {
  const [origin, setOrigin] = React.useState("");
  const [copiedRole, setCopiedRole] = React.useState<"TUTOR" | "STUDENT" | null>(null);
  const [isResetting, setIsResetting] = React.useState(false);
  const [resetSuccess, setResetSuccess] = React.useState(false);
  const [splitPreviewActive, setSplitPreviewActive] = React.useState(false);
  const [simulatorSplitPct, setSimulatorSplitPct] = React.useState<number>(50);
  const [isDraggingSimSplit, setIsDraggingSimSplit] = React.useState(false);
  const simulatorContainerRef = React.useRef<HTMLDivElement | null>(null);

  const handleStartSimResize = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingSimSplit(true);
    const container = simulatorContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const onMove = (moveEvent: PointerEvent) => {
      const relX = moveEvent.clientX - rect.left;
      const pct = (relX / Math.max(1, rect.width)) * 100;
      setSimulatorSplitPct(Math.max(20, Math.min(80, pct)));
    };

    const onUp = () => {
      setIsDraggingSimSplit(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const tutorPath = `/lessons/${SANDBOX_ID}/classroom?testRole=TUTOR`;
  const studentPath = `/lessons/${SANDBOX_ID}/classroom?testRole=STUDENT`;

  const tutorFullUrl = origin ? `${origin}${tutorPath}` : tutorPath;
  const studentFullUrl = origin ? `${origin}${studentPath}` : studentPath;

  const handleCopy = (role: "TUTOR" | "STUDENT", url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedRole(role);
    setTimeout(() => setCopiedRole(null), 2000);
  };

  const handleResetSandbox = async () => {
    setIsResetting(true);
    setResetSuccess(false);
    try {
      await fetch(`/api/classroom/lesson/${SANDBOX_ID}?testRole=TUTOR`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetSandbox: true, testRole: "TUTOR" }),
      });
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to reset sandbox:", err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                Sabina Live Classroom Testing Sandbox
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                No Login / Booking Required
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Instant 2-way classroom environment to test Tutor &amp; Student views on computer and mobile
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSplitPreviewActive(!splitPreviewActive)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
              splitPreviewActive
                ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/25"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
            }`}
          >
            <Columns className="w-4 h-4" />
            <span>{splitPreviewActive ? "Exit Split Simulator" : "Side-by-Side Split Simulator"}</span>
          </button>

          <button
            type="button"
            onClick={handleResetSandbox}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
            <span>{resetSuccess ? "Sandbox Reset!" : "Reset Board & Notes"}</span>
          </button>
        </div>
      </header>

      {/* Split Screen Dual Simulator Mode (Resizable Left/Right Panes) */}
      {splitPreviewActive ? (
        <div
          ref={simulatorContainerRef}
          className="flex-1 flex flex-col lg:flex-row p-2 bg-slate-950 min-h-[calc(100vh-76px)] select-none"
        >
          <div
            style={{ width: `${simulatorSplitPct}%` }}
            className="flex flex-col rounded-2xl overflow-hidden border border-indigo-500/40 bg-slate-900 min-w-[260px] flex-1 lg:flex-none"
          >
            <div className="bg-indigo-950/80 px-3 py-1.5 text-xs font-bold text-indigo-200 flex items-center justify-between border-b border-indigo-500/30">
              <span>👨‍🏫 Left Screen: TUTOR VIEW (Alex Rivera)</span>
              <Link
                href={tutorPath}
                target="_blank"
                className="text-[11px] text-indigo-300 hover:text-white flex items-center gap-1"
              >
                <span>Full Screen</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <iframe
              src={tutorPath}
              className={`w-full flex-1 min-h-[600px] border-0 ${
                isDraggingSimSplit ? "pointer-events-none" : ""
              }`}
              allow="camera; microphone; display-capture; clipboard-write"
            />
          </div>

          {/* Draggable Vertical Splitter Between Tutor & Student Simulator */}
          <div
            onPointerDown={handleStartSimResize}
            onDoubleClick={() => setSimulatorSplitPct(50)}
            title="Drag left or right to resize Tutor vs. Student simulator panes (double-click to reset 50/50)"
            className="hidden lg:flex w-4 items-center justify-center cursor-col-resize group touch-none shrink-0"
          >
            <div
              className={`w-1.5 h-16 rounded-full transition ${
                isDraggingSimSplit
                  ? "bg-indigo-400 scale-y-110"
                  : "bg-slate-700 group-hover:bg-indigo-400"
              }`}
            />
          </div>

          <div
            style={{ width: `${100 - simulatorSplitPct}%` }}
            className="flex flex-col rounded-2xl overflow-hidden border border-emerald-500/40 bg-slate-900 min-w-[260px] flex-1 lg:flex-none mt-2 lg:mt-0"
          >
            <div className="bg-emerald-950/80 px-3 py-1.5 text-xs font-bold text-emerald-200 flex items-center justify-between border-b border-emerald-500/30">
              <span>🎓 Right Screen: STUDENT VIEW (Anne Ouma)</span>
              <Link
                href={studentPath}
                target="_blank"
                className="text-[11px] text-emerald-300 hover:text-white flex items-center gap-1"
              >
                <span>Full Screen</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <iframe
              src={studentPath}
              className={`w-full flex-1 min-h-[600px] border-0 ${
                isDraggingSimSplit ? "pointer-events-none" : ""
              }`}
              allow="camera; microphone; display-capture; clipboard-write"
            />
          </div>
        </div>
      ) : (
        /* Standard Launcher Cards */
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
          {/* Role Launch Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TUTOR CARD */}
            <div className="rounded-3xl border border-indigo-500/40 bg-gradient-to-b from-indigo-950/40 to-slate-900 p-6 flex flex-col justify-between space-y-6 shadow-2xl">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-600 text-white">
                    <UserCheck className="w-3.5 h-3.5" /> Role 1: Tutor
                  </span>
                  <span className="text-xs text-indigo-300 font-semibold">Host Controls Enabled</span>
                </div>

                <h2 className="text-xl font-black text-white">Join as Tutor (Alex Rivera)</h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Includes full whiteboard control, Student Pen lock/unlock toggle, Student Remote Mute, Trophy awards, Lesson Time Extension (+5m/+10m/+15m), Live Notes, and File Sharing.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2">
                  <input
                    type="text"
                    readOnly
                    value={tutorFullUrl}
                    className="bg-transparent text-[11px] text-slate-300 font-mono flex-1 focus:outline-none truncate"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy("TUTOR", tutorFullUrl)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] font-bold shrink-0 transition"
                  >
                    {copiedRole === "TUTOR" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex gap-2.5">
                  <Link href={tutorPath} className="flex-1">
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs py-3 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25">
                      <span>Enter as Tutor Here</span>
                    </Button>
                  </Link>
                  <a href={tutorPath} target="_blank" rel="noreferrer">
                    <Button
                      variant="outline"
                      className="border-indigo-500/40 text-indigo-200 hover:bg-indigo-950/60 text-xs py-3 px-4 flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>New Tab</span>
                    </Button>
                  </a>
                </div>
              </div>
            </div>

            {/* STUDENT CARD */}
            <div className="rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-emerald-950/40 to-slate-900 p-6 flex flex-col justify-between space-y-6 shadow-2xl">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-600 text-white">
                    <GraduationCap className="w-3.5 h-3.5" /> Role 2: Student
                  </span>
                  <span className="text-xs text-emerald-300 font-semibold">Mobile &amp; Desktop Ready</span>
                </div>

                <h2 className="text-xl font-black text-white">Join as Student (Anne Ouma)</h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Open this link in a second tab, another browser, or on your mobile phone. Draw collaboratively on the board, edit Live Notes together, raise hand, and receive trophies in real time.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2">
                  <input
                    type="text"
                    readOnly
                    value={studentFullUrl}
                    className="bg-transparent text-[11px] text-slate-300 font-mono flex-1 focus:outline-none truncate"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy("STUDENT", studentFullUrl)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[11px] font-bold shrink-0 transition"
                  >
                    {copiedRole === "STUDENT" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex gap-2.5">
                  <Link href={studentPath} className="flex-1">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25">
                      <span>Enter as Student Here</span>
                    </Button>
                  </Link>
                  <a href={studentPath} target="_blank" rel="noreferrer">
                    <Button
                      variant="outline"
                      className="border-emerald-500/40 text-emerald-200 hover:bg-emerald-950/60 text-xs py-3 px-4 flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>New Tab</span>
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* What to Test Checklist */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Quick Testing Guide (Desktop + Mobile Phone)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-400 font-bold">
                  <PenTool className="w-4 h-4" />
                  <span>1. Whiteboard Sync</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Draw shapes, equations, or freehand strokes on either screen. Watch them appear on the other participant&apos;s board at exact proportional coordinates.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <FileText className="w-4 h-4" />
                  <span>2. Live Notes Sharing</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Click <strong>Notes</strong> in the header/dock or open the <strong>Live Notes</strong> tab in the right sidebar. Type on one device and see it update live on the other.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center gap-2 text-sky-400 font-bold">
                  <Upload className="w-4 h-4" />
                  <span>3. File &amp; Link Sharing</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Open the <strong>Files</strong> tab in the sidebar to upload a PDF/image or share a link. Both Tutor and Student receive it immediately.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Smartphone className="w-4 h-4" />
                  <span>4. Mobile Ergonomics</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Open the Student link on your phone to test touch drawing on the canvas, the mobile bottom dock, and the Classroom Tools sheet.
                </p>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
