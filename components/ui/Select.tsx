import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, hint, error, id, children, ...props }, ref) => {
    const selectId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-semibold text-slate-800">
            {label}
          </label>
        )}

        <div className="relative">
          <select
            id={selectId}
            className={cn(
              // Base
              "w-full appearance-none rounded-xl border bg-white",
              "px-4 pr-10 text-sm font-medium text-slate-900",
              // Sizing
              "h-11",
              // Border & Shadow
              "border-slate-200 shadow-xs",
              // Focus
              "focus:outline-none focus:ring-2 focus:ring-brand-700/25 focus:border-brand-700",
              // Hover
              "hover:border-slate-300",
              // Error
              error
                ? "border-red-400 focus:ring-red-400/25 focus:border-red-500"
                : "",
              // Disabled
              "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed",
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </select>

          {/* Custom arrow */}
          <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
