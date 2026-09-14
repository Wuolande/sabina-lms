import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  // Base: shared across all variants
  [
    "relative inline-flex items-center justify-center gap-2",
    "font-semibold tracking-tight select-none",
    "rounded-xl transition-all duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.97]",
  ].join(" "),
  {
    variants: {
      variant: {
        // ── Dark / Primary CTA ──
        default: [
          "bg-slate-950 text-white",
          "shadow-[0_1px_3px_rgb(0_0_0/0.2),inset_0_1px_0_rgb(255_255_255/0.06)]",
          "hover:bg-slate-800",
          "hover:shadow-[0_4px_12px_rgb(0_0_0/0.25),inset_0_1px_0_rgb(255_255_255/0.06)]",
        ].join(" "),

        // ── Brand CTA ──
        brand: [
          "bg-brand text-white",
          "shadow-[0_1px_3px_rgb(0_0_0/0.2),inset_0_1px_0_rgb(255_255_255/0.08)]",
          "hover:brightness-90",
          "hover:shadow-[0_4px_16px_rgb(0_0_0/0.25),inset_0_1px_0_rgb(255_255_255/0.08)]",
        ].join(" "),

        // ── Emerald / Success ──
        success: [
          "bg-emerald-600 text-white",
          "shadow-[0_1px_3px_rgb(5_150_105/0.3),inset_0_1px_0_rgb(255_255_255/0.1)]",
          "hover:bg-emerald-700",
          "hover:shadow-[0_4px_16px_rgb(5_150_105/0.3),inset_0_1px_0_rgb(255_255_255/0.1)]",
        ].join(" "),

        // ── Gold / Accent CTA ──
        secondary: [
          "bg-accent text-slate-950 font-bold",
          "shadow-[0_1px_3px_rgb(0_0_0/0.15),inset_0_1px_0_rgb(255_255_255/0.25)]",
          "hover:brightness-105",
          "hover:shadow-[0_4px_16px_rgb(0_0_0/0.2),inset_0_1px_0_rgb(255_255_255/0.25)]",
        ].join(" "),

        // ── Outline ──
        outline: [
          "border border-slate-200 bg-white text-slate-800",
          "shadow-[0_1px_2px_rgb(0_0_0/0.05)]",
          "hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
          "hover:shadow-[0_2px_6px_rgb(0_0_0/0.08)]",
        ].join(" "),

        // ── Outline Brand ──
        "outline-brand": [
          "border border-brand bg-white text-brand",
          "shadow-[0_1px_2px_rgb(0_0_0/0.05)]",
          "hover:bg-brand/5 hover:border-brand",
        ].join(" "),

        // ── Ghost ──
        ghost: [
          "bg-transparent text-slate-700",
          "hover:bg-slate-100 hover:text-slate-900",
        ].join(" "),

        // ── Subtle ──
        subtle: [
          "bg-brand/10 text-brand",
          "hover:bg-brand/15",
        ].join(" "),

        // ── Destructive ──
        destructive: [
          "bg-red-600 text-white",
          "shadow-[0_1px_3px_rgb(220_38_38/0.3)]",
          "hover:bg-red-700",
          "hover:shadow-[0_4px_12px_rgb(220_38_38/0.3)]",
        ].join(" "),

        // ── Link ──
        link: "text-brand-700 underline-offset-4 hover:underline p-0 h-auto font-medium",
      },

      size: {
        xs:       "h-7 rounded-lg px-3 text-xs",
        sm:       "h-9 rounded-xl px-4 text-xs",
        default:  "h-11 px-5 text-sm",
        lg:       "h-12 rounded-xl px-7 text-sm font-bold",
        xl:       "h-14 rounded-2xl px-8 text-base font-bold",
        "2xl":    "h-16 rounded-2xl px-10 text-lg font-extrabold",
        icon:     "h-10 w-10 rounded-xl p-0",
        "icon-sm":"h-8 w-8 rounded-lg p-0",
        "icon-lg":"h-12 w-12 rounded-xl p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-current" />
        ) : leftIcon ? (
          <span className="inline-flex items-center">{leftIcon}</span>
        ) : null}
        {children}
        {!isLoading && rightIcon && (
          <span className="inline-flex items-center">{rightIcon}</span>
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
