import * as React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

export function Breadcrumb({
  items,
  showHome = true,
  className,
}: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center space-x-1.5 text-xs text-slate-500",
        className
      )}
    >
      {showHome && (
        <>
          <Link
            href="/"
            className="flex items-center hover:text-brand-700 transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-400" />
        </>
      )}

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-brand-700 transition-colors font-medium"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  "truncate max-w-[200px]",
                  isLast ? "font-semibold text-slate-900" : "text-slate-500"
                )}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight className="h-3 w-3 text-slate-400" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
