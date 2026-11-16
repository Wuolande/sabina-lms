"use client";
import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import { ChevronLeft, ChevronRight, Circle, Download, Eraser, FileUp, Grid3x3, Highlighter, ImagePlus, Loader2, Lock, LockOpen, Minus, Pencil, Plus, Pointer, Square, Trash2, Type, Undo2, X } from "lucide-react";

/**
 * The lesson board: several pages, pen, highlighter, shapes, text, pictures, a laser pointer and
 * an eraser. Everything is drawn in board coordinates (0–1 across, 0–1 down, at a fixed 16:10
 * shape) so it lines up on any screen. Changes travel over a `BoardChannel`: the lesson's LiveKit
 * data channel in the classroom. The tutor leads: pages follow the tutor, and the tutor can lock
 * the board while explaining.
 */
export type Tool = "pen" | "highlighter" | "line" | "rect" | "ellipse" | "text" | "laser" | "eraser";
export type Stroke = { id: string; by: string; page: number; tool: "pen" | "highlighter" | "line" | "rect" | "ellipse" | "text" | "image"; color: string; size: number; pts: number[]; text?: string; src?: string };
export type BoardMsg =
  | { t: "stroke"; s: Stroke }
  | { t: "live"; s: Stroke }
  | { t: "erase"; ids: string[] }
  | { t: "clear"; page: number }
  | { t: "grid"; on: boolean }
  | { t: "page"; page: number; pages: number }
  | { t: "lock"; on: boolean }
  | { t: "laser"; by: string; page: number; x: number; y: number }
  | { t: "sync-req" }
  | { t: "sync"; strokes: Stroke[]; grid: boolean; page: number; pages: number; locked: boolean; part: number; parts: number };
export type BoardChannel = { send: (m: BoardMsg) => void; subscribe: (cb: (m: BoardMsg) => void) => () => void };
export type WhiteboardHandle = {
  exportPages: () => Promise<Blob[]>;
  /** Everything on the current page. */
  snapshot: () => Stroke[];
  /** Copy strokes onto the current page, squeezed into a box (board units), and share them. */
  paste: (strokes: Stroke[], box: { x: number; y: number; w: number; h: number }) => void;
  /** Wipe every page for everyone (used when a fresh mini blackboard is handed out). */
  reset: () => void;
};

const RATIO = 10 / 16;
const MAX_PAGES = 40;
const MAX_PDF_PAGES = 20;
const COLORS = ["#0f172a", "#0000FE", "#009EFF", "#dc2626", "#16a34a", "#f59e0b"];
const SIZES = [2, 4, 8];
const round = (n: number) => Math.round(n * 10000) / 10000;
const uid = () => Math.random().toString(36).slice(2, 10);
const images = new Map<string, HTMLImageElement>();

function imageFor(src: string, onLoad: () => void) {
  let img = images.get(src);
  if (!img) {
    img = new Image();
    img.onload = onLoad;
    img.src = src;
    images.set(src, img);
  }
  return img.complete && img.naturalWidth ? img : null;
}

