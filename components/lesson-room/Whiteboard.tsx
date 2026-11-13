"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Circle, Download, Eraser, Grid3x3, Highlighter, Minus, Pencil, Square, Trash2, Undo2, X } from "lucide-react";

/**
 * A shared whiteboard. Everything is drawn in board coordinates (0–1 across, 0–1 down, at a
 * fixed 16:10 shape) so it lines up on any screen. Strokes travel over a `BoardChannel`: the
 * lesson's LiveKit data channel in the classroom.
 */
export type Tool = "pen" | "highlighter" | "line" | "rect" | "ellipse" | "eraser";
export type Stroke = { id: string; by: string; tool: Exclude<Tool, "eraser">; color: string; size: number; pts: number[] };
export type BoardMsg =
  | { t: "stroke"; s: Stroke }
  | { t: "live"; s: Stroke }
  | { t: "erase"; ids: string[] }
  | { t: "clear" }
  | { t: "grid"; on: boolean }
  | { t: "sync-req" }
  | { t: "sync"; strokes: Stroke[]; grid: boolean; part: number; parts: number };
export type BoardChannel = { send: (m: BoardMsg) => void; subscribe: (cb: (m: BoardMsg) => void) => () => void };

const RATIO = 10 / 16;
const COLORS = ["#0f172a", "#2563eb", "#dc2626", "#16a34a", "#f59e0b", "#9333ea"];
const SIZES = [2, 4, 8];
const round = (n: number) => Math.round(n * 10000) / 10000;
const uid = () => Math.random().toString(36).slice(2, 10);

function draw(ctx: CanvasRenderingContext2D, s: Stroke, w: number, h: number) {
  const p = s.pts;
  if (p.length < 2) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = s.color;
  ctx.globalAlpha = s.tool === "highlighter" ? 0.3 : 1;
  ctx.lineWidth = (s.tool === "highlighter" ? s.size * 4 : s.size) * (w / 1000);
  ctx.beginPath();
  const x0 = p[0]! * w, y0 = p[1]! * h;
  const x1 = p[p.length - 2]! * w, y1 = p[p.length - 1]! * h;
  if (s.tool === "line") {
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
  } else if (s.tool === "rect") {
    ctx.rect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
  } else if (s.tool === "ellipse") {
    ctx.ellipse((x0 + x1) / 2, (y0 + y1) / 2, Math.abs(x1 - x0) / 2, Math.abs(y1 - y0) / 2, 0, 0, Math.PI * 2);
  } else {
    ctx.moveTo(x0, y0);
    if (p.length === 2) ctx.lineTo(x0 + 0.01, y0);
    // Smooth the line through midpoints.
    for (let i = 2; i < p.length - 2; i += 2) {
      const mx = ((p[i]! + p[i + 2]!) / 2) * w, my = ((p[i + 1]! + p[i + 3]!) / 2) * h;
      ctx.quadraticCurveTo(p[i]! * w, p[i + 1]! * h, mx, my);
    }
    if (p.length > 2) ctx.lineTo(x1, y1);
  }
  ctx.stroke();
  ctx.restore();
}

/** Does a point (board units) touch a stroke? Used by the eraser. */
function hits(s: Stroke, x: number, y: number, r: number) {
  const p = s.pts;
  if (s.tool === "rect" || s.tool === "ellipse" || s.tool === "line") {
    const [x0, y0, x1, y1] = [p[0]!, p[1]!, p[p.length - 2]!, p[p.length - 1]!];
    const minX = Math.min(x0, x1) - r, maxX = Math.max(x0, x1) + r, minY = Math.min(y0, y1) - r, maxY = Math.max(y0, y1) + r;
    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  }
  for (let i = 0; i < p.length; i += 2) if (Math.hypot(p[i]! - x, (p[i + 1]! - y) * RATIO) < r) return true;
  return false;
}

