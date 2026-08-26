import * as React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  variant?: "default" | "brand" | "accent" | "dark" | "emerald";
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  const configs = {
    default: {
      card:    "border border-slate-200/80 bg-white shadow-card hover:shadow-elevation hover:-translate-y-0.5",
      label:   "text-slate-500",
      value:   "text-slate-950 font-heading",
      desc:    "text-slate-400",
      iconBg:  "bg-brand-50 text-brand-700",
    },
    brand: {
      card:    "border border-brand-800 bg-gradient-to-br from-brand-700 to-brand-900 text-white shadow-glow-brand",
      label:   "text-brand-200",
      value:   "text-white font-heading",
      desc:    "text-brand-300",
      iconBg:  "bg-white/15 text-white",
    },
    accent: {
      card:    "border border-accent-200 bg-gradient-to-br from-accent-50 to-amber-50 shadow-card hover:shadow-elevation hover:-translate-y-0.5",
      label:   "text-amber-700",
      value:   "text-slate-950 font-heading",
      desc:    "text-amber-600",
      iconBg:  "bg-accent-400 text-slate-950",
    },
    dark: {
      card:    "border border-slate-800 bg-slate-900 text-white shadow-elevation",
      label:   "text-slate-400",
      value:   "text-white font-heading",
      desc:    "text-slate-500",
      iconBg:  "bg-slate-800 text-slate-300",
    },
    emerald: {
      card:    "border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-card hover:shadow-elevation hover:-translate-y-0.5",
      label:   "text-emerald-700",
      value:   "text-slate-950 font-heading",
      desc:    "text-emerald-600",
      iconBg:  "bg-emerald-600 text-white",
    },
  };

  const c = configs[variant];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl p-6 transition-all duration-200",
        c.card,
        className
      )}
    >
      {/* Decorative inner glow for branded variants */}
      {(variant === "brand" || variant === "dark") && (
        <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
      )}

      <div className="flex items-center justify-between gap-2">
        <p className={cn("text-[11px] font-extrabold uppercase tracking-widest", c.label)}>
          {title}
        </p>
        {icon && (
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl shrink-0 shadow-xs", c.iconBg)}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-end gap-2">
        <h3 className={cn("text-3xl sm:text-4xl font-black tracking-tight leading-none", c.value)}>
          {value}
        </h3>

        {trend && (
          <span
            className={cn(
              "mb-0.5 inline-flex items-center gap-0.5 rounded-lg px-1.5 py-0.5 text-[11px] font-bold",
              trend.isPositive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            )}
          >
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.value}%
          </span>
        )}
      </div>

      {(description || trend?.label) && (
        <p className={cn("mt-1.5 text-xs font-medium leading-relaxed", c.desc)}>
          {description || trend?.label}
        </p>
      )}
    </div>
  );
}
