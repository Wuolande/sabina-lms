"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  error?: string;
  label?: string;
  hint?: string;
  showPasswordToggle?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      leftIcon,
      rightElement,
      error,
      label,
      hint,
      id,
      showPasswordToggle = true,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const [showPassword, setShowPassword] = React.useState(false);

    const isPasswordType = type === "password";
    const effectiveType = isPasswordType ? (showPassword ? "text" : "password") : type;

    // Automatically provide eye icon button if this is a password input and no explicit rightElement was passed
    const computedRightElement =
      rightElement ??
      (isPasswordType && showPasswordToggle ? (
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700/20"
          aria-label={showPassword ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-slate-500 hover:text-slate-800" />
          ) : (
            <Eye className="h-4 w-4 text-slate-400 hover:text-slate-700" />
          )}
        </button>
      ) : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-semibold text-slate-800">
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            type={effectiveType}
            className={cn(
              // Base
              "w-full rounded-xl border bg-white text-sm text-slate-900",
              "placeholder:text-slate-400 font-medium",
              "transition-all duration-150",
              // Sizing
              "h-11 px-4",
              // Shadows & border
              "border-slate-200 shadow-xs",
              // Focus
              "focus:outline-none focus:ring-2 focus:ring-brand-700/25 focus:border-brand-700",
              // Hover
              "hover:border-slate-300",
              // Icon padding
              leftIcon && "pl-10",
              computedRightElement && "pr-11",
              // Error state
              error
                ? "border-red-400 focus:ring-red-400/25 focus:border-red-500"
                : "",
              // Disabled
              "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed disabled:border-slate-200",
              className
            )}
            ref={ref}
            {...props}
          />

          {computedRightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
              {computedRightElement}
            </div>
          )}
        </div>

        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
