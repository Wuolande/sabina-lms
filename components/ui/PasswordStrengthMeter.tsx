"use client";

import * as React from "react";
import { Check, X, Shield, ShieldCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasswordCriteria {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
}

export function evaluatePassword(password: string): {
  criteria: PasswordCriteria;
  score: number;
  label: "Very Weak" | "Weak" | "Fair" | "Good" | "Strong";
  colorClass: string;
  barColorClass: string;
} {
  const criteria: PasswordCriteria = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  };

  let count = 0;
  if (criteria.minLength) count++;
  if (criteria.hasUpper) count++;
  if (criteria.hasLower) count++;
  if (criteria.hasNumber) count++;
  if (criteria.hasSymbol) count++;

  if (password.length === 0) {
    return {
      criteria,
      score: 0,
      label: "Very Weak",
      colorClass: "text-slate-400",
      barColorClass: "bg-slate-200",
    };
  }

  if (count <= 1 || password.length < 8) {
    return {
      criteria,
      score: 1,
      label: "Weak",
      colorClass: "text-rose-600",
      barColorClass: "bg-rose-500",
    };
  }

  if (count === 2 || count === 3) {
    return {
      criteria,
      score: 2,
      label: "Fair",
      colorClass: "text-amber-600",
      barColorClass: "bg-amber-500",
    };
  }

  if (count === 4) {
    return {
      criteria,
      score: 3,
      label: "Good",
      colorClass: "text-blue-600",
      barColorClass: "bg-blue-500",
    };
  }

  return {
    criteria,
    score: 4,
    label: "Strong",
    colorClass: "text-emerald-600",
    barColorClass: "bg-emerald-500",
  };
}

interface PasswordStrengthMeterProps {
  password: string;
  showCriteriaList?: boolean;
  className?: string;
}

export function PasswordStrengthMeter({
  password,
  showCriteriaList = true,
  className,
}: PasswordStrengthMeterProps) {
  if (!password) return null;

  const { criteria, score, label, colorClass, barColorClass } = evaluatePassword(password);

  return (
    <div className={cn("space-y-2 mt-2", className)}>
      {/* ── Strength Bar & Label ── */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">Password Strength:</span>
        <span className={cn("font-bold tracking-tight flex items-center gap-1", colorClass)}>
          {score >= 3 ? <ShieldCheck className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
          {label}
        </span>
      </div>

      {/* 4 Segmented Bars */}
      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden flex gap-1">
        <div
          className={cn(
            "h-full flex-1 rounded-full transition-all duration-300",
            score >= 1 ? barColorClass : "bg-slate-200"
          )}
        />
        <div
          className={cn(
            "h-full flex-1 rounded-full transition-all duration-300",
            score >= 2 ? barColorClass : "bg-slate-200"
          )}
        />
        <div
          className={cn(
            "h-full flex-1 rounded-full transition-all duration-300",
            score >= 3 ? barColorClass : "bg-slate-200"
          )}
        />
        <div
          className={cn(
            "h-full flex-1 rounded-full transition-all duration-300",
            score >= 4 ? barColorClass : "bg-slate-200"
          )}
        />
      </div>

      {/* ── Interactive Criteria Checklist ── */}
      {showCriteriaList && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px] text-slate-600">
          <CriteriaItem met={criteria.minLength} text="At least 8 characters" />
          <CriteriaItem met={criteria.hasUpper} text="Uppercase letter (A-Z)" />
          <CriteriaItem met={criteria.hasLower} text="Lowercase letter (a-z)" />
          <CriteriaItem met={criteria.hasNumber} text="At least one number (0-9)" />
          <CriteriaItem met={criteria.hasSymbol} text="Special symbol (!@#$%...)" />
        </div>
      )}
    </div>
  );
}

function CriteriaItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 transition-colors duration-200",
        met ? "text-emerald-700 font-semibold" : "text-slate-400"
      )}
    >
      <div
        className={cn(
          "h-3.5 w-3.5 rounded-full flex items-center justify-center shrink-0 text-[9px] transition-all duration-200",
          met ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-300"
        )}
      >
        {met ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : <span className="h-1 w-1 rounded-full bg-slate-300" />}
      </div>
      <span>{text}</span>
    </div>
  );
}

interface PasswordConfirmationFeedbackProps {
  password: string;
  confirmPassword: string;
  className?: string;
}

export function PasswordConfirmationFeedback({
  password,
  confirmPassword,
  className,
}: PasswordConfirmationFeedbackProps) {
  if (!confirmPassword) return null;

  const isMatch = password === confirmPassword && confirmPassword.length > 0;

  return (
    <div
      className={cn(
        "mt-1.5 flex items-center gap-1.5 text-xs font-semibold transition-all duration-150",
        isMatch ? "text-emerald-600" : "text-rose-600",
        className
      )}
    >
      {isMatch ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
          <span>Passwords match</span>
        </>
      ) : (
        <>
          <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
          <span>Passwords do not match</span>
        </>
      )}
    </div>
  );
}
