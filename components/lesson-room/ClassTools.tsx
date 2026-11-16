"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Hand, Smile, Star, Timer, X } from "lucide-react";

/**
 * Class tools shared by both people in a lesson: a countdown timer and stars from the tutor,
 * a raised hand from the student, and quick reactions from either. State travels over a
 * `ToolsChannel` (the lesson's LiveKit data channel) and is re-sent to anyone who joins late.
 */
export type ToolsMsg =
  | { t: "timer"; endsAt: number | null; total: number }
  | { t: "hand"; up: boolean }
  | { t: "star"; count: number }
  | { t: "react"; emoji: string; id: string }
  | { t: "sync-req" }
  | { t: "sync"; timer: { endsAt: number | null; total: number }; hand: boolean; stars: number };
export type ToolsChannel = { send: (m: ToolsMsg) => void; subscribe: (cb: (m: ToolsMsg) => void) => () => void };

const EMOJI = ["👍", "👏", "🎉", "❤️", "😂", "🤔"];
const MINUTES = [1, 2, 5, 10, 15];
const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export type ClassTools = ReturnType<typeof useClassTools>;

export function useClassTools(channel: ToolsChannel, role: "tutor" | "student", names: { student: string }) {
  const [timer, setTimer] = useState<{ endsAt: number | null; total: number }>({ endsAt: null, total: 0 });
  const [hand, setHand] = useState(false);
  const [stars, setStars] = useState(0);
  const [floats, setFloats] = useState<{ id: string; emoji: string; x: number }[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const state = useRef({ timer, hand, stars });
  state.current = { timer, hand, stars };

  const float = useCallback((emoji: string, id: string) => {
    setFloats((f) => [...f.slice(-11), { id, emoji, x: 20 + Math.random() * 60 }]);
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 2600);
  }, []);
  const say = useCallback((text: string) => {
    setToast(text);
    setTimeout(() => setToast((t) => (t === text ? null : t)), 4000);
  }, []);

  useEffect(
    () =>
      channel.subscribe((m) => {
        if (m.t === "timer") {
          setTimer({ endsAt: m.endsAt, total: m.total });
          if (m.endsAt && role === "student") say(`Timer started: ${Math.round(m.total / 60000)} min`);
        } else if (m.t === "hand") {
          setHand(m.up);
          if (m.up && role === "tutor") say(`${names.student} raised a hand`);
        } else if (m.t === "star") {
          setStars(m.count);
          if (role === "student") (say("You earned a star!"), float("⭐", `s${m.count}-${Date.now()}`));
        } else if (m.t === "react") float(m.emoji, m.id);
        else if (m.t === "sync-req") {
          const s = state.current;
          if (s.timer.endsAt || s.hand || s.stars) channel.send({ t: "sync", ...s });
        } else if (m.t === "sync") {
          setTimer(m.timer);
          setHand(m.hand);
          setStars((c) => Math.max(c, m.stars));
        }
      }),
    [channel, role, names.student, say, float],
  );
  useEffect(() => channel.send({ t: "sync-req" }), [channel]);

  // Tick while a timer runs; announce when it ends.
  const running = Boolean(timer.endsAt);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [running]);
  const left = timer.endsAt ? timer.endsAt - now : 0;
  const done = running && left <= 0;
  useEffect(() => {
    if (!done) return;
    say("Time's up");
    const t = setTimeout(() => setTimer({ endsAt: null, total: 0 }), 6000);
    return () => clearTimeout(t);
  }, [done, say]);

  return {
    role,
    timer,
    left,
    done,
    hand,
    stars,
    floats,
    toast,
    startTimer: (minutes: number) => {
      const next = { endsAt: Date.now() + minutes * 60_000, total: minutes * 60_000 };
      setTimer(next);
      setNow(Date.now());
      channel.send({ t: "timer", ...next });
    },
    stopTimer: () => {
      setTimer({ endsAt: null, total: 0 });
      channel.send({ t: "timer", endsAt: null, total: 0 });
    },
    setHand: (up: boolean) => {
      setHand(up);
      channel.send({ t: "hand", up });
    },
    giveStar: () => {
      const count = state.current.stars + 1;
      setStars(count);
      float("⭐", `s${count}-${Date.now()}`);
      channel.send({ t: "star", count });
    },
    react: (emoji: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      float(emoji, id);
      channel.send({ t: "react", emoji, id });
    },
  };
}

