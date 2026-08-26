import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  showCount?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, hint, error, showCount, maxLength, id, value, ...props }, ref) => {
    const textareaId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const charCount = typeof value === "string" ? value.length : 0;

    return (
      <div className="w-full space-y-1.5">
        {(label || (showCount && maxLength)) && (
          <div className="flex items-center justify-between">
            {label && (
              <label htmlFor={textareaId} className="text-sm font-semibold text-slate-800">
                {label}
              </label>
            )}
            {showCount && maxLength && (
              <span className="text-xs font-medium text-slate-400 tabular-nums">
                {charCount} / {maxLength}
              </span>
            )}
          </div>
        )}

        <textarea
          id={textareaId}
          maxLength={maxLength}
          value={value}
          className={cn(
            // Base
            "w-full rounded-xl border bg-white",
            "px-4 py-3 text-sm font-medium text-slate-900",
            "placeholder:text-slate-400",
            // Resize
            "resize-y min-h-[100px]",
            // Border
            "border-slate-200 shadow-xs",
            // Focus
            "focus:outline-none focus:ring-2 focus:ring-brand-700/25 focus:border-brand-700",
            // Hover
            "hover:border-slate-300",
            // Error
            error ? "border-red-400 focus:ring-red-400/25 focus:border-red-500" : "",
            // Disabled
            "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed",
            "transition-all duration-150",
            className
          )}
          ref={ref}
          {...props}
        />

        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
