import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    hoverable?: boolean;
    variant?: "default" | "bordered" | "filled" | "glass" | "dark";
  }
>(({ className, hoverable, variant = "default", ...props }, ref) => {
  const base = "rounded-3xl transition-all duration-200";

  const variants = {
    default:  "border border-slate-200/80 bg-white shadow-card",
    bordered: "border-2 border-slate-200 bg-white",
    filled:   "border border-slate-100 bg-slate-50",
    glass:    "border border-white/70 bg-white/80 backdrop-blur-xl shadow-card",
    dark:     "border border-slate-800 bg-slate-900 text-white shadow-elevation",
  };

  return (
    <div
      ref={ref}
      className={cn(
        base,
        variants[variant],
        hoverable && [
          "cursor-pointer",
          "hover:shadow-elevation hover:border-emerald-200",
          "hover:-translate-y-0.5",
        ],
        className
      )}
      {...props}
    />
  );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-bold leading-tight tracking-tight text-slate-900 font-heading",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-slate-500 leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