function draw(ctx: CanvasRenderingContext2D, s: Stroke, w: number, h: number, redraw: () => void) {
  const p = s.pts;
  if (p.length < 2) return;
  const x0 = p[0]! * w, y0 = p[1]! * h;
  const x1 = p[p.length - 2]! * w, y1 = p[p.length - 1]! * h;
  ctx.save();
  if (s.tool === "image") {
    const img = s.src ? imageFor(s.src, redraw) : null;
    if (img) ctx.drawImage(img, Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
    else {
      ctx.strokeStyle = "#cbd5e1";
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
    }
    ctx.restore();
    return;
  }
  if (s.tool === "text") {
    ctx.fillStyle = s.color;
    ctx.textBaseline = "top";
    ctx.font = `${Math.round((s.size * 5 + 8) * (w / 1000))}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`;
    String(s.text ?? "").split("\n").forEach((line, i) => ctx.fillText(line, x0, y0 + i * (s.size * 5 + 8) * (w / 1000) * 1.25));
    ctx.restore();
    return;
  }
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = s.color;
  ctx.globalAlpha = s.tool === "highlighter" ? 0.3 : 1;
  ctx.lineWidth = (s.tool === "highlighter" ? s.size * 4 : s.size) * (w / 1000);
  ctx.beginPath();
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

function paint(ctx: CanvasRenderingContext2D, w: number, h: number, strokes: Stroke[], grid: boolean, redraw: () => void) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  if (grid) {
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    const step = w / 32;
    for (let x = step; x < w; x += step) (ctx.beginPath(), ctx.moveTo(x, 0), ctx.lineTo(x, h), ctx.stroke());
    for (let y = step; y < h; y += step) (ctx.beginPath(), ctx.moveTo(0, y), ctx.lineTo(w, y), ctx.stroke());
  }
  // Pictures sit underneath what's drawn on them.
  for (const s of strokes) if (s.tool === "image") draw(ctx, s, w, h, redraw);
  for (const s of strokes) if (s.tool !== "image") draw(ctx, s, w, h, redraw);
}

/** Does a point (board units) touch a stroke? Used by the eraser. */
function hits(s: Stroke, x: number, y: number, r: number) {
  const p = s.pts;
  if (s.tool === "text") {
    const lines = String(s.text ?? "").split("\n");
    const fh = (s.size * 5 + 8) / 1000 / RATIO;
    const fw = (Math.max(...lines.map((l) => l.length)) * (s.size * 5 + 8) * 0.55) / 1000;
    return x >= p[0]! - r && x <= p[0]! + fw + r && y >= p[1]! - r && y <= p[1]! + fh * 1.25 * lines.length + r;
  }
  if (s.tool === "rect" || s.tool === "ellipse" || s.tool === "line" || s.tool === "image") {
    const [x0, y0, x1, y1] = [p[0]!, p[1]!, p[p.length - 2]!, p[p.length - 1]!];
    return x >= Math.min(x0, x1) - r && x <= Math.max(x0, x1) + r && y >= Math.min(y0, y1) - r && y <= Math.max(y0, y1) + r;
  }
  for (let i = 0; i < p.length; i += 2) if (Math.hypot(p[i]! - x, (p[i + 1]! - y) * RATIO) < r) return true;
  return false;
}

type Props = {
  channel: BoardChannel;
  /** A stable name for this person's own lines (used by undo). */
  me: string;
  /** The tutor leads the pages and can lock the board. */
  role?: "tutor" | "student";
  onClose?: () => void;
  light?: boolean;
  /** Upload a picture and return an address both people can load. Without it, the button is hidden. */
  onInsertImage?: (file: File) => Promise<string | null>;
  /** A small board: just pens, colours, eraser, undo and clear; one page. */
  compact?: boolean;
};

export const Whiteboard = forwardRef<WhiteboardHandle, Props>(function Whiteboard({ channel, me, role = "tutor", onClose, light = false, onInsertImage, compact = false }, ref) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const pdfInput = useRef<HTMLInputElement>(null);
  const [pdfNote, setPdfNote] = useState<string | null>(null);
  const [size, setSize] = useState({ w: 800, h: 500 });
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [live, setLive] = useState<Record<string, Stroke>>({});
  const [lasers, setLasers] = useState<Record<string, { page: number; x: number; y: number; at: number }>>({});
  const [grid, setGrid] = useState(false);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);
  const [locked, setLocked] = useState(false);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0]!);
  const [width, setWidth] = useState(SIZES[1]!);
  const [typing, setTyping] = useState<{ x: number; y: number; value: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const current = useRef<Stroke | null>(null);
  const lastSent = useRef(0);
  const syncParts = useRef<Stroke[]>([]);
  const tutor = role === "tutor";
  const canDraw = tutor || !locked;
  const redraw = useCallback(() => setTick((t) => t + 1), []);

  // Fit a 16:10 board into the space available.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const fit = () => {
      const r = el.getBoundingClientRect();
      const w = Math.max(120, Math.min(r.width, r.height / RATIO));
      setSize({ w: Math.floor(w), h: Math.floor(w * RATIO) });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Paint the current page.
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = size.w * dpr;
    c.height = size.h * dpr;
    const ctx = c.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paint(ctx, size.w, size.h, [...strokes.filter((s) => s.page === page), ...Object.values(live).filter((s) => s.page === page)], grid, redraw);
    // Laser pointers: a red dot that fades.
    const now = Date.now();
    for (const l of Object.values(lasers)) {
      if (l.page !== page || now - l.at > 1500) continue;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - (now - l.at) / 1500);
      ctx.fillStyle = "#ef4444";
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(l.x * size.w, l.y * size.h, 7 * (size.w / 1000) + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }, [strokes, live, lasers, size, grid, page, tick, redraw]);
  // Keep fading lasers moving, then forget them.
  useEffect(() => {
    if (!Object.keys(lasers).length) return;
    const t = setInterval(() => {
      const now = Date.now();
      setLasers((cur) => Object.fromEntries(Object.entries(cur).filter(([, l]) => now - l.at < 1500)));
      redraw();
    }, 80);
    return () => clearInterval(t);
  }, [lasers, redraw]);

  // Messages from the other side.
  useEffect(
    () =>
      channel.subscribe((m) => {
        if (m.t === "stroke") {
          setStrokes((cur) => (cur.some((s) => s.id === m.s.id) ? cur : [...cur, m.s]));
          setLive(({ [m.s.id]: _, ...rest }) => rest);
        } else if (m.t === "live") setLive((cur) => ({ ...cur, [m.s.id]: m.s }));
        else if (m.t === "erase") setStrokes((cur) => cur.filter((s) => !m.ids.includes(s.id)));
        else if (m.t === "clear") (setStrokes((cur) => cur.filter((s) => s.page !== m.page)), setLive({}));
        else if (m.t === "grid") setGrid(m.on);
        else if (m.t === "page") (setPages(m.pages), setPage(m.page));
        else if (m.t === "lock") setLocked(m.on);
        else if (m.t === "laser") setLasers((cur) => ({ ...cur, [m.by]: { page: m.page, x: m.x, y: m.y, at: Date.now() } }));
        else if (m.t === "sync") {
          if (m.part === 0) syncParts.current = [];
          syncParts.current.push(...m.strokes);
          if (m.part === m.parts - 1) {
            const got = syncParts.current;
            setStrokes((cur) => [...got, ...cur.filter((s) => !got.some((g) => g.id === s.id))]);
            setGrid(m.grid);
            setPages((p) => Math.max(p, m.pages));
            setPage(m.page);
            setLocked(m.locked);
          }
        }
      }),
    [channel],
  );
  // Answer late joiners with the whole board, in small parts (data messages have a size limit).
  const latest = useRef({ strokes, grid, page, pages, locked });
  latest.current = { strokes, grid, page, pages, locked };
  useEffect(
    () =>
      channel.subscribe((m) => {
        if (m.t !== "sync-req") return;
        const { strokes: all, ...rest } = latest.current;
        if (!all.length && rest.pages === 1 && !rest.grid && !rest.locked) return;
        const chunks: Stroke[][] = [];
        let cur: Stroke[] = [];
        let bytes = 0;
        for (const s of all) {
          const n = s.pts.length * 7 + 120 + (s.text?.length ?? 0) + (s.src?.length ?? 0);
          if (bytes + n > 12000 && cur.length) (chunks.push(cur), (cur = []), (bytes = 0));
          cur.push(s);
          bytes += n;
        }
        chunks.push(cur);
        chunks.forEach((c, i) => channel.send({ t: "sync", strokes: c, ...rest, part: i, parts: chunks.length }));
      }),
    [channel],
  );
  useEffect(() => channel.send({ t: "sync-req" }), [channel]);

  const at = (e: { clientX: number; clientY: number }) => {
    const r = canvas.current!.getBoundingClientRect();
    return [round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))), round(Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)))] as const;
  };
  const add = useCallback(
    (s: Stroke) => {
      setStrokes((cur) => [...cur, s]);
      channel.send({ t: "stroke", s });
    },
    [channel],
  );
  const eraseAt = useCallback(
    (x: number, y: number) => {
      const gone = strokes.filter((s) => s.page === page && hits(s, x, y, 0.012)).map((s) => s.id);
      if (!gone.length) return;
      setStrokes((cur) => cur.filter((s) => !gone.includes(s.id)));
      channel.send({ t: "erase", ids: gone });
    },
    [strokes, page, channel],
  );
  const laser = (x: number, y: number) => {
    setLasers((cur) => ({ ...cur, [me]: { page, x, y, at: Date.now() } }));
    if (Date.now() - lastSent.current > 50) {
      lastSent.current = Date.now();
      channel.send({ t: "laser", by: me, page, x, y });
    }
  };

  function commitText() {
    const t = typing;
    setTyping(null);
    if (!t || !t.value.trim()) return;
    add({ id: uid(), by: me, page, tool: "text", color, size: width, pts: [t.x, t.y], text: t.value.trim().slice(0, 400) });
  }
  function down(e: React.PointerEvent) {
    if (!canDraw) return;
    const [x, y] = at(e);
    if (tool === "text") return; // opened on click, once the press has finished
    try {
      e.currentTarget.setPointerCapture(e.pointerId); // keep the stroke going if the finger slides off the board
    } catch {}
    if (tool === "laser") return laser(x, y);
    if (tool === "eraser") return eraseAt(x, y);
    current.current = { id: uid(), by: me, page, tool, color, size: width, pts: [x, y] };
    setLive((l) => ({ ...l, mine: current.current! }));
  }
  function move(e: React.PointerEvent) {
    if (!canDraw) return;
    if (e.buttons !== 1 && e.pointerType === "mouse") return;
    const [x, y] = at(e);
    if (tool === "laser") return laser(x, y);
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
    add(s);
  }

  function undo() {
    const mine = [...strokes].reverse().find((s) => s.by === me && s.page === page);
    if (!mine) return;
    setStrokes((cur) => cur.filter((s) => s.id !== mine.id));
    channel.send({ t: "erase", ids: [mine.id] });
  }
  function clear() {
    if (!window.confirm("Clear this page for everyone?")) return;
    setStrokes((cur) => cur.filter((s) => s.page !== page));
    channel.send({ t: "clear", page });
  }
  function goTo(n: number, total = pages) {
    setPage(n);
    setPages(total);
    setTyping(null);
    // Pages follow the tutor. A student can look around while the board is unlocked.
    if (tutor) channel.send({ t: "page", page: n, pages: total });
  }
  async function insert(file: File) {
    if (!onInsertImage) return;
    setBusy(true);
    const src = await onInsertImage(file).catch(() => null);
    setBusy(false);
    if (fileInput.current) fileInput.current.value = "";
    if (!src) return;
    // Fit the picture into the middle of the board, keeping its shape.
    const img = new Image();
    img.onload = () => {
      const ar = img.naturalWidth / img.naturalHeight / (1 / RATIO);
      const w = ar >= 1 ? 0.8 : 0.8 * ar;
      const h = ar >= 1 ? 0.8 / ar : 0.8;
      images.set(src, img);
      add({ id: uid(), by: me, page, tool: "image", color: "", size: 0, pts: [round(0.5 - w / 2), round(0.5 - h / 2), round(0.5 + w / 2), round(0.5 + h / 2)], src });
    };
    img.src = src;
  }

  /** Each PDF page becomes a board page with the page as its background, for both people. */
  async function importPdf(file: File) {
    if (!onInsertImage) return;
    if (pdfInput.current) pdfInput.current.value = "";
    setBusy(true);
    setPdfNote("Opening the PDF…");
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
      const room = MAX_PAGES - latest.current.pages;
      const count = Math.min(doc.numPages, MAX_PDF_PAGES, Math.max(0, room));
      if (!count) throw new Error("full");
      const base = file.name.replace(/\.pdf$/i, "").replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 40) || "slides";
      // Start on a fresh page unless the current one is empty.
      let n = latest.current.strokes.some((s) => s.page === latest.current.page) ? latest.current.pages : latest.current.page;
      let total = Math.max(latest.current.pages, n + 1);
      const first = n;
      for (let i = 1; i <= count; i++) {
        setPdfNote(`Adding page ${i} of ${count}…`);
        const pg = await doc.getPage(i);
        const vp0 = pg.getViewport({ scale: 1 });
        const vp = pg.getViewport({ scale: Math.min(2.5, 1500 / vp0.width) });
        const c = document.createElement("canvas");
        c.width = Math.round(vp.width);
        c.height = Math.round(vp.height);
        const cx = c.getContext("2d")!;
        cx.fillStyle = "#fff";
        cx.fillRect(0, 0, c.width, c.height);
        await pg.render({ canvasContext: cx, viewport: vp }).promise;
        const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.85));
        if (!blob) continue;
        const src = await onInsertImage(new File([blob], `${base}-page-${i}.jpg`, { type: "image/jpeg" }));
        if (!src) throw new Error("upload");
        // Fit the page inside the board, centred.
        const ar = c.width / c.height / (1 / RATIO);
        const w = ar >= 1 ? 1 : ar;
        const h = ar >= 1 ? 1 / ar : 1;
        total = Math.max(total, n + 1);
        channel.send({ t: "page", page: n, pages: total });
        const s: Stroke = { id: uid(), by: me, page: n, tool: "image", color: "", size: 0, pts: [round(0.5 - w / 2), round(0.5 - h / 2), round(0.5 + w / 2), round(0.5 + h / 2)], src };
        setStrokes((cur) => [...cur, s]);
        channel.send({ t: "stroke", s });
        setPages(total);
        n++;
      }
      setPage(first);
      channel.send({ t: "page", page: first, pages: total });
      setPdfNote(doc.numPages > count ? `Added the first ${count} pages.` : null);
    } catch (err) {
      setPdfNote((err as Error).message === "full" ? "The board is full. Clear some pages first." : "We couldn't open that PDF. Check it opens on your device, then try again.");
    } finally {
      setBusy(false);
      setTimeout(() => setPdfNote(null), 5000);
    }
  }

  const render = useCallback(
    (n: number) =>
      new Promise<Blob | null>((resolve) => {
        const c = document.createElement("canvas");
        c.width = 1600;
        c.height = 1000;
        paint(c.getContext("2d")!, 1600, 1000, latest.current.strokes.filter((s) => s.page === n), latest.current.grid, () => undefined);
        c.toBlob((b) => resolve(b), "image/png");
      }),
    [],
  );
  useImperativeHandle(
    ref,
    () => ({
      exportPages: async () => {
        const out: Blob[] = [];
        for (let n = 0; n < latest.current.pages; n++) {
          if (!latest.current.strokes.some((s) => s.page === n)) continue;
          const b = await render(n);
          if (b) out.push(b);
        }
        return out;
      },
      snapshot: () => latest.current.strokes.filter((s) => s.page === latest.current.page),
      paste: (list, box) => {
        const copies = list.map((s) => ({
          ...s,
          id: uid(),
          by: me,
          page: latest.current.page,
          // Lines and text get smaller with the box.
          size: s.tool === "image" ? 0 : Math.max(1, Math.round(s.size * box.w * 10) / 10),
          pts: s.pts.map((v, i) => round(i % 2 === 0 ? box.x + v * box.w : box.y + v * box.h)),
        }));
        setStrokes((cur) => [...cur, ...copies]);
        copies.forEach((c) => channel.send({ t: "stroke", s: c }));
      },
      reset: () => {
        setStrokes([]);
        setLive({});
        for (let n = 0; n < latest.current.pages; n++) channel.send({ t: "clear", page: n });
      },
    }),
    [render, channel, me],
  );
  async function save() {
    const b = await render(page);
    if (!b) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = `whiteboard-page-${page + 1}-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  const btn = (on: boolean) => `grid h-10 w-10 shrink-0 place-items-center rounded-xl transition disabled:opacity-35 ${on ? (light ? "bg-slate-900 text-white" : "bg-white text-black") : light ? "text-slate-600 hover:bg-slate-100" : "text-white/80 hover:bg-white/10"}`;
  const bar = `flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl p-1.5 [scrollbar-width:none] [@media(max-height:500px)]:max-h-full [@media(max-height:500px)]:flex-col [@media(max-height:500px)]:overflow-y-auto [@media(max-height:500px)]:overflow-x-hidden [@media(max-height:500px)]:p-1 ${light ? "bg-white shadow-sm ring-1 ring-slate-200" : "bg-[#1c1c1e]/90 ring-1 ring-white/10 backdrop-blur-xl"}`;
  const TOOLS: { t: Tool; label: string; icon: React.ReactNode }[] = [
    { t: "pen", label: "Pen", icon: <Pencil size={18} /> },
    { t: "highlighter", label: "Highlighter", icon: <Highlighter size={18} /> },
    { t: "text", label: "Text", icon: <Type size={18} /> },
    { t: "line", label: "Line", icon: <Minus size={18} className="-rotate-45" /> },
    { t: "rect", label: "Rectangle", icon: <Square size={17} /> },
    { t: "ellipse", label: "Circle", icon: <Circle size={17} /> },
    { t: "laser", label: "Pointer", icon: <Pointer size={18} /> },
    { t: "eraser", label: "Eraser", icon: <Eraser size={18} /> },
  ];
  const sep = <span aria-hidden="true" className={`mx-0.5 h-6 w-px shrink-0 [@media(max-height:500px)]:my-0.5 [@media(max-height:500px)]:h-px [@media(max-height:500px)]:w-6 ${light ? "bg-slate-200" : "bg-white/15"}`} />;
  const fontPx = (width * 5 + 8) * (size.w / 1000);

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col gap-2 sm:gap-3 [@media(max-height:500px)]:flex-row [@media(max-height:500px)]:gap-2" aria-label="Whiteboard">
      <div role="toolbar" aria-label="Whiteboard tools" className={`${bar} self-center`}>
        {TOOLS.filter((x) => !compact || ["pen", "highlighter", "text", "eraser"].includes(x.t)).map((x) => (
          <button key={x.t} type="button" aria-label={x.label} title={x.label} aria-pressed={tool === x.t} disabled={!canDraw} onClick={() => (setTool(x.t), typing && commitText())} className={btn(tool === x.t)}>
            {x.icon}
          </button>
        ))}
        {sep}
        {COLORS.map((c) => (
          <button key={c} type="button" aria-label={`Colour ${c}`} aria-pressed={color === c} disabled={!canDraw} onClick={() => (setColor(c), (tool === "eraser" || tool === "laser") && setTool("pen"))} className="grid h-10 w-8 shrink-0 place-items-center disabled:opacity-35">
            <span className={`h-6 w-6 rounded-full ring-2 ring-offset-2 ${light ? "ring-offset-white" : "ring-offset-[#1c1c1e]"} ${color === c ? (light ? "ring-slate-900" : "ring-white") : "ring-transparent"}`} style={{ background: c }} />
          </button>
        ))}
        {sep}
        {(compact ? [] : SIZES).map((s) => (
          <button key={s} type="button" aria-label={`Line ${s === 2 ? "thin" : s === 4 ? "medium" : "thick"}`} aria-pressed={width === s} disabled={!canDraw} onClick={() => setWidth(s)} className={btn(width === s)}>
            <span className="rounded-full bg-current" style={{ width: s + 3, height: s + 3 }} />
          </button>
        ))}
        {sep}
        {onInsertImage && !compact && (
          <>
            <input ref={pdfInput} type="file" accept="application/pdf" className="hidden" aria-label="Add a PDF" onChange={(e) => e.target.files?.[0] && importPdf(e.target.files[0])} />
            {tutor && (
              <button type="button" aria-label="Add a PDF" title="Add a PDF (each page becomes a board page)" disabled={busy} onClick={() => pdfInput.current?.click()} className={btn(false)}>
                {busy && pdfNote ? <Loader2 size={18} className="animate-spin" /> : <FileUp size={18} />}
              </button>
            )}
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" aria-label="Add a picture" onChange={(e) => e.target.files?.[0] && insert(e.target.files[0])} />
            <button type="button" aria-label="Add a picture" title="Add a picture" disabled={!canDraw || busy} onClick={() => fileInput.current?.click()} className={btn(false)}>
              <ImagePlus size={18} />
            </button>
          </>
        )}
        {!compact && <button type="button" aria-label="Squared paper" title="Squared paper" aria-pressed={grid} disabled={!canDraw} onClick={() => (setGrid(!grid), channel.send({ t: "grid", on: !grid }))} className={btn(grid)}>
          <Grid3x3 size={18} />
        </button>}
        <button type="button" aria-label="Undo my last line" title="Undo" disabled={!canDraw} onClick={undo} className={btn(false)}>
          <Undo2 size={18} />
        </button>
        <button type="button" aria-label="Clear page" title="Clear page" disabled={!canDraw} onClick={clear} className={btn(false)}>
          <Trash2 size={18} />
        </button>
        {!compact && (
          <button type="button" aria-label="Save as image" title="Save as image" onClick={save} className={btn(false)}>
            <Download size={18} />
          </button>
        )}
        {tutor && !compact && (
          <button type="button" aria-label={locked ? "Let the student draw" : "Lock the board"} title={locked ? "Let the student draw" : "Lock the board (only you can draw)"} aria-pressed={locked} onClick={() => (setLocked(!locked), channel.send({ t: "lock", on: !locked }))} className={btn(locked)}>
            {locked ? <Lock size={18} /> : <LockOpen size={18} />}
          </button>
        )}
        {onClose && (
          <>
            {sep}
            <button type="button" aria-label="Close whiteboard" title="Close whiteboard" onClick={onClose} className={btn(false)}>
              <X size={18} />
            </button>
          </>
        )}
      </div>

      {/* The canvas is positioned, not laid out, so its size can never push its own container wider. */}
      <div ref={wrap} className="relative min-h-0 w-full min-w-0 flex-1 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: size.w, height: size.h }}>
          <canvas
            ref={canvas}
            data-testid="whiteboard"
            data-strokes={strokes.filter((s) => s.page === page).length}
            data-page={page + 1}
            data-pages={pages}
            data-locked={locked}
            style={{ width: size.w, height: size.h, touchAction: "none", cursor: !canDraw ? "not-allowed" : tool === "eraser" ? "cell" : tool === "text" ? "text" : "crosshair" }}
            className="rounded-2xl shadow-2xl"
            onClick={(e) => {
              if (tool !== "text" || !canDraw || typing) return;
              const [x, y] = at(e);
              setTyping({ x, y, value: "" });
            }}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
          />
          {typing && (
            <textarea
              autoFocus
              aria-label="Text to add"
              value={typing.value}
              rows={Math.max(1, typing.value.split("\n").length)}
              onChange={(e) => setTyping({ ...typing, value: e.target.value })}
              onBlur={commitText}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) (e.preventDefault(), commitText());
                if (e.key === "Escape") setTyping(null);
              }}
              placeholder="Type, then press Enter"
              className="absolute resize-none rounded-md border border-dashed border-accent-400 bg-white/90 px-1 outline-none"
              style={{ left: typing.x * size.w - 5, top: typing.y * size.h - 3, color, fontSize: fontPx, lineHeight: 1.25, minWidth: 160, maxWidth: size.w - typing.x * size.w }}
            />
          )}
          {!canDraw && (
            <p role="status" className="pointer-events-none absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-slate-900/85 px-3 py-1.5 text-xs font-medium text-white">
              <Lock size={13} /> Your tutor is using the board
            </p>
          )}
        </div>
      </div>

      {pdfNote && (
        <p role="status" className={`self-center rounded-full px-3 py-1 text-xs font-medium ${light ? "bg-slate-900 text-white" : "bg-white text-black"}`}>
          {pdfNote}
        </p>
      )}
      <div className={`${bar} self-center ${compact ? "hidden" : ""}`} aria-label="Pages">
        <button type="button" aria-label="Previous page" disabled={page === 0 || (!tutor && locked)} onClick={() => goTo(page - 1)} className={btn(false)}>
          <ChevronLeft size={18} />
        </button>
        <span className={`min-w-[4.5rem] text-center text-sm font-medium tabular-nums [@media(max-height:500px)]:min-w-0 [@media(max-height:500px)]:text-xs ${light ? "text-slate-700" : "text-white/90"}`} aria-live="polite">
          <span className="[@media(max-height:500px)]:hidden">Page </span>
          {page + 1}
          <span className="[@media(max-height:500px)]:hidden"> of </span>
          <span className="hidden [@media(max-height:500px)]:inline">/</span>
          {pages}
        </span>
        <button type="button" aria-label="Next page" disabled={page >= pages - 1 || (!tutor && locked)} onClick={() => goTo(page + 1)} className={btn(false)}>
          <ChevronRight size={18} />
        </button>
        {tutor && (
          <button type="button" aria-label="Add a page" title="Add a page" disabled={pages >= MAX_PAGES} onClick={() => goTo(pages, pages + 1)} className={btn(false)}>
            <Plus size={18} />
          </button>
        )}
      </div>
    </div>
  );
});