/** The chips at the top of the classroom (timer, stars, raised hand) and floating reactions. */
export function ClassStatus({ tools, studentName, light = false }: { tools: ClassTools; studentName: string; light?: boolean }) {
  const chip = light ? "bg-white text-slate-900 ring-1 ring-slate-200 shadow-sm" : "bg-[#1c1c1e]/80 text-white ring-1 ring-white/10 backdrop-blur-xl";
  const running = Boolean(tools.timer.endsAt);
  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-2" aria-live="polite">
        {running && (
          <span data-testid="class-timer" className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold tabular-nums ${tools.done ? "animate-pulse bg-[#ff453a] text-white" : tools.left < 30_000 ? "bg-[#ff9f0a] text-black" : chip}`}>
            <Timer size={15} /> {tools.done ? "Time's up" : mmss(tools.left)}
            {tools.role === "tutor" && (
              <button type="button" onClick={tools.stopTimer} aria-label="Stop timer" className="-mr-1 grid h-5 w-5 place-items-center rounded-full hover:bg-black/15">
                <X size={12} />
              </button>
            )}
          </span>
        )}
        {tools.stars > 0 && (
          <span data-testid="class-stars" className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold ${chip}`} title={`${studentName}'s stars this lesson`}>
            <Star size={15} className="fill-[#ffd60a] text-[#ffd60a]" /> {tools.stars}
          </span>
        )}
        {tools.hand && (
          <span data-testid="class-hand" className="inline-flex items-center gap-1.5 rounded-full bg-[#ffd60a] px-3 py-1.5 text-sm font-semibold text-black">
            <Hand size={15} /> {tools.role === "tutor" ? `${studentName} has a question` : "Hand raised"}
            {tools.role === "tutor" && (
              <button type="button" onClick={() => tools.setHand(false)} aria-label="Lower hand" className="-mr-1 grid h-5 w-5 place-items-center rounded-full hover:bg-black/15">
                <X size={12} />
              </button>
            )}
          </span>
        )}
      </div>
      {tools.toast && (
        <p role="status" className={`pointer-events-none fixed left-1/2 top-28 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-medium shadow-2xl ${chip}`}>
          {tools.toast}
        </p>
      )}
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 bottom-28 z-40 h-0">
        {tools.floats.map((f) => (
          <span key={f.id} className="sb-float absolute text-4xl" style={{ left: `${f.x}%` }}>
            {f.emoji}
          </span>
        ))}
      </div>
      <style>{`@keyframes sb-float{0%{transform:translateY(0) scale(.6);opacity:0}15%{opacity:1;transform:translateY(-40px) scale(1.1)}100%{transform:translateY(-320px) scale(1);opacity:0}}.sb-float{animation:sb-float 2.5s ease-out forwards}@media (prefers-reduced-motion: reduce){.sb-float{animation-duration:.01s}}`}</style>
    </>
  );
}

/** The pop-up with reactions, raise hand (student), and timer + star (tutor). */
export function ClassToolsMenu({ tools, studentName, onClose, light = false, onMini }: { tools: ClassTools; studentName: string; onClose: () => void; light?: boolean; onMini?: (prompt: string) => void }) {
  const [question, setQuestion] = useState("");
  const panel = light ? "bg-white text-slate-900 ring-1 ring-slate-200 shadow-xl" : "bg-[#1c1c1e]/95 text-white ring-1 ring-white/10 backdrop-blur-2xl shadow-2xl";
  const pill = light ? "bg-slate-100 hover:bg-slate-200" : "bg-white/10 hover:bg-white/20";
  const muted = light ? "text-slate-500" : "text-white/50";
  const first = studentName.split(" ")[0];
  return (
    <div role="dialog" aria-label="Class tools" className={`w-[19rem] max-w-[calc(100vw-1.5rem)] rounded-[24px] p-4 ${panel}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold">Class tools</h2>
        <button type="button" onClick={onClose} aria-label="Close class tools" className={`grid h-8 w-8 place-items-center rounded-full ${pill}`}>
          <X size={15} />
        </button>
      </div>
      <p className={`mt-3 text-xs font-medium uppercase tracking-wide ${muted}`}>React</p>
      <div className="mt-1.5 flex gap-1.5">
        {EMOJI.map((e) => (
          <button key={e} type="button" aria-label={`React ${e}`} onClick={() => tools.react(e)} className={`grid h-10 flex-1 place-items-center rounded-xl text-xl ${pill}`}>
            {e}
          </button>
        ))}
      </div>
      {tools.role === "student" ? (
        <button type="button" aria-pressed={tools.hand} onClick={() => tools.setHand(!tools.hand)} className={`mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold ${tools.hand ? "bg-[#ffd60a] text-black" : pill}`}>
          <Hand size={17} /> {tools.hand ? "Lower hand" : "Raise hand"}
        </button>
      ) : (
        <>
          <p className={`mt-4 text-xs font-medium uppercase tracking-wide ${muted}`}>Timer</p>
          <div className="mt-1.5 flex gap-1.5">
            {MINUTES.map((m) => (
              <button key={m} type="button" aria-label={`Start a ${m} minute timer`} onClick={() => tools.startTimer(m)} className={`h-10 flex-1 rounded-xl text-sm font-semibold ${pill}`}>
                {m}m
              </button>
            ))}
          </div>
          {onMini && (
            <>
              <p className={`mt-4 text-xs font-medium uppercase tracking-wide ${muted}`}>Mini blackboard</p>
              <form
                className="mt-1.5 flex gap-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  onMini(question);
                  setQuestion("");
                  onClose();
                }}
              >
                <input value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={200} aria-label="Question for the mini blackboard" placeholder="Question (optional)" className={`h-10 min-w-0 flex-1 rounded-xl border-0 px-3 text-sm outline-none ${light ? "bg-slate-100 text-slate-900 placeholder:text-slate-400" : "bg-white/10 text-white placeholder:text-white/40"}`} />
                <button type="submit" className={`h-10 shrink-0 rounded-xl px-3 text-sm font-semibold ${pill}`}>
                  Hand out
                </button>
              </form>
            </>
          )}
          <button type="button" onClick={tools.giveStar} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#ffd60a] text-sm font-semibold text-black hover:brightness-95">
            <Star size={17} className="fill-current" /> Give {first} a star
          </button>
        </>
      )}
    </div>
  );
}

export const ClassToolsIcon = Smile;
