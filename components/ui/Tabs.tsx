"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: "line" | "pill" | "enclosed" | "solid";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = "line",
  size = "default",
  className,
}: TabsProps) {
  const sizeMap = {
    sm:      "text-xs",
    default: "text-sm",
    lg:      "text-base",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 overflow-x-auto scrollbar-hide",
        variant === "line"     && "border-b border-slate-200",
        variant === "pill"     && "p-1 bg-slate-100/90 rounded-2xl",
        variant === "enclosed" && "p-1 border border-slate-200 rounded-2xl bg-slate-50",
        variant === "solid"    && "p-1 bg-slate-950/5 rounded-2xl",
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex items-center gap-2 whitespace-nowrap font-semibold transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-1",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              sizeMap[size],
              // LINE variant
              variant === "line" && [
                "px-4 py-2.5 border-b-2 -mb-px rounded-t-sm",
                isActive
                  ? "border-slate-950 text-slate-950 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300",
              ],
              // PILL variant
              variant === "pill" && [
                "px-4 py-2 rounded-xl",
                isActive
                  ? "bg-white text-slate-950 font-bold shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60",
              ],
              // ENCLOSED variant
              variant === "enclosed" && [
                "px-4 py-2 rounded-xl",
                isActive
                  ? "bg-slate-950 text-white font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white",
              ],
              // SOLID variant
              variant === "solid" && [
                "px-4 py-2 rounded-xl",
                isActive
                  ? "bg-brand-700 text-white font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60",
              ],
            )}
          >
            {tab.icon && (
              <span className={cn("flex-shrink-0", isActive ? "text-current" : "text-slate-400")}>
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums",
                  isActive && (variant === "enclosed" || variant === "solid")
                    ? "bg-white/20 text-white"
                    : isActive
                    ? "bg-slate-950 text-white"
                    : "bg-slate-200 text-slate-600"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