export function Whiteboard({ channel, me, onClose, light = false }: { channel: BoardChannel; me: string; onClose?: () => void; light?: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 800, h: 500 });
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [live, setLive] = useState<Record<string, Stroke>>({});
  const [grid, setGrid] = useState(false);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0]!);
  const [width, setWidth] = useState(SIZES[1]!);
  const current = useRef<Stroke | null>(null);
  const lastSent = useRef(0);
  const syncParts = useRef<Stroke[]>([]);

  // Fit a 16:10 board into the space available.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const fit = () => {
      const r = el.getBoundingClientRect();
      const w = Math.min(r.width, r.height / RATIO);
      setSize({ w: Math.floor(w), h: Math.floor(w * RATIO) });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Paint.
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = size.w * dpr;
    c.height = size.h * dpr;
    const ctx = c.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size.w, size.h);
    if (grid) {
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      const step = size.w / 32;
      for (let x = step; x < size.w; x += step) (ctx.beginPath(), ctx.moveTo(x, 0), ctx.lineTo(x, size.h), ctx.stroke());
      for (let y = step; y < size.h; y += step) (ctx.beginPath(), ctx.moveTo(0, y), ctx.lineTo(size.w, y), ctx.stroke());
    }
    for (const s of strokes) draw(ctx, s, size.w, size.h);
    for (const s of Object.values(live)) draw(ctx, s, size.w, size.h);
  }, [strokes, live, size, grid]);

  // Messages from the other side.
  useEffect(
    () =>
      channel.subscribe((m) => {
        if (m.t === "stroke") {
          setStrokes((cur) => (cur.some((s) => s.id === m.s.id) ? cur : [...cur, m.s]));
          setLive(({ [m.s.id]: _, ...rest }) => rest);
        } else if (m.t === "live") setLive((cur) => ({ ...cur, [m.s.id]: m.s }));
        else if (m.t === "erase") setStrokes((cur) => cur.filter((s) => !m.ids.includes(s.id)));
        else if (m.t === "clear") (setStrokes([]), setLive({}));
        else if (m.t === "grid") setGrid(m.on);
        else if (m.t === "sync") {
          if (m.part === 0) syncParts.current = [];
          syncParts.current.push(...m.strokes);
          if (m.part === m.parts - 1) {
            const got = syncParts.current;
            setStrokes((cur) => [...got, ...cur.filter((s) => !got.some((g) => g.id === s.id))]);
            setGrid(m.grid);
          }
        }
      }),
    [channel],
  );
  // Answer late joiners with the whole board, in small parts (data messages have a size limit).
  const latest = useRef({ strokes, grid });
  latest.current = { strokes, grid };
  useEffect(
    () =>
      channel.subscribe((m) => {
        if (m.t !== "sync-req") return;
        const all = latest.current.strokes;
        const chunks: Stroke[][] = [];
        let cur: Stroke[] = [];
        let bytes = 0;
        for (const s of all) {
          const n = s.pts.length * 7 + 80;
          if (bytes + n > 12000 && cur.length) (chunks.push(cur), (cur = []), (bytes = 0));
          cur.push(s);
          bytes += n;
        }
        chunks.push(cur);
        chunks.forEach((c, i) => channel.send({ t: "sync", strokes: c, grid: latest.current.grid, part: i, parts: chunks.length }));
      }),
    [channel],
  );
  useEffect(() => channel.send({ t: "sync-req" }), [channel]);

  const at = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return [round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))), round(Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)))] as const;
  };
  const eraseAt = useCallback(
    (x: number, y: number) => {
      const gone = strokes.filter((s) => hits(s, x, y, 0.012)).map((s) => s.id);
      if (!gone.length) return;
      setStrokes((cur) => cur.filter((s) => !gone.includes(s.id)));
      channel.send({ t: "erase", ids: gone });
    },
    [strokes, channel],
  );

  function down(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const [x, y] = at(e);
    if (tool === "eraser") return eraseAt(x, y);
    current.current = { id: uid(), by: me, tool, color, size: width, pts: [x, y] };
    setLive((l) => ({ ...l, mine: current.current! }));
  }
  function move(e: React.PointerEvent) {
    if (e.buttons !== 1 && e.pointerType === "mouse") return;
    const [x, y] = at(e);
    if (tool === "eraser") return e.buttons ? eraseAt(x, y) : undefined;
    const s = current.current;
    if (!s) return;
    if (s.tool === "pen" || s.tool === "highlighter") {
      const n = s.pts.length;
      if (Math.hypot(s.pts[n - 2]! - x, s.pts[n - 1]! - y) < 0.002) return;
      s.pts.push(x, y);
    } else s.pts = [s.pts[0]!, s.pts[1]!, x, y];
    setLive((l) => ({ ...l, mine: { ...s, pts: [...s.pts] } }));
    if (Date.now() - lastSent.current > 60) {
      lastSent.current = Date.now();
      channel.send({ t: "live", s });
    }
  }
  function up() {
    const s = current.current;
    current.current = null;
    setLive(({ mine: _, ...rest }) => rest);
    if (!s || s.pts.length < 2) return;
    setStrokes((cur) => [...cur, s]);
    channel.send({ t: "stroke", s });
  }

  function undo() {
    const mine = [...strokes].reverse().find((s) => s.by === me);
    if (!mine) return;
    setStrokes((cur) => cur.filter((s) => s.id !== mine.id));
    channel.send({ t: "erase", ids: [mine.id] });
  }
  function clear() {
    if (!window.confirm("Clear the whiteboard for everyone?")) return;
    setStrokes([]);
    channel.send({ t: "clear" });
  }
  function save() {
    const a = document.createElement("a");
    a.href = canvas.current!.toDataURL("image/png");
    a.download = `whiteboard-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.png`;
    a.click();
  }

  const btn = (on: boolean) => `grid h-10 w-10 place-items-center rounded-xl transition ${on ? (light ? "bg-slate-900 text-white" : "bg-white text-black") : light ? "text-slate-600 hover:bg-slate-100" : "text-white/80 hover:bg-white/10"}`;
  const TOOLS: { t: Tool; label: string; icon: React.ReactNode }[] = [
    { t: "pen", label: "Pen", icon: <Pencil size={18} /> },
    { t: "highlighter", label: "Highlighter", icon: <Highlighter size={18} /> },
    { t: "line", label: "Line", icon: <Minus size={18} className="-rotate-45" /> },
    { t: "rect", label: "Rectangle", icon: <Square size={17} /> },
    { t: "ellipse", label: "Circle", icon: <Circle size={17} /> },
    { t: "eraser", label: "Eraser", icon: <Eraser size={18} /> },
  ];
  const sep = <span aria-hidden="true" className={`mx-0.5 h-6 w-px ${light ? "bg-slate-200" : "bg-white/15"}`} />;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3" aria-label="Whiteboard">
      <div role="toolbar" aria-label="Whiteboard tools" className={`flex flex-wrap items-center gap-1 self-center rounded-2xl p-1.5 ${light ? "bg-white shadow-sm ring-1 ring-slate-200" : "bg-[#1c1c1e]/90 ring-1 ring-white/10 backdrop-blur-xl"}`}>
        {TOOLS.map((x) => (
          <button key={x.t} type="button" aria-label={x.label} title={x.label} aria-pressed={tool === x.t} onClick={() => setTool(x.t)} className={btn(tool === x.t)}>
            {x.icon}
          </button>
        ))}
        {sep}
        {COLORS.map((c) => (
          <button key={c} type="button" aria-label={`Colour ${c}`} aria-pressed={color === c} onClick={() => (setColor(c), tool === "eraser" && setTool("pen"))} className="grid h-10 w-8 place-items-center">
            <span className={`h-6 w-6 rounded-full ring-2 ring-offset-2 ${light ? "ring-offset-white" : "ring-offset-[#1c1c1e]"} ${color === c ? (light ? "ring-slate-900" : "ring-white") : "ring-transparent"}`} style={{ background: c }} />
          </button>
        ))}
        {sep}
        {SIZES.map((s) => (
          <button key={s} type="button" aria-label={`Line ${s === 2 ? "thin" : s === 4 ? "medium" : "thick"}`} aria-pressed={width === s} onClick={() => setWidth(s)} className={btn(width === s)}>
            <span className="rounded-full bg-current" style={{ width: s + 3, height: s + 3 }} />
          </button>
        ))}
        {sep}
        <button type="button" aria-label="Squared paper" title="Squared paper" aria-pressed={grid} onClick={() => (setGrid(!grid), channel.send({ t: "grid", on: !grid }))} className={btn(grid)}>
          <Grid3x3 size={18} />
        </button>
        <button type="button" aria-label="Undo my last line" title="Undo" onClick={undo} className={btn(false)}>
          <Undo2 size={18} />
        </button>
        <button type="button" aria-label="Clear board" title="Clear board" onClick={clear} className={btn(false)}>
          <Trash2 size={18} />
        </button>
        <button type="button" aria-label="Save as image" title="Save as image" onClick={save} className={btn(false)}>
          <Download size={18} />
        </button>
        {onClose && (
          <>
            {sep}
            <button type="button" aria-label="Close whiteboard" title="Close whiteboard" onClick={onClose} className={btn(false)}>
              <X size={18} />
            </button>
          </>
        )}
      </div>
      <div ref={wrap} className="grid min-h-0 flex-1 place-items-center">
        <canvas
          ref={canvas}
          data-testid="whiteboard"
          data-strokes={strokes.length}
          style={{ width: size.w, height: size.h, touchAction: "none", cursor: tool === "eraser" ? "cell" : "crosshair" }}
          className="rounded-2xl shadow-2xl"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        />
      </div>
    </div>
  );
}
