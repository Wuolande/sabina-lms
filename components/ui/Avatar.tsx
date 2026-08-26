"use client";

import * as React from "react";
import { cn, getInitials } from "@/lib/utils";
import Image from "next/image";
import { Sparkles, ShieldCheck } from "lucide-react";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallbackName?: string;
  size?: "xs" | "sm" | "default" | "md" | "lg" | "xl" | "2xl";
  statusIndicator?: "online" | "busy" | "offline" | "away";
  isOnline?: boolean;
  statusPosition?: "bottom-right" | "top-right";
  shape?: "circle" | "rounded";
  superTutor?: boolean;
  verified?: boolean;
}

const sizeMap = {
  xs:      { container: "h-6 w-6 text-[10px]",   badge: "h-3 w-3",     badgeIcon: "h-2 w-2",     ring: "h-1.5 w-1.5 ring-1" },
  sm:      { container: "h-8 w-8 text-xs",       badge: "h-4 w-4",     badgeIcon: "h-2.5 w-2.5", ring: "h-2 w-2 ring-1.5" },
  default: { container: "h-10 w-10 text-sm",     badge: "h-4.5 w-4.5", badgeIcon: "h-2.5 w-2.5", ring: "h-2.5 w-2.5 ring-2" },
  md:      { container: "h-12 w-12 text-base",   badge: "h-5 w-5",     badgeIcon: "h-3 w-3",     ring: "h-3 w-3 ring-2" },
  lg:      { container: "h-16 w-16 text-lg",     badge: "h-6 w-6",     badgeIcon: "h-3.5 w-3.5", ring: "h-3.5 w-3.5 ring-2" },
  xl:      { container: "h-20 w-20 text-xl",     badge: "h-7 w-7",     badgeIcon: "h-4 w-4",     ring: "h-4 w-4 ring-2" },
  "2xl":   { container: "h-28 w-28 text-2xl",    badge: "h-8 w-8",     badgeIcon: "h-4.5 w-4.5", ring: "h-5 w-5 ring-2.5" },
};

const statusColors = {
  online:  "bg-emerald-500",
  busy:    "bg-red-500",
  offline: "bg-slate-400",
  away:    "bg-amber-400",
};

// Deterministic gradient based on name
const gradients = [
  "from-brand-400 to-brand-700",
  "from-emerald-400 to-teal-700",
  "from-violet-400 to-purple-700",
  "from-orange-400 to-red-600",
  "from-sky-400 to-blue-700",
  "from-pink-400 to-rose-700",
];

function getGradient(name: string): string {
  const charCode = name.charCodeAt(0) || 0;
  return gradients[charCode % gradients.length];
}

export function Avatar({
  src,
  alt = "Avatar",
  fallbackName = "User",
  size = "default",
  statusIndicator,
  isOnline,
  statusPosition,
  shape = "circle",
  superTutor = false,
  verified = false,
  className,
  ...props
}: AvatarProps) {
  const [hasError, setHasError] = React.useState(false);
  const initials = getInitials(fallbackName);
  const status = statusIndicator ?? (isOnline ? "online" : undefined);
  const { container, ring, badge, badgeIcon } = sizeMap[size];
  const gradient = getGradient(fallbackName);
  const borderRadius = shape === "circle" ? "rounded-full" : "rounded-2xl";

  // If superTutor is at bottom-right, put online indicator at top-right to avoid collision
  const actualStatusPos =
    statusPosition ?? (superTutor ? "top-right" : "bottom-right");

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-visible select-none",
        borderRadius,
        container,
        className
      )}
      {...props}
    >
      {/* ── Main Avatar Image / Fallback Surface ── */}
      <div
        className={cn(
          "relative h-full w-full overflow-hidden shadow-xs",
          borderRadius,
          (!src || hasError) && `bg-gradient-to-br ${gradient}`
        )}
      >
        {src && !hasError ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            onError={() => setHasError(true)}
            sizes="(max-width: 768px) 80px, 150px"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-bold text-white select-none">
            {initials || "?"}
          </span>
        )}
      </div>

      {/* ── Status Indicator Dot (Online / Busy / Away) ── */}
      {status && (
        <span
          className={cn(
            "absolute rounded-full ring-2 ring-white z-10",
            ring,
            statusColors[status],
            actualStatusPos === "top-right" ? "top-0 right-0" : "bottom-0 right-0"
          )}
          title={`Status: ${status}`}
        />
      )}

      {/* ── Super Tutor Badge (Clean Amber Sparkle Pill) ── */}
      {superTutor && (
        <div
          className={cn(
            "absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-sm ring-2 ring-white z-10",
            badge
          )}
          title="Super Tutor"
        >
          <Sparkles className={cn("fill-current", badgeIcon)} />
        </div>
      )}

      {/* ── Verified Shield Badge (If requested) ── */}
      {verified && !superTutor && (
        <div
          className={cn(
            "absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm ring-2 ring-white z-10",
            badge
          )}
          title="Verified Tutor"
        >
          <ShieldCheck className={cn(badgeIcon)} />
        </div>
      )}
    </div>
  );
}
