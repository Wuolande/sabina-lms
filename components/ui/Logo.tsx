"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "default" | "lg" | "xl";
  variant?: "default" | "dark" | "light"; // default: light bg, dark: dark bg, light: all white
  showText?: boolean;
  showIcon?: boolean;
  href?: string;
  className?: string;
}

const sizeConfig = {
  sm: {
    iconBox: "h-7 w-7 rounded-lg",
    iconSize: "h-4 w-4",
    strokeWidth: 2.2,
    gap: "gap-2",
    textSize: "text-base",
  },
  default: {
    iconBox: "h-9 w-9 rounded-xl",
    iconSize: "h-5 w-5",
    strokeWidth: 2.2,
    gap: "gap-2.5",
    textSize: "text-xl",
  },
  lg: {
    iconBox: "h-11 w-11 rounded-2xl",
    iconSize: "h-6 w-6",
    strokeWidth: 2.3,
    gap: "gap-3",
    textSize: "text-2xl",
  },
  xl: {
    iconBox: "h-14 w-14 rounded-2xl",
    iconSize: "h-8 w-8",
    strokeWidth: 2.4,
    gap: "gap-3.5",
    textSize: "text-3xl",
  },
};

export function Logo({
  size = "default",
  variant = "default",
  showText = true,
  showIcon = true,
  href = "/",
  className,
}: LogoProps) {
  const config = sizeConfig[size];

  const content = (
    <div className={cn("inline-flex items-center select-none group transition-transform duration-200", config.gap, className)}>
      {/* ── 1. Icon Badge (Solid Royal Blue Squircle + Gold Mortarboard Outline) ── */}
      {showIcon && (
        <div
          className={cn(
            "flex items-center justify-center shrink-0 bg-[#0B1E8A] shadow-sm group-hover:scale-105 transition-transform duration-200",
            config.iconBox
          )}
        >
          {/* Exact geometric graduation cap icon */}
          <svg
            className={cn("text-[#F9C31C]", config.iconSize)}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Top diamond mortarboard cap */}
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            {/* Lower cap arc */}
            <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" />
          </svg>
        </div>
      )}

      {/* ── 2. Wordmark: SABINA (Royal Navy) + EDGE (Warm Gold) ── */}
      {showText && (
        <div className={cn("font-black tracking-tight font-heading leading-none flex items-center gap-1.5", config.textSize)}>
          <span
            className={cn(
              variant === "dark"
                ? "text-white"
                : variant === "light"
                ? "text-white"
                : "text-[#0B1E8A]"
            )}
          >
            SABINA
          </span>
          <span className="text-[#F9C31C]">
            EDGE
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0 focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
