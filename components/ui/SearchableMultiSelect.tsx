"use client";

import * as React from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

export interface MultiOptionItem {
  value: string;
  label: string;
  sublabel?: string;
  group?: string;
}

interface SearchableMultiSelectProps {
  options: (MultiOptionItem | string)[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
  maxSelections?: number;
}

export function SearchableMultiSelect({
  options,
  values = [],
  onChange,
  placeholder = "Select multiple options...",
  searchPlaceholder = "Type to search...",
  label,
  disabled = false,
  className,
  error,
  maxSelections,
}: SearchableMultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const normalizedOptions = React.useMemo<MultiOptionItem[]>(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  const selectedOptions = React.useMemo(() => {
    return normalizedOptions.filter((opt) => values.includes(opt.value));
  }, [normalizedOptions, values]);

  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return normalizedOptions;
    const q = search.toLowerCase();
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
    );
  }, [normalizedOptions, search]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  const handleToggle = (val: string) => {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val));
    } else {
      if (maxSelections && values.length >= maxSelections) return;
      onChange([...values, val]);
    }
  };

  const handleRemove = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(values.filter((v) => v !== val));
  };

  return (
    <div className={cn("relative w-full space-y-1.5", className)} ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            {label}
          </label>
          {maxSelections && (
            <span className="text-[11px] text-slate-400 font-semibold">
              Max {maxSelections} ({values.length}/{maxSelections})
            </span>
          )}
        </div>
      )}

      {/* Trigger Box with Selected Chips */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full min-h-[46px] p-2 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all bg-white shadow-xs cursor-pointer flex flex-wrap items-center gap-1.5",
          isOpen
            ? "border-emerald-500 ring-2 ring-emerald-500/20"
            : "border-slate-200 hover:border-slate-300",
          disabled && "opacity-50 cursor-not-allowed bg-slate-50",
          error && "border-rose-500 ring-2 ring-rose-500/20"
        )}
      >
        {selectedOptions.length > 0 ? (
          selectedOptions.map((opt) => (
            <span
              key={opt.value}
              className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-xl text-xs font-bold"
            >
              <span>{opt.label}</span>
              <button
                type="button"
                onClick={(e) => handleRemove(opt.value, e)}
                className="text-emerald-600 hover:text-emerald-950 p-0.5 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))
        ) : (
          <span className="text-slate-400 px-2">{placeholder}</span>
        )}

        <div className="ml-auto pr-1">
          <ChevronDown
            className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")}
          />
        </div>
      </div>

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
                const isSelected = values.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleToggle(opt.value)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs sm:text-sm font-medium transition-colors cursor-pointer",
                      isSelected
                        ? "bg-emerald-50 text-emerald-900 font-bold"
                        : "text-slate-700 hover:bg-slate-100/80"
                    )}
                  >
                    <div className="truncate flex-1 mr-2">
                      <p className={cn("truncate", isSelected && "text-emerald-900")}>{opt.label}</p>
                      {opt.sublabel && (
                        <p className="text-[11px] text-slate-400 truncate">{opt.sublabel}</p>
                      )}
                    </div>

                    <div
                      className={cn(
                        "h-4 w-4 rounded border flex items-center justify-center transition-colors",
                        isSelected
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-slate-300 bg-white"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
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
