import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center space-x-1.5 py-4 select-none",
        className
      )}
    >
      <Button
        variant="outline"
        size="icon-sm"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {getPages().map((page, index) => {
        if (page === "...") {
          return (
            <span
              key={`ellipsis-${index}`}
              className="flex h-8 w-8 items-center justify-center text-slate-400"
            >
              <MoreHorizontal className="h-4 w-4" />
            </span>
          );
        }

        const isCurrent = page === currentPage;
        return (
          <Button
            key={`page-${page}`}
            variant={isCurrent ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-8 min-w-[2rem] px-2.5 text-xs font-semibold",
              isCurrent && "shadow-sm"
            )}
            onClick={() => onPageChange(Number(page))}
            aria-current={isCurrent ? "page" : undefined}
          >
            {page}
          </Button>
        );
      })}

      <Button
        variant="outline"
        size="icon-sm"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
