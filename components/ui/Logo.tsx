"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLogo } from "@/components/ui/LogoContext";

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
    imgClass: "max-h-7 max-w-[140px]",
    squareImgClass: "h-7 w-7",
  },
  default: {
    iconBox: "h-9 w-9 rounded-xl",
    iconSize: "h-5 w-5",
    strokeWidth: 2.2,
    gap: "gap-2.5",
    textSize: "text-xl",
    imgClass: "max-h-9 max-w-[180px]",
    squareImgClass: "h-9 w-9",
  },
  lg: {
    iconBox: "h-11 w-11 rounded-2xl",
    iconSize: "h-6 w-6",
    strokeWidth: 2.3,
    gap: "gap-3",
    textSize: "text-2xl",
    imgClass: "max-h-11 max-w-[220px]",
    squareImgClass: "h-11 w-11",
  },
  xl: {
    iconBox: "h-14 w-14 rounded-2xl",
    iconSize: "h-8 w-8",
    strokeWidth: 2.4,
    gap: "gap-3.5",
    textSize: "text-3xl",
    imgClass: "max-h-14 max-w-[280px]",
    squareImgClass: "h-14 w-14",
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
  const { logoUrl } = useLogo();

  // If a custom logo has been uploaded by the admin, render it
  if (logoUrl) {
    const isDarkSurface = variant === "dark";
    const imageElement = (
      <div
        className={cn(
          "inline-flex items-center select-none group transition-transform duration-200",
          isDarkSurface ? "py-0.5 px-1 rounded-lg bg-white/5 hover:bg-white/10" : "",
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt="Platform Logo"
          className={cn(
            "object-contain w-auto transition-transform duration-200 group-hover:scale-[1.02]",
            !showText && showIcon ? config.squareImgClass : config.imgClass,
            isDarkSurface ? "drop-shadow-xs" : ""
          )}
          loading="eager"
        />
      </div>
    );

    if (href) {
      return (
        <Link href={href} className="inline-flex shrink-0 focus:outline-none">
          {imageElement}
        </Link>
      );
    }
    return imageElement;
  }

  // Fallback: Geometric mortarboard cap + dynamic theme brand wordmark
  const content = (
    <div className={cn("inline-flex items-center select-none group transition-transform duration-200", config.gap, className)}>
      {/* ── 1. Icon Badge (Solid Brand Squircle + Accent Mortarboard Outline) ── */}
      {showIcon && (
        <div
          className={cn(
            "flex items-center justify-center shrink-0 bg-brand shadow-sm group-hover:scale-105 transition-transform duration-200",
            config.iconBox
          )}
        >
          {/* Exact geometric graduation cap icon */}
          <svg
            className={cn("text-accent", config.iconSize)}
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

      {/* ── 2. Wordmark: SABINA (Brand Color) + EDGE (Accent Color) ── */}
      {showText && (
        <div className={cn("font-black tracking-tight font-heading leading-none flex items-center gap-1.5", config.textSize)}>
          <span
            className={cn(
              variant === "dark"
                ? "text-white"
                : variant === "light"
                ? "text-white"
                : "text-brand"
            )}
          >
            SABINA
          </span>
          <span className="text-accent">
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
