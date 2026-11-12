"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Bucket } from "./data";

const SERIES = [
  { key: "students", label: "Students", color: "var(--ep-chart-progress)" },
  { key: "tutors", label: "Tutors", color: "var(--brand-accent, #F9C31C)" },
  { key: "staff", label: "Staff", color: "var(--ep-chart-done)" },
] as const;

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}
/** Axis top with 4 whole-number steps, tight enough that bars fill the plot. */
const niceMax = (v: number) => { const raw = Math.max(1, v / 4); const p = 10 ** Math.floor(Math.log10(raw)); const step = [1, 2, 3, 4, 5, 6, 8, 10].map((x) => x * p).find((x) => x >= raw)!; return Math.max(1, Math.ceil(step)) * 4; };

/** Sign-ups over time: stacked bars by role, hover/arrow-key tooltip, table view. */
export function StatusBars({ buckets, height = 230 }: { buckets: Bucket[]; height?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const totals = buckets.map((b) => b.students + b.tutors + b.staff);
  const grand = { students: 0, tutors: 0, staff: 0 } as Record<string, number>;
  buckets.forEach((b) => SERIES.forEach((s) => (grand[s.key] += b[s.key])));
  const total = totals.reduce((a, b) => a + b, 0);
  const max = niceMax(Math.max(...totals, 1));
  const m = { l: 30, r: 4, t: 10, b: 26 };
  const iw = Math.max(0, width - m.l - m.r), ih = height - m.t - m.b;
  const band = iw / Math.max(1, buckets.length);
  const bw = Math.max(3, Math.min(26, band * 0.62));
  const y = (v: number) => ih - (v / max) * ih;
  const every = Math.ceil(buckets.length / Math.max(1, Math.floor(iw / 64)));
  const ticks = [0, max / 4, max / 2, (3 * max) / 4, max];

  const legend = (
    <div className="ep-legend">
      {SERIES.map((s) => <span key={s.key}><i style={{ background: s.color }} />{s.label}<b>{grand[s.key]}</b></span>)}
      <button type="button" className="ep-linkbtn" onClick={() => setTable(!table)} aria-pressed={table}>{table ? "Show chart" : "View as table"}</button>
    </div>
  );
  if (total === 0) return (
    <div className="ep-empty">
      <div className="ep-empty__art" aria-hidden="true">{[38, 62, 46, 80, 54, 70, 44].map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div>
      <b>No sign-ups in this period yet</b>
      <p>New students and tutors appear here as soon as they register.</p>
      <a className="ep-btn ep-btn--secondary ep-btn--sm" href="/register" target="_blank" rel="noopener noreferrer">Open the sign-up page</a>
    </div>
  );
  if (table) return (
    <div>{legend}
      <div className="ep-tablewrap"><table className="ep-table"><thead><tr><th>Period</th>{SERIES.map((s) => <th key={s.key} className="num">{s.label}</th>)}<th className="num">Total</th></tr></thead>
        <tbody>{buckets.map((b, i) => totals[i] ? <tr key={b.key}><td>{b.label}</td>{SERIES.map((s) => <td key={s.key} className="num">{b[s.key]}</td>)}<td className="num">{totals[i]}</td></tr> : null)}</tbody></table></div>
    </div>
  );
  const a = active ?? -1;
  return (
    <div>{legend}
      <div ref={ref} className="ep-chart" tabIndex={0} role="img"
        aria-label={`Sign-ups: ${total} in total. ${SERIES.map((s) => `${grand[s.key]} ${s.label.toLowerCase()}`).join(", ")}. Use the left and right arrow keys to read each period.`}
        onKeyDown={(e) => { if (e.key === "ArrowRight") setActive((v) => Math.min(buckets.length - 1, (v ?? -1) + 1)); if (e.key === "ArrowLeft") setActive((v) => Math.max(0, (v ?? buckets.length) - 1)); if (e.key === "Escape") setActive(null); }}
        onBlur={() => setActive(null)} onMouseLeave={() => setActive(null)}>
        {width > 0 && (
          <svg width={width} height={height} aria-hidden="true">
            <g transform={`translate(${m.l},${m.t})`}>
              {ticks.map((t) => <g key={t}><line x1={0} x2={iw} y1={y(t)} y2={y(t)} className="ep-grid" /><text x={-8} y={y(t)} dy="0.32em" textAnchor="end" className="ep-axis">{Math.round(t)}</text></g>)}
              {buckets.map((b, i) => {
                const x = i * band + (band - bw) / 2;
                let acc = 0;
                const segs = SERIES.map((s) => { const v = b[s.key]; const y0 = y(acc), y1 = y(acc + v); acc += v; return { s, v, y0, y1 }; }).filter((g) => g.v > 0);
                const top = segs.length ? segs[segs.length - 1].y1 : ih;
                const r = Math.min(4, bw / 2);
                return (
                  <g key={b.key} opacity={a >= 0 && a !== i ? 0.35 : 1} style={{ transition: "opacity 160ms ease" }}>
                    <clipPath id={`ep-bar-${i}`}><path d={`M${x},${ih} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${ih} Z`} /></clipPath>
                    <g clipPath={`url(#ep-bar-${i})`}>
                      {segs.map((g, k) => <rect key={g.s.key} x={x} width={bw} y={g.y1} height={Math.max(0, g.y0 - g.y1 - (k > 0 ? 0 : 0))} fill={g.s.color} />)}
                      {segs.slice(1).map((g) => <rect key={`gap-${g.s.key}`} x={x} width={bw} y={g.y0 - 1} height={2} fill="var(--ep-surface)" />)}
                    </g>
                    {i % every === 0 && <text x={x + bw / 2} y={ih + 18} textAnchor="middle" className="ep-axis">{b.label}</text>}
                    <rect x={i * band} y={0} width={band} height={ih} fill="transparent" onMouseEnter={() => setActive(i)} />
                  </g>
                );
              })}
            </g>
          </svg>
        )}
        {a >= 0 && width > 0 && (
          <div className="ep-tip" style={{ left: Math.min(Math.max(m.l + a * band + band / 2, 90), width - 90), top: Math.max(0, m.t + y(totals[a]) - 8) }} role="status">
            <b>{buckets[a].label}</b>
            {SERIES.map((s) => <span key={s.key}><i style={{ background: s.color }} />{s.label}<em>{buckets[a][s.key]}</em></span>)}
            <span className="ep-tip__total">Total<em>{totals[a]}</em></span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Ranked horizontal bars (one hue). */
export function RankedBars({ items, unit = "", empty = { title: "Nothing yet", text: "This fills in as lessons are completed." } }: { items: { label: string; value: number }[]; unit?: string; empty?: { title: string; text: string } }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return (
    <div className="ep-empty ep-empty--compact">
      <b>{empty.title}</b><p>{empty.text}</p>
    </div>
  );
  return (
    <ol className="ep-rank">
      {items.map((i) => (
        <li key={i.label} title={`${i.label}: ${i.value} ${unit}`}>
          <span className="ep-rank__label">{i.label}</span>
          <span className="ep-rank__track" aria-hidden="true"><span style={{ width: `${(i.value / max) * 100}%` }} /></span>
          <span className="ep-rank__val">{i.value}</span>
        </li>
      ))}
    </ol>
  );
}

/** Tiny trend line for KPI tiles (decorative; the number beside it carries the meaning). */
export function Sparkline({ data, color = "var(--ep-chart-single)", height = 40 }: { data: number[]; color?: string; height?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const empty = !data.some((v) => v > 0);
  const path = useMemo(() => {
    if (!width || data.length < 2 || empty) return null;
    const max = Math.max(1, ...data), step = width / (data.length - 1);
    const pts = data.map((v, i) => [i * step, height - 3 - (v / max) * (height - 8)] as const);
    const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    return { line, area: `${line} L${width},${height} L0,${height} Z` };
  }, [data, width, height, empty]);
  return (
    <div ref={ref} className="ep-spark" aria-hidden="true" style={{ height }}>
      {path && <svg width={width} height={height}><path d={path.area} fill={color} opacity={0.12} /><path d={path.line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" /></svg>}
    </div>
  );
}
