'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  HelpCircle,
  Loader2
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
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newItem: ToastItem = { ...options, id };
    setToasts((prev) => [...prev, newItem]);

    const duration = options.duration ?? 4000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
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

  // Icons Helper
  const getIcon = (variant: ModalVariant = 'info') => {
    switch (variant) {
      case 'success':
        return <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'danger':
        return <AlertCircle className="w-7 h-7 text-rose-600 dark:text-rose-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-7 h-7 text-amber-500 dark:text-amber-400 shrink-0" />;
      case 'primary':
        return <HelpCircle className="w-7 h-7 text-[#14209C] dark:text-indigo-400 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-7 h-7 text-sky-600 dark:text-sky-400 shrink-0" />;
    }
  };

  const getButtonClass = (variant: ModalVariant = 'primary') => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm shadow-rose-200 dark:shadow-none';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-900 font-semibold shadow-sm';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm';
      case 'primary':
      default:
        return 'bg-[#14209C] hover:bg-[#0f1877] active:bg-[#0b125a] text-white shadow-sm shadow-indigo-100 dark:shadow-none';
    }
  };

  return (
    <ModalContext.Provider value={{ confirm, alert, prompt, toast, closeAll }}>
      {children}

      {/* CONFIRM MODAL */}
      {confirmState.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm transition-all duration-200 animate-in fade-in"
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
            className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden transform transition-all duration-200 animate-in slide-in-from-bottom sm:zoom-in-95 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Indicator */}
            <div className="sm:hidden pt-3 pb-1 flex justify-center">
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </div>

            <div className="p-6 sm:p-7 overflow-y-auto">
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50">
                  {getIcon(confirmState.options.variant)}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <h3
                    id="confirm-modal-title"
                    className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight"
                  >
                    {confirmState.options.title}
                  </h3>
                  <div className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                    {confirmState.options.message}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    confirmState.resolve?.(false);
                    setConfirmState((prev) => ({ ...prev, isOpen: false }));
                  }}
                  className="hidden sm:inline-flex p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  confirmState.resolve?.(false);
                  setConfirmState((prev) => ({ ...prev, isOpen: false }));
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium text-sm transition focus:ring-2 focus:ring-slate-400 focus:outline-none min-h-[44px]"
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
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-sm transition focus:ring-2 focus:ring-offset-2 focus:outline-none flex items-center justify-center gap-2 min-h-[44px] ${getButtonClass(
                  confirmState.options.variant
                )}`}
              >
                {confirmState.isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {confirmState.options.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALERT MODAL */}
      {alertState.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm transition-all duration-200 animate-in fade-in"
          onClick={() => {
            alertState.resolve?.();
            setAlertState((prev) => ({ ...prev, isOpen: false }));
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="alert-modal-title"
        >
          <div
            className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden transform transition-all duration-200 animate-in slide-in-from-bottom sm:zoom-in-95 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden pt-3 pb-1 flex justify-center">
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </div>

            <div className="p-6 sm:p-7 overflow-y-auto">
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50">
                  {getIcon(alertState.options.variant)}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <h3
                    id="alert-modal-title"
                    className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight"
                  >
                    {alertState.options.title}
                  </h3>
                  <div className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                    {alertState.options.message}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  alertState.resolve?.();
                  setAlertState((prev) => ({ ...prev, isOpen: false }));
                }}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-sm transition focus:ring-2 focus:ring-offset-2 focus:outline-none min-h-[44px] ${getButtonClass(
                  alertState.options.variant
                )}`}
              >
                {alertState.options.buttonText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROMPT MODAL */}
      {promptState.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm transition-all duration-200 animate-in fade-in"
          onClick={() => {
            promptState.resolve?.(null);
            setPromptState((prev) => ({ ...prev, isOpen: false }));
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="prompt-modal-title"
        >
          <div
            className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden transform transition-all duration-200 animate-in slide-in-from-bottom sm:zoom-in-95 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden pt-3 pb-1 flex justify-center">
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </div>

            <div className="p-6 sm:p-7 overflow-y-auto">
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50">
                  {getIcon(promptState.options.variant)}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <h3
                    id="prompt-modal-title"
                    className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight"
                  >
                    {promptState.options.title}
                  </h3>
                  {promptState.options.message && (
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
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
                        placeholder={promptState.options.placeholder || 'Enter notes...'}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-[#14209C] focus:border-transparent focus:outline-none transition resize-y"
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
                        placeholder={promptState.options.placeholder || 'Enter input...'}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-[#14209C] focus:border-transparent focus:outline-none transition min-h-[44px]"
                        autoFocus
                      />
                    )}

                    {promptState.error && (
                      <p className="mt-1.5 text-xs text-rose-600 font-medium">
                        {promptState.error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  promptState.resolve?.(null);
                  setPromptState((prev) => ({ ...prev, isOpen: false }));
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium text-sm transition focus:ring-2 focus:outline-none min-h-[44px]"
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
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-sm transition focus:ring-2 focus:ring-offset-2 focus:outline-none min-h-[44px] ${getButtonClass(
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
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-2 sm:p-0">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="pointer-events-auto p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex items-start gap-3 transform transition-all duration-200 animate-in slide-in-from-bottom sm:slide-in-from-right"
            >
              <div className="shrink-0 pt-0.5">{getIcon(t.variant)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{t.title}</p>
                {t.message && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    {t.message}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </ModalContext.Provider>
  );
}
