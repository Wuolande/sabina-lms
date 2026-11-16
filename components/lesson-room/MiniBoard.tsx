"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import { CheckCircle2, CopyPlus, GripHorizontal, Send, X } from "lucide-react";
import { useFloatingBox, useWide } from "./resize";
import { Whiteboard, type BoardChannel, type WhiteboardHandle } from "./Whiteboard";

/**
 * Mini blackboard: the tutor hands the student a small board with a question; the student works
 * on it and hands it in; the tutor watches live and can copy the answer onto the main board.
 */
export type MiniMsg = { t: "open"; prompt: string; id: string } | { t: "close" } | { t: "done" } | { t: "sync-req" } | { t: "sync"; open: boolean; prompt: string; id: string; done: boolean };
export type MiniChannel = { send: (m: MiniMsg) => void; subscribe: (cb: (m: MiniMsg) => void) => () => void };
export type Mini = ReturnType<typeof useMiniBoard>;

export function useMiniBoard(ctl: MiniChannel, role: "tutor" | "student", board: RefObject<WhiteboardHandle | null>) {
  const [st, setSt] = useState({ open: false, prompt: "", id: "", done: false });
  const [note, setNote] = useState<string | null>(null);
  const cur = useRef(st);
  cur.current = st;
  useEffect(
    () =>
      ctl.subscribe((m) => {
        if (m.t === "open") {
          setSt({ open: true, prompt: m.prompt, id: m.id, done: false });
          if (role === "student") setNote("Your tutor gave you a mini blackboard");
        } else if (m.t === "close") setSt((s) => ({ ...s, open: false }));
        else if (m.t === "done") {
          setSt((s) => ({ ...s, done: true }));
          if (role === "tutor") setNote("The mini blackboard was handed in");
        } else if (m.t === "sync-req") {
          if (cur.current.open) ctl.send({ t: "sync", ...cur.current });
        } else if (m.t === "sync") setSt({ open: m.open, prompt: m.prompt, id: m.id, done: m.done });
      }),
    [ctl, role],
  );
  useEffect(() => ctl.send({ t: "sync-req" }), [ctl]);
  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(null), 4000);
    return () => clearTimeout(t);
  }, [note]);
  return {
    ...st,
    role,
    note,
    board,
    start: (prompt: string) => {
      const next = { open: true, prompt: prompt.trim().slice(0, 200), id: Math.random().toString(36).slice(2, 8), done: false };
      board.current?.reset();
      setSt(next);
      ctl.send({ t: "open", prompt: next.prompt, id: next.id });
    },
    close: () => {
      setSt((s) => ({ ...s, open: false }));
      ctl.send({ t: "close" });
    },
    handIn: () => {
      setSt((s) => ({ ...s, done: true }));
      ctl.send({ t: "done" });
    },
  };
}

/** The floating mini board. Always mounted so its drawings and messages aren't lost while closed. */
export function MiniBoardPanel({ mini, channel, me, onCopy, light = false }: { mini: Mini; channel: BoardChannel; me: string; onCopy?: () => void; light?: boolean }) {
  const tutor = mini.role === "tutor";
  const wide = useWide(640);
  const float = useFloatingBox("sabina.room.mini", () => ({ x: 20, y: Math.max(16, window.innerHeight - 128 - 416), w: 480, h: 416 }), { minW: 320, minH: 300, maxW: 1000, maxH: 800 });
  const placed = wide && float.box ? { left: float.box.x, top: float.box.y, width: float.box.w, height: float.box.h, right: "auto", bottom: "auto" } : undefined;
  const panel = light ? "bg-white text-slate-900 ring-1 ring-slate-200 shadow-2xl" : "bg-[#1c1c1e]/95 text-white ring-1 ring-white/10 shadow-2xl backdrop-blur-2xl";
  const pill = light ? "bg-slate-100 hover:bg-slate-200" : "bg-white/10 hover:bg-white/20";
  return (
    <>
      <section
        aria-label="Mini blackboard"
        data-testid="mini-board"
        data-open={mini.open}
        className={`${mini.open ? "flex" : "hidden"} fixed inset-x-2 bottom-[5.5rem] top-16 z-30 flex-col gap-2 rounded-[24px] p-3 sm:inset-x-auto sm:bottom-32 sm:left-5 sm:top-auto sm:h-[26rem] sm:w-[30rem] ${panel}`}
        style={placed}
      >
        <header className={`flex items-start gap-2 ${wide ? "cursor-grab touch-none active:cursor-grabbing" : ""}`} {...(wide ? float.handle : {})} title={wide ? "Drag to move" : undefined} onDoubleClick={wide ? float.reset : undefined}>
          {wide && <GripHorizontal size={16} className={`mt-1 shrink-0 ${light ? "text-slate-400" : "text-white/40"}`} aria-hidden="true" />}
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold">Mini blackboard</h2>
            <p className={`text-sm ${light ? "text-slate-600" : "text-white/70"}`}>{mini.prompt || (tutor ? "Watch the student work here." : "Work out your answer here.")}</p>
          </div>
          {mini.done && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#30d158]/20 px-2.5 py-1 text-xs font-semibold text-[#30d158]">
              <CheckCircle2 size={13} /> Handed in
            </span>
          )}
          {tutor && (
            <button type="button" onClick={mini.close} aria-label="Close mini blackboard" className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${pill}`}>
              <X size={15} />
            </button>
          )}
        </header>
        <div className="min-h-0 flex-1">
          <Whiteboard ref={mini.board} channel={channel} me={me} role="tutor" compact light={light} />
        </div>
        <footer className="flex flex-wrap gap-2">
          {tutor ? (
            <button type="button" onClick={onCopy} className="inline-flex h-10 items-center gap-2 rounded-full bg-brand-700 px-4 text-sm font-semibold text-white">
              <CopyPlus size={16} /> Copy to the board
            </button>
          ) : (
            <button type="button" onClick={mini.handIn} disabled={mini.done} className="inline-flex h-10 items-center gap-2 rounded-full bg-brand-700 px-4 text-sm font-semibold text-white disabled:opacity-50">
              <Send size={15} /> {mini.done ? "Handed in" : "Hand in"}
            </button>
          )}
        </footer>
        {wide && <span role="separator" aria-label="Resize mini blackboard" title="Drag to resize" {...float.grip} className={`absolute bottom-1.5 right-1.5 h-4 w-4 cursor-se-resize touch-none rounded-br-[18px] border-b-2 border-r-2 ${light ? "border-slate-400" : "border-white/50"}`} />}
      </section>
      {mini.note && (
        <p role="status" className={`pointer-events-none fixed left-1/2 top-40 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-medium ${panel}`}>
          {mini.note}
        </p>
      )}
    </>
  );
}
