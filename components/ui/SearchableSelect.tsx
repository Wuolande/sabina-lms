"use client";

import * as React from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OptionItem {
  value: string;
  label: string;
  sublabel?: string;
  group?: string;
  icon?: React.ReactNode;
}

interface SearchableSelectProps {
  options: (OptionItem | string)[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  clearable?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Type to search...",
  label,
  disabled = false,
  className,
  error,
  leftIcon,
  clearable = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Normalize options to OptionItem[]
  const normalizedOptions = React.useMemo<OptionItem[]>(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  const selectedOption = React.useMemo(() => {
    return normalizedOptions.find((opt) => opt.value === value);
  }, [normalizedOptions, value]);

  // Filter options
  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return normalizedOptions;
    const q = search.toLowerCase();
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q)) ||
        (opt.group && opt.group.toLowerCase().includes(q))
    );
  }, [normalizedOptions, search]);

  // Click outside listener
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input on open
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div className={cn("relative w-full space-y-1.5", className)} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all bg-white shadow-xs cursor-pointer",
          isOpen
            ? "border-emerald-500 ring-2 ring-emerald-500/20"
            : "border-slate-200 hover:border-slate-300",
          disabled && "opacity-50 cursor-not-allowed bg-slate-50",
          error && "border-rose-500 ring-2 ring-rose-500/20"
        )}
      >
        <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
          {leftIcon && <span className="text-slate-400 shrink-0">{leftIcon}</span>}
          {selectedOption ? (
            <div className="truncate">
              <span className="text-slate-900 font-semibold">{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="ml-2 text-xs text-slate-400">{selectedOption.sublabel}</span>
              )}
            </div>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {clearable && selectedOption && !disabled && (
            <span
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")}
          />
        </div>
      </button>

      {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 max-h-72 flex flex-col">
          {/* Search Box */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-8 pl-8 pr-3 text-xs bg-white rounded-xl border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto p-1.5 space-y-0.5 max-h-56">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs sm:text-sm font-medium transition-colors cursor-pointer",
                      isSelected
                        ? "bg-emerald-50 text-emerald-900 font-bold"
                        : "text-slate-700 hover:bg-slate-100/80"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate flex-1 mr-2">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <div className="truncate">
                        <p className={cn("truncate", isSelected && "text-emerald-900")}>{opt.label}</p>
                        {opt.sublabel && (
                          <p className="text-[11px] text-slate-400 truncate">{opt.sublabel}</p>
                        )}
                      </div>
                    </div>

                    {isSelected && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center text-xs text-slate-400 font-medium">
                No matching options found for &ldquo;{search}&rdquo;.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
