import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  value: number;
  max?: number;
  count?: number;
  size?: "sm" | "default" | "lg";
  showValue?: boolean;
  showCount?: boolean;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

export function Rating({
  value,
  max = 5,
  count,
  size = "default",
  showValue = true,
  showCount = true,
  interactive = false,
  onChange,
  className,
}: RatingProps) {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  const starSize = {
    sm: "h-3.5 w-3.5",
    default: "h-4 w-4",
    lg: "h-5 w-5",
  }[size];

  const currentVal = hoverRating !== null ? hoverRating : value;

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: max }).map((_, index) => {
          const starIndex = index + 1;
          const isFilled = currentVal >= starIndex;
          const isHalf = currentVal >= starIndex - 0.5 && currentVal < starIndex;

          return (
            <button
              key={index}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange?.(starIndex)}
              onMouseEnter={() => interactive && setHoverRating(starIndex)}
              onMouseLeave={() => interactive && setHoverRating(null)}
              className={cn(
                "p-0 focus:outline-none transition-transform",
                interactive ? "cursor-pointer hover:scale-110" : "cursor-default"
              )}
            >
              <Star
                className={cn(
                  starSize,
                  "transition-colors",
                  isFilled
                    ? "fill-accent-400 text-accent-500"
                    : isHalf
                    ? "fill-accent-200 text-accent-500"
                    : "fill-slate-100 text-slate-300"
                )}
              />
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className="font-bold text-slate-800 text-sm ml-0.5">
          {value > 0 ? value.toFixed(1) : "New"}
        </span>
      )}

      {showCount && count !== undefined && count > 0 && (
        <span className="text-xs text-slate-500 font-normal">
          ({count} {count === 1 ? "review" : "reviews"})
        </span>
      )}
    </div>
  );
}
