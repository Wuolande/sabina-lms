import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1 rounded-full",
    "font-semibold leading-none tracking-tight select-none",
    "border transition-colors",
  ].join(" "),
  {
    variants: {
      variant: {
        default:     "border-transparent bg-brand-700 text-white shadow-xs",
        secondary:   "border-transparent bg-accent text-slate-950 font-bold shadow-xs",
        outline:     "border-slate-300 bg-white text-slate-700",
        subtle:      "border-brand-100 bg-brand-50 text-brand-800",
        success:     "border-emerald-200 bg-emerald-50 text-emerald-700",
        warning:     "border-amber-200 bg-amber-50 text-amber-800",
        destructive: "border-red-200 bg-red-50 text-red-700",
        neutral:     "border-slate-200 bg-slate-100 text-slate-700",
        dark:        "border-slate-800 bg-slate-900 text-white",
        "emerald-solid": "border-transparent bg-emerald-600 text-white shadow-xs",
        "brand-solid":   "border-transparent bg-brand-700 text-white shadow-xs",
        "gold-solid":    "border-transparent bg-accent-400 text-slate-950 font-bold shadow-xs",
      },
      size: {
        xs:      "px-2 py-0.5 text-[10px]",
        sm:      "px-2.5 py-1 text-[11px]",
        default: "px-3 py-1 text-xs",
        lg:      "px-4 py-1.5 text-sm font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
  dot?: boolean;
  dotColor?: string;
}

function Badge({ className, variant, size, icon, dot, dotColor, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn("inline-block h-1.5 w-1.5 rounded-full flex-shrink-0", dotColor ?? "bg-current")}
        />
      )}
      {icon && <span className="inline-flex items-center flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
