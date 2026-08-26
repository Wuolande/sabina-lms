import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import Link from "next/link";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
  secondaryAction?: React.ReactNode;
  size?: "sm" | "default" | "lg";
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className,
  secondaryAction,
  size = "default",
}: EmptyStateProps) {
  const padding = {
    sm:      "p-8",
    default: "p-12",
    lg:      "p-16",
  }[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl",
        "border border-dashed border-slate-200 bg-slate-50/50",
        "text-center animate-fade-in",
        padding,
        className
      )}
    >
      {/* Icon */}
      {icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 shadow-xs mb-5">
          <div className="[&>*]:h-7 [&>*]:w-7">
            {icon}
          </div>
        </div>
      )}

      {/* Title */}
      <h3 className="text-lg font-bold text-slate-900 font-heading mb-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="max-w-sm text-sm text-slate-500 leading-relaxed mb-7">
          {description}
        </p>
      )}

      {/* Actions */}
      {(actionLabel || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actionLabel && (actionHref || onAction) && (
            actionHref ? (
              <Link href={actionHref}>
                <Button variant="default" size="sm" className="font-bold rounded-xl">
                  {actionLabel}
                </Button>
              </Link>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="font-bold rounded-xl"
                onClick={onAction}
              >
                {actionLabel}
              </Button>
            )
          )}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
