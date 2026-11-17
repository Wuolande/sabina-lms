import { Flame, GraduationCap, Sparkles, Trophy, Zap, type LucideIcon } from "lucide-react";
import { badgeLabel } from "@/cms/tutors/badges";

const ICON: Record<string, LucideIcon> = { top_rated: Trophy, fast_responder: Zap, in_demand: Flame, new_tutor: Sparkles };
const TONE: Record<string, string> = {
  top_rated: "bg-accent-100 text-accent-900 ring-accent-200",
  fast_responder: "bg-brand-50 text-brand-800 ring-brand-100",
  in_demand: "bg-rose-50 text-rose-800 ring-rose-100",
  new_tutor: "bg-emerald-50 text-emerald-800 ring-emerald-100",
};

/** Small badge chips for a tutor (earned automatically; see cms/tutors/badges-server.ts). */
export function TutorBadges({ badges, max, size = "sm" }: { badges: string[]; max?: number; size?: "sm" | "md" }) {
  const list = max ? badges.slice(0, max) : badges;
  if (!list.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Badges">
      {list.map((b) => {
        const Icon = ICON[b] ?? GraduationCap;
        return (
          <li key={b} className={`inline-flex items-center gap-1 rounded-full font-semibold ring-1 ${size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[11px]"} ${TONE[b] ?? "bg-slate-100 text-slate-700 ring-slate-200"}`}>
            <Icon size={size === "md" ? 13 : 11} aria-hidden="true" /> {badgeLabel(b)}
          </li>
        );
      })}
    </ul>
  );
}

/** "Usually replies within 2 hours", from the tutor's typical reply time. */
export function replyLine(minutes: number | null | undefined) {
  if (minutes == null) return null;
  if (minutes < 60) return "Usually replies within an hour";
  const h = Math.round(minutes / 60);
  if (h < 24) return `Usually replies within ${h} hour${h > 1 ? "s" : ""}`;
  const d = Math.round(h / 24);
  return `Usually replies within ${d} day${d > 1 ? "s" : ""}`;
}
