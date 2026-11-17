"use client";
import { Star } from "lucide-react";

/** Five stars, read-only or as a picker. Gold stars are kept on purpose: they read as ratings. */
export function Stars({ value, onChange, size = 28, dark = false }: { value: number; onChange?: (n: number) => void; size?: number; dark?: boolean }) {
  const off = dark ? "text-white/25" : onChange ? "text-slate-300" : "text-slate-200";
  return (
    <div className="flex gap-1" role={onChange ? "radiogroup" : undefined} aria-label={onChange ? "Rating" : `${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => onChange(n)} className="rounded-md p-0.5 transition hover:scale-110 active:scale-90">
            <Star size={size} className={n <= value ? "fill-amber-400 text-amber-400" : off} />
          </button>
        ) : (
          <Star key={n} size={size} className={n <= value ? "fill-amber-400 text-amber-400" : off} />
        ),
      )}
    </div>
  );
}
