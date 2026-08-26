'use client';

import React, { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';

export type DrawerSize = 'md' | 'lg' | 'xl' | '2xl' | 'full';

export interface ResponsiveDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: DrawerSize;
  preventBackdropClose?: boolean;
}

const sizeClasses: Record<DrawerSize, string> = {
  md: 'sm:max-w-md',
  lg: 'sm:max-w-xl',
  xl: 'sm:max-w-2xl',
  '2xl': 'sm:max-w-4xl',
  full: 'sm:max-w-6xl',
};

export function ResponsiveDrawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'xl',
  preventBackdropClose = false,
}: ResponsiveDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !preventBackdropClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, preventBackdropClose, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-stretch justify-end p-0 bg-slate-950/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in"
      onClick={() => {
        if (!preventBackdropClose) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${sizeClasses[size]} bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-none sm:rounded-l-3xl shadow-2xl border-t sm:border-t-0 sm:border-l border-slate-200/80 dark:border-slate-800 flex flex-col max-h-[92vh] sm:max-h-screen sm:h-full overflow-hidden transform transition-all duration-300 animate-in slide-in-from-bottom sm:slide-in-from-right`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 sm:px-7 sm:py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex-1 min-w-0">
            {typeof title === 'string' ? (
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                {title}
              </h3>
            ) : (
              title
            )}
            {description && (
              <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-7 overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
