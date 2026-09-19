'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  HelpCircle,
  Loader2,
} from 'lucide-react';

export type ModalVariant = 'info' | 'success' | 'warning' | 'danger' | 'primary';

export interface ConfirmOptions {
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ModalVariant;
  preventBackdropClose?: boolean;
}

export interface AlertOptions {
  title: string;
  message: string | ReactNode;
  buttonText?: string;
  variant?: ModalVariant;
}

export interface PromptOptions {
  title: string;
  message?: string | ReactNode;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ModalVariant;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
}

export interface ToastOptions {
  title: string;
  message?: string;
  variant?: ModalVariant;
  duration?: number; // ms
}

interface ToastItem extends ToastOptions {
  id: string;
}

interface ModalContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions) => Promise<void>;
  prompt: (options: PromptOptions) => Promise<string | null>;
  toast: (options: ToastOptions) => void;
  closeAll: () => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Confirm Modal State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve?: (val: boolean) => void;
    isLoading?: boolean;
  }>({
    isOpen: false,
    options: { title: '', message: '' },
  });

  // Alert Modal State
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    options: AlertOptions;
    resolve?: () => void;
  }>({
    isOpen: false,
    options: { title: '', message: '' },
  });

  // Prompt Modal State
  const [promptState, setPromptState] = useState<{
    isOpen: boolean;
    options: PromptOptions;
    value: string;
    error: string | null;
    resolve?: (val: string | null) => void;
  }>({
    isOpen: false,
    options: { title: '' },
    value: '',
    error: null,
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Body scroll lock when any modal is open
  const isAnyModalOpen = confirmState.isOpen || alertState.isOpen || promptState.isOpen;
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isAnyModalOpen) {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
          document.body.style.overflow = originalOverflow;
        };
      }
    }
  }, [isAnyModalOpen]);

  // Global ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmState.isOpen && !confirmState.options.preventBackdropClose) {
          confirmState.resolve?.(false);
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        } else if (alertState.isOpen) {
          alertState.resolve?.();
          setAlertState((prev) => ({ ...prev, isOpen: false }));
        } else if (promptState.isOpen) {
          promptState.resolve?.(null);
          setPromptState((prev) => ({ ...prev, isOpen: false }));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmState, alertState, promptState]);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        options,
        resolve,
        isLoading: false,
      });
    });
  }, []);

  const alert = useCallback((options: AlertOptions): Promise<void> => {
    return new Promise((resolve) => {
      setAlertState({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);

  const prompt = useCallback((options: PromptOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      setPromptState({
        isOpen: true,
        options,
        value: options.defaultValue || '',
        error: null,
        resolve,
      });
    });
  }, []);

  const toast = useCallback((options: ToastOptions) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newItem: ToastItem = { ...options, id };
    setToasts((prev) => [...prev, newItem]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const closeAll = useCallback(() => {
    if (confirmState.isOpen) {
      confirmState.resolve?.(false);
      setConfirmState((prev) => ({ ...prev, isOpen: false }));
    }
    if (alertState.isOpen) {
      alertState.resolve?.();
      setAlertState((prev) => ({ ...prev, isOpen: false }));
    }
    if (promptState.isOpen) {
      promptState.resolve?.(null);
      setPromptState((prev) => ({ ...prev, isOpen: false }));
    }
  }, [confirmState, alertState, promptState]);

  // Ambient Icon Badges Helper
  const getIconBadge = (variant: ModalVariant = 'info') => {
    switch (variant) {
      case 'danger':
        return (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 ring-8 ring-rose-500/10 border border-rose-200/80 dark:border-rose-900/50 shrink-0">
            <AlertCircle className="w-6 h-6 stroke-[2.2]" />
          </div>
        );
      case 'warning':
        return (
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 ring-8 ring-amber-500/10 border border-amber-200/80 dark:border-amber-900/50 shrink-0">
            <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
          </div>
        );
      case 'success':
        return (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 ring-8 ring-emerald-500/10 border border-emerald-200/80 dark:border-emerald-900/50 shrink-0">
            <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
          </div>
        );
      case 'primary':
        return (
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-[#14209C] dark:text-indigo-400 ring-8 ring-indigo-500/10 border border-indigo-200/80 dark:border-indigo-900/50 shrink-0">
            <HelpCircle className="w-6 h-6 stroke-[2.2]" />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 ring-8 ring-sky-500/10 border border-sky-200/80 dark:border-sky-900/50 shrink-0">
            <Info className="w-6 h-6 stroke-[2.2]" />
          </div>
        );
    }
  };

  const getPrimaryButtonClass = (variant: ModalVariant = 'primary') => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-md shadow-rose-600/20 focus:ring-rose-500';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold shadow-md shadow-amber-500/20 focus:ring-amber-400';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-md shadow-emerald-600/20 focus:ring-emerald-500';
      case 'primary':
      default:
        return 'bg-[#14209C] hover:bg-[#0f1877] active:bg-[#0b1259] text-white shadow-md shadow-indigo-950/20 focus:ring-indigo-500';
    }
  };

  const modalOverlays = (
    <>
      {/* CONFIRM MODAL */}
      {confirmState.isOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-md transition-all duration-200 animate-in fade-in"
          onClick={() => {
            if (!confirmState.options.preventBackdropClose) {
              confirmState.resolve?.(false);
              setConfirmState((prev) => ({ ...prev, isOpen: false }));
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          <div
            className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-200/90 dark:border-slate-800 overflow-hidden transform transition-all duration-200 animate-in slide-in-from-bottom sm:zoom-in-95 max-h-[92vh] sm:max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Pull Handle */}
            <div className="sm:hidden pt-3 pb-1 flex justify-center shrink-0 bg-white dark:bg-slate-900">
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </div>

            <div className="p-6 sm:p-7 overflow-y-auto overscroll-contain flex-1">
              <div className="flex items-start gap-4">
                {getIconBadge(confirmState.options.variant)}
                <div className="flex-1 min-w-0 pt-0.5">
                  <h3
                    id="confirm-modal-title"
                    className="text-lg sm:text-xl font-bold text-slate-950 dark:text-white tracking-tight leading-snug"
                  >
                    {confirmState.options.title}
                  </h3>
                  <div className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                    {confirmState.options.message}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    confirmState.resolve?.(false);
                    setConfirmState((prev) => ({ ...prev, isOpen: false }));
                  }}
                  className="hidden sm:flex p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer active:scale-90 focus:outline-none"
                  aria-label="Close"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  confirmState.resolve?.(false);
                  setConfirmState((prev) => ({ ...prev, isOpen: false }));
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-xs sm:text-sm transition cursor-pointer active:scale-95 focus:ring-2 focus:ring-slate-300 focus:outline-none min-h-[44px] flex items-center justify-center"
              >
                {confirmState.options.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmState.resolve?.(true);
                  setConfirmState((prev) => ({ ...prev, isOpen: false }));
                }}
                disabled={confirmState.isLoading}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer active:scale-95 focus:ring-2 focus:ring-offset-2 focus:outline-none flex items-center justify-center gap-2 min-h-[44px] ${getPrimaryButtonClass(
                  confirmState.options.variant
                )}`}
              >
                {confirmState.isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{confirmState.options.confirmText || 'Confirm'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALERT MODAL */}
      {alertState.isOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-md transition-all duration-200 animate-in fade-in"
          onClick={() => {
            alertState.resolve?.();
            setAlertState((prev) => ({ ...prev, isOpen: false }));
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="alert-modal-title"
        >
          <div
            className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-200/90 dark:border-slate-800 overflow-hidden transform transition-all duration-200 animate-in slide-in-from-bottom sm:zoom-in-95 max-h-[92vh] sm:max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Pull Handle */}
            <div className="sm:hidden pt-3 pb-1 flex justify-center shrink-0 bg-white dark:bg-slate-900">
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </div>

            <div className="p-6 sm:p-7 overflow-y-auto overscroll-contain flex-1">
              <div className="flex items-start gap-4">
                {getIconBadge(alertState.options.variant)}
                <div className="flex-1 min-w-0 pt-0.5">
                  <h3
                    id="alert-modal-title"
                    className="text-lg sm:text-xl font-bold text-slate-950 dark:text-white tracking-tight leading-snug"
                  >
                    {alertState.options.title}
                  </h3>
                  <div className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                    {alertState.options.message}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    alertState.resolve?.();
                    setAlertState((prev) => ({ ...prev, isOpen: false }));
                  }}
                  className="hidden sm:flex p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer active:scale-90 focus:outline-none"
                  aria-label="Close"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  alertState.resolve?.();
                  setAlertState((prev) => ({ ...prev, isOpen: false }));
                }}
                className={`w-full sm:w-auto px-7 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer active:scale-95 focus:ring-2 focus:ring-offset-2 focus:outline-none min-h-[44px] flex items-center justify-center ${getPrimaryButtonClass(
                  alertState.options.variant
                )}`}
              >
                {alertState.options.buttonText || 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROMPT MODAL */}
      {promptState.isOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-md transition-all duration-200 animate-in fade-in"
          onClick={() => {
            promptState.resolve?.(null);
            setPromptState((prev) => ({ ...prev, isOpen: false }));
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="prompt-modal-title"
        >
          <div
            className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-200/90 dark:border-slate-800 overflow-hidden transform transition-all duration-200 animate-in slide-in-from-bottom sm:zoom-in-95 max-h-[92vh] sm:max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Pull Handle */}
            <div className="sm:hidden pt-3 pb-1 flex justify-center shrink-0 bg-white dark:bg-slate-900">
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </div>

            <div className="p-6 sm:p-7 overflow-y-auto overscroll-contain flex-1">
              <div className="flex items-start gap-4">
                {getIconBadge(promptState.options.variant)}
                <div className="flex-1 min-w-0 pt-0.5">
                  <h3
                    id="prompt-modal-title"
                    className="text-lg sm:text-xl font-bold text-slate-950 dark:text-white tracking-tight leading-snug"
                  >
                    {promptState.options.title}
                  </h3>
                  {promptState.options.message && (
                    <div className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {promptState.options.message}
                    </div>
                  )}

                  <div className="mt-4">
                    {promptState.options.multiline ? (
                      <textarea
                        rows={promptState.options.rows || 3}
                        value={promptState.value}
                        onChange={(e) =>
                          setPromptState((prev) => ({
                            ...prev,
                            value: e.target.value,
                            error: null,
                          }))
                        }
                        placeholder={promptState.options.placeholder || 'Enter details...'}
                        className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-[#14209C]/25 focus:border-[#14209C] focus:outline-none transition resize-y"
                        autoFocus
                      />
                    ) : (
                      <input
                        type="text"
                        value={promptState.value}
                        onChange={(e) =>
                          setPromptState((prev) => ({
                            ...prev,
                            value: e.target.value,
                            error: null,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (promptState.options.required && !promptState.value.trim()) {
                              setPromptState((prev) => ({
                                ...prev,
                                error: 'This field is required before proceeding.',
                              }));
                              return;
                            }
                            promptState.resolve?.(promptState.value);
                            setPromptState((prev) => ({ ...prev, isOpen: false }));
                          }
                        }}
                        placeholder={promptState.options.placeholder || 'Enter input...'}
                        className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-[#14209C]/25 focus:border-[#14209C] focus:outline-none transition min-h-[44px]"
                        autoFocus
                      />
                    )}

                    {promptState.error && (
                      <p className="mt-2 text-xs text-rose-600 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{promptState.error}</span>
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    promptState.resolve?.(null);
                    setPromptState((prev) => ({ ...prev, isOpen: false }));
                  }}
                  className="hidden sm:flex p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer active:scale-90 focus:outline-none"
                  aria-label="Close"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  promptState.resolve?.(null);
                  setPromptState((prev) => ({ ...prev, isOpen: false }));
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-xs sm:text-sm transition cursor-pointer active:scale-95 focus:ring-2 focus:outline-none min-h-[44px] flex items-center justify-center"
              >
                {promptState.options.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (promptState.options.required && !promptState.value.trim()) {
                    setPromptState((prev) => ({
                      ...prev,
                      error: 'This field is required before proceeding.',
                    }));
                    return;
                  }
                  promptState.resolve?.(promptState.value);
                  setPromptState((prev) => ({ ...prev, isOpen: false }));
                }}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer active:scale-95 focus:ring-2 focus:ring-offset-2 focus:outline-none min-h-[44px] flex items-center justify-center ${getPrimaryButtonClass(
                  promptState.options.variant
                )}`}
              >
                {promptState.options.confirmText || 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOASTS CONTAINER */}
      {toasts.length > 0 && (
        <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[100000] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
          {toasts.map((t) => (
            <ToastItemView key={t.id} toast={t} onDismiss={dismissToast} />
          ))}
        </div>
      )}
    </>
  );

  return (
    <ModalContext.Provider value={{ confirm, alert, prompt, toast, closeAll }}>
      {children}
      {mounted && typeof document !== 'undefined'
        ? createPortal(modalOverlays, document.body)
        : null}
    </ModalContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modern Toast Item with Animated Progress Countdown & Hover-Pause
// ─────────────────────────────────────────────────────────────────────────────

interface ToastItemViewProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

function ToastItemView({ toast, onDismiss }: ToastItemViewProps) {
  const duration = toast.duration ?? 4500;
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const remainingTimeRef = useRef(duration);
  const lastTickRef = useRef<number | null>(null);

  useEffect(() => {
    lastTickRef.current = Date.now();

    const interval = setInterval(() => {
      if (isPaused) {
        lastTickRef.current = Date.now();
        return;
      }

      const now = Date.now();
      const delta = now - (lastTickRef.current || now);
      lastTickRef.current = now;

      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - delta);
      const pct = (remainingTimeRef.current / duration) * 100;
      setProgress(pct);

      if (remainingTimeRef.current <= 0) {
        clearInterval(interval);
        onDismiss(toast.id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration, isPaused, onDismiss, toast.id]);

  const getToastIcon = (variant: ModalVariant = 'info') => {
    switch (variant) {
      case 'success':
        return (
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-4.5 h-4.5 stroke-[2.5]" />
          </div>
        );
      case 'danger':
        return (
          <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
            <AlertCircle className="w-4.5 h-4.5 stroke-[2.5]" />
          </div>
        );
      case 'warning':
        return (
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
            <AlertTriangle className="w-4.5 h-4.5 stroke-[2.5]" />
          </div>
        );
      case 'primary':
        return (
          <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-[#14209C] dark:text-indigo-400 shrink-0">
            <HelpCircle className="w-4.5 h-4.5 stroke-[2.5]" />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 shrink-0">
            <Info className="w-4.5 h-4.5 stroke-[2.5]" />
          </div>
        );
    }
  };

  const getProgressBarColor = (variant: ModalVariant = 'info') => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-500';
      case 'danger':
        return 'bg-rose-500';
      case 'warning':
        return 'bg-amber-500';
      case 'primary':
        return 'bg-[#14209C]';
      case 'info':
      default:
        return 'bg-sky-500';
    }
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="pointer-events-auto relative overflow-hidden rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-[0_20px_45px_-10px_rgba(0,0,0,0.25)] p-4 flex items-start gap-3.5 transition-all duration-300 animate-in slide-in-from-bottom sm:slide-in-from-right hover:shadow-2xl"
    >
      {getToastIcon(toast.variant)}

      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
          {toast.title}
        </p>
        {toast.message && (
          <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed break-words font-medium">
            {toast.message}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer active:scale-90 shrink-0 focus:outline-none"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Animated Remaining Duration Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className={`h-full transition-all duration-75 ease-linear ${getProgressBarColor(
            toast.variant
          )}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
