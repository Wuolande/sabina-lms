/**
 * Sabina admin UI kit. Server-safe building blocks used by the
 * dashboard and every later module. Styles live in app/(payload)/theme/components.css.
 */
import type { ReactNode } from "react";

type Tone = "neutral" | "accent" | "alert" | "success" | "warning" | "info";

export function Card({ title, sub, action, children, variant, flush, href, className = "" }: {
  title?: ReactNode; sub?: ReactNode; action?: ReactNode; children?: ReactNode;
  variant?: "inverse" | "accent"; flush?: boolean; href?: string; className?: string;
}) {
  const cls = `ep-card${variant ? ` ep-card--${variant}` : ""}${flush ? " ep-card--flush" : ""} ${className}`.trim();
  const head = (title || action) && (
    <div className="ep-card__head">
      <div>{title && <h3 className="ep-card__title">{title}</h3>}{sub && <p className="ep-card__sub">{sub}</p>}</div>
      {action}
    </div>
  );
  return href ? <a className={cls} href={href}>{head}{children}</a> : <section className={cls}>{head}{children}</section>;
}

export function Button({ children, href, variant = "primary", size, icon, external, type = "button", ...rest }: {
  children?: ReactNode; href?: string; variant?: "primary" | "secondary" | "ghost" | "accent"; size?: "sm" | "lg";
  icon?: ReactNode; external?: boolean; type?: "button" | "submit"; "aria-label"?: string;
}) {
  const cls = `ep-btn ep-btn--${variant}${size ? ` ep-btn--${size}` : ""}${!children ? " ep-btn--icon" : ""}`;
  const inner = <>{icon}{children}</>;
  return href
    ? <a className={cls} href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...rest}>{inner}</a>
    : <button className={cls} type={type} {...rest}>{inner}</button>;
}

/** One mapping for every status in the system, so colours mean the same thing everywhere. */
const STATUS: Record<string, { label: string; tone: Tone }> = {
  new: { label: "New", tone: "alert" }, progress: { label: "In progress", tone: "accent" }, quoted: { label: "Quoted", tone: "accent" },
  won: { label: "Won", tone: "success" }, done: { label: "Done", tone: "success" }, spam: { label: "Spam", tone: "neutral" },
  draft: { label: "Draft", tone: "warning" },
  received: { label: "Received", tone: "alert" }, proof: { label: "Proof sent", tone: "warning" }, approved: { label: "Proof approved", tone: "accent" },
  printing: { label: "Printing", tone: "accent" }, qc: { label: "Quality check", tone: "accent" }, dispatched: { label: "Out for delivery", tone: "info" },
  delivered: { label: "Delivered", tone: "success" }, cancelled: { label: "Cancelled", tone: "neutral" },
  pending: { label: "Awaiting payment", tone: "warning" }, waiting: { label: "Waiting", tone: "warning" }, skipped: { label: "Skipped", tone: "neutral" },
  lead: { label: "Lead", tone: "warning" }, active: { label: "Active", tone: "success" }, vip: { label: "VIP", tone: "accent" }, inactive: { label: "Inactive", tone: "neutral" },
  contacted: { label: "Contacted", tone: "info" }, negotiation: { label: "Negotiation", tone: "accent" }, lost: { label: "Lost", tone: "neutral" },
  live: { label: "Approved", tone: "success" }, hold: { label: "Pending", tone: "warning" }, trash: { label: "Deleted", tone: "neutral" }, paid: { label: "Paid", tone: "success" }, failed: { label: "Failed", tone: "alert" }, refunded: { label: "Refunded", tone: "neutral" }, published: { label: "Published", tone: "success" }, changed: { label: "Unpublished changes", tone: "info" },
};
export function StatusPill({ status, label, tone }: { status?: string; label?: string; tone?: Tone }) {
  const s = (status && STATUS[status]) || { label: label ?? status ?? "", tone: tone ?? "neutral" };
  const t = tone ?? s.tone;
  return <span className={`ep-pill${t === "neutral" ? "" : ` ep-pill--${t}`}`}>{label ?? s.label}</span>;
}

export function Delta({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const dir = value > 0 ? "up" : value < 0 ? "down" : "flat";
  return <span className={`ep-delta ep-delta--${dir}`} aria-label={`${dir === "up" ? "Up" : dir === "down" ? "Down" : "No change"} ${Math.abs(value)}${suffix}`}>{dir === "up" ? "↑" : dir === "down" ? "↓" : "→"} {Math.abs(value)}{suffix}</span>;
}

export function Kpi({ label, value, delta, note }: { label: ReactNode; value: ReactNode; delta?: number; note?: ReactNode }) {
  return (
    <div className="ep-kpi">
      <span className="ep-kpi__label">{label}</span>
      <span className="ep-kpi__value">{value}</span>
      {(delta !== undefined || note) && <span style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--ep-muted)", fontSize: "var(--ep-text-xs)" }}>{delta !== undefined && <Delta value={delta} />}{note}</span>}
    </div>
  );
}

export function IconChip({ children, tone }: { children: ReactNode; tone?: Exclude<Tone, "neutral" | "info"> }) {
  return <span className={`ep-icon-chip${tone ? ` ep-icon-chip--${tone}` : ""}`} aria-hidden="true">{children}</span>;
}
