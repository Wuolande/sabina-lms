"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "full";
  className?: string;
  hideCloseButton?: boolean;
  footer?: React.ReactNode;
}

const maxWidthMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  full: "max-w-[95vw] min-h-[80vh]",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "lg",
  className,
  hideCloseButton = false,
  footer,
}: ModalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Frosted Glass Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Window */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-[100000] w-full my-auto",
          "rounded-3xl bg-white shadow-2xl",
          "border border-slate-200/90",
          "animate-in zoom-in-95 fade-in duration-200",
          "flex flex-col",
          "overflow-hidden",
          maxWidthMap[maxWidth],
          className
        )}
      >
        {/* Header */}
        {(title || !hideCloseButton) && (
          <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-100 shrink-0 bg-white">
            <div className="space-y-0.5">
              {title && (
                <h2 className="text-xl font-bold text-slate-950 font-heading leading-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
              )}
            </div>

            {!hideCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors focus:outline-none cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-slate-800 bg-white">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
