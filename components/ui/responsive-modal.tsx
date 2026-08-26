'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

export interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  preventBackdropClose?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-3xl',
  '2xl': 'sm:max-w-5xl',
  full: 'sm:max-w-[95vw] sm:h-[90vh]',
};

export function ResponsiveModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  preventBackdropClose = false,
  showCloseButton = true,
  className = '',
}: ResponsiveModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!isOpen || !mounted) return null;

  const content = (
    <div
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm transition-all duration-200 animate-in fade-in"
      onClick={() => {
        if (!preventBackdropClose) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${sizeClasses[size]} bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden transform transition-all duration-200 animate-in slide-in-from-bottom sm:zoom-in-95 relative z-[100000] ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Indicator Handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>

        {/* Modal Header */}
        {(title || showCloseButton) && (
          <div className="px-6 py-4 sm:px-7 sm:py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-white dark:bg-slate-900">
            <div className="flex-1 min-w-0">
              {typeof title === 'string' ? (
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  {title}
                </h3>
              ) : (
                title
              )}
              {description && (
                <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-7 overflow-y-auto flex-1 overscroll-contain bg-white dark:bg-slate-900">
          {children}
        </div>

        {/* Modal Optional Footer */}
        {footer && (
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
