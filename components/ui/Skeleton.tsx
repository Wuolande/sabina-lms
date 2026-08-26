import * as React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-slate-100/90",
        "after:absolute after:inset-0",
        "after:bg-gradient-to-r after:from-transparent after:via-white/70 after:to-transparent",
        "after:animate-shimmer after:bg-[length:200%_100%]",
        className
      )}
      {...props}
    />
  );
}

/**
 * Animated Pulse Tutor Card Skeleton matching LMS Card Design
 */
export function TutorCardSkeleton() {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-6">
      <div className="space-y-4">
        {/* Top Header: Avatar + Name/Details + Price/Star Pill */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Rounded Avatar Box */}
            <Skeleton className="h-14 w-14 rounded-2xl shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded-lg" />
              <Skeleton className="h-3.5 w-44 rounded-lg" />
              <Skeleton className="h-3 w-28 rounded-lg" />
            </div>
          </div>

          {/* Top-Right Price & Rating Placeholder */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Skeleton className="h-7 w-20 rounded-xl" />
            <Skeleton className="h-7 w-7 rounded-xl" />
          </div>
        </div>

        {/* Bio / Headline Multi-line Skeleton */}
        <div className="space-y-2 pt-1">
          <Skeleton className="h-3.5 w-full rounded-lg" />
          <Skeleton className="h-3.5 w-5/6 rounded-lg" />
          <Skeleton className="h-3.5 w-2/3 rounded-lg" />
        </div>

        {/* Subject & Language Tag Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>

      {/* Footer Divider + Action Buttons */}
      <div className="space-y-3 pt-2">
        <div className="border-t border-slate-100" />
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-10 flex-1 rounded-2xl" />
          <Skeleton className="h-10 flex-1 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Animated Pulse Subject Card Skeleton matching Section 3 Disciplines Grid
 */
export function SubjectCardSkeleton() {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-5">
      <div className="space-y-4">
        {/* Icon & Tutor Count Pill */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        {/* Subject Title & Category */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4 rounded-lg" />
          <Skeleton className="h-3 w-1/3 rounded-lg" />
        </div>

        {/* Description Lines */}
        <div className="space-y-1.5 pt-1">
          <Skeleton className="h-3 w-full rounded-lg" />
          <Skeleton className="h-3 w-4/5 rounded-lg" />
        </div>
      </div>

      {/* Footer Explore Link */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <Skeleton className="h-3.5 w-20 rounded-lg" />
        <Skeleton className="h-3.5 w-16 rounded-lg" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24 rounded-lg" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <Skeleton className="h-10 w-1/2 rounded-lg" />
      <Skeleton className="h-3.5 w-3/4 rounded-lg" />
    </div>
  );
}
