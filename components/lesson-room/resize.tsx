"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Resizing for the classroom: drag handles, a movable/resizable floating box, and sizes remembered
 * on this device. Everything here is a per-viewer convenience: if storage is blocked, the defaults
 * are used and nothing breaks.
 */

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * A value kept in this browser. Read after mounting so server and browser render the same first.
 * Saved only when it's changed, so loading can never overwrite what was saved.
 */
export function usePersisted<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return;
      const saved = JSON.parse(raw) as unknown;
      // Objects merge over the defaults, so new fields get their default value.
      const merge = initial && typeof initial === "object" && saved && typeof saved === "object";
      setValue((merge ? { ...initial, ...saved } : saved) as T);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = useCallback(
    (next: T | ((prev: T) => T)) =>
      setValue((prev) => {
        const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          if (v == null) localStorage.removeItem(key);
          else localStorage.setItem(key, JSON.stringify(v));
        } catch {}
        return v;
      }),
    [key],
  );
  return [value, set] as const;
}

/** True on screens at least `px` wide (false until mounted). */
export function useWide(px = 640) {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${px}px)`);
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [px]);
  return wide;
}

/**
 * An upright handle between two columns. `grow` is +1 when dragging right makes the value bigger,
 * -1 when dragging left does (a column on the right). Arrow keys nudge it; double-click resets.
 */
export function SplitHandle({
  value,
  onChange,
  min,
  max,
  reset,
  label,
  grow = -1,
  className = "",
  light = false,
}: {
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  reset: number;
  label: string;
  grow?: 1 | -1;
  className?: string;
  light?: boolean;
}) {
  const start = useRef<{ x: number; v: number } | null>(null);
  const [active, setActive] = useState(false);
  const set = useCallback((n: number) => onChange(Math.round(clamp(n, min, max))), [onChange, min, max]);
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      title={`${label}. Drag to resize, double-click to reset.`}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        start.current = { x: e.clientX, v: value };
        setActive(true);
      }}
      onPointerMove={(e) => {
        if (!start.current) return;
        set(start.current.v + grow * (e.clientX - start.current.x));
      }}
      onPointerUp={() => {
        start.current = null;
        setActive(false);
      }}
      onPointerCancel={() => {
        start.current = null;
        setActive(false);
      }}
      onDoubleClick={() => set(reset)}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 48 : 16;
        if (e.key === "ArrowLeft") (e.preventDefault(), set(value - grow * step));
        else if (e.key === "ArrowRight") (e.preventDefault(), set(value + grow * step));
        else if (e.key === "Home") (e.preventDefault(), set(min));
        else if (e.key === "End") (e.preventDefault(), set(max));
        else if (e.key === "Enter") (e.preventDefault(), set(reset));
      }}
      className={`group relative z-10 flex w-3 shrink-0 cursor-col-resize touch-none select-none items-center justify-center outline-none ${className}`}
    >
      <span
        className={`h-12 w-1 rounded-full transition ${active ? "bg-accent-400" : light ? "bg-slate-300 group-hover:bg-slate-400 group-focus-visible:bg-accent-400" : "bg-white/20 group-hover:bg-white/50 group-focus-visible:bg-accent-400"}`}
      />
    </div>
  );
}

export type Box = { x: number; y: number; w: number; h: number };

/**
 * A box you can move (by its handle) and resize (from its corner), kept inside the window.
 * Returns the box plus pointer handlers for the move handle and the resize grip.
 */
export function useFloatingBox(key: string, initial: () => Box, limits: { minW: number; minH: number; maxW?: number; maxH?: number }) {
  const [box, setBox] = usePersisted<Box | null>(key, null);
  const drag = useRef<{ mode: "move" | "size"; x: number; y: number; b: Box } | null>(null);
  const fit = useCallback(
    (b: Box): Box => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const w = clamp(b.w, limits.minW, Math.min(limits.maxW ?? vw, vw - 16));
      const h = clamp(b.h, limits.minH, Math.min(limits.maxH ?? vh, vh - 16));
      return { w, h, x: clamp(b.x, 8, vw - w - 8), y: clamp(b.y, 8, vh - h - 8) };
    },
    [limits.minW, limits.minH, limits.maxW, limits.maxH],
  );
  // Keep it on screen when the window changes.
  useEffect(() => {
    const onResize = () => setBox((b) => (b ? fit(b) : b));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [fit, setBox]);
  const current = box ?? null;
  const begin = (mode: "move" | "size") => (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button, input, textarea, select, a")) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { mode, x: e.clientX, y: e.clientY, b: current ?? fit(initial()) };
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    setBox(fit(d.mode === "move" ? { ...d.b, x: d.b.x + dx, y: d.b.y + dy } : { ...d.b, w: d.b.w + dx, h: d.b.h + dy }));
  };
  const end = () => (drag.current = null);
  return {
    box: current,
    reset: () => setBox(null),
    handle: { onPointerDown: begin("move"), onPointerMove: move, onPointerUp: end, onPointerCancel: end },
    grip: { onPointerDown: begin("size"), onPointerMove: move, onPointerUp: end, onPointerCancel: end },
  };
}
