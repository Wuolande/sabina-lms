"use client";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

export type Option<T extends string | number = string> = { value: T; label: string; group?: string; hint?: string; keywords?: string; icon?: ReactNode };

type Props<T extends string | number> = {
  options: Option<T>[];
  value: T | null | undefined;
  onChange: (v: T | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  /** Show a search box. Defaults to on when there are more than 8 options. */
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  size?: "md" | "sm";
};

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** A modern single-select: button + popover list, with search for long lists and full keyboard support. */
export function Combobox<T extends string | number>({ options, value, onChange, placeholder = "Choose…", searchPlaceholder = "Search…", searchable, clearable, disabled, id, name, className = "", size = "md", ...aria }: Props<T>) {
  const autoId = useId();
  const listId = `${id ?? autoId}-list`;
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const withSearch = searchable ?? options.length > 8;
  const selected = options.find((o) => o.value === value) ?? null;

  const shown = useMemo(() => {
    if (!q.trim()) return options;
    const n = norm(q.trim());
    return options.filter((o) => norm(`${o.label} ${o.hint ?? ""} ${o.keywords ?? ""} ${o.value}`).includes(n));
  }, [options, q]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    const i = Math.max(0, shown.findIndex((o) => o.value === value));
    setActive(i);
    requestAnimationFrame(() => {
      if (withSearch) input.current?.focus();
      else list.current?.focus();
      list.current?.querySelector(`[data-i="${i}"]`)?.scrollIntoView({ block: "nearest" });
    });
    return () => document.removeEventListener("mousedown", close);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => setActive(0), [q]);

  const pick = (o: Option<T> | null) => {
    onChange(o ? o.value : null);
    setOpen(false);
    setQ("");
    btn.current?.focus();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(shown.length - 1, Math.max(0, active + (e.key === "ArrowDown" ? 1 : -1)));
      setActive(next);
      list.current?.querySelector(`[data-i="${next}"]`)?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (shown[active]) pick(shown[active]!);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      btn.current?.focus();
    } else if (e.key === "Tab") setOpen(false);
  };

  let lastGroup: string | undefined;
  const h = size === "sm" ? "h-10 text-sm" : "h-12 text-[15px]";

  return (
    <div ref={root} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={value == null ? "" : String(value)} />}
      <button
        ref={btn}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        {...aria}
        className={`flex w-full items-center gap-2 rounded-xl border bg-white px-4 text-left text-slate-900 shadow-sm transition focus:outline-none focus-visible:border-brand-600 focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 ${h} ${open ? "border-brand-600 ring-4 ring-brand-600/15" : "border-slate-200 hover:border-slate-300"}`}
      >
        {selected?.icon && <span className="shrink-0">{selected.icon}</span>}
        <span className={`min-w-0 flex-1 truncate ${selected ? "" : "text-slate-400"}`}>{selected ? selected.label : placeholder}</span>
        {clearable && selected && !disabled && (
          <span
            role="button"
            tabIndex={-1}
            aria-label="Clear"
            onClick={(e) => {
              e.stopPropagation();
              pick(null);
            }}
            className="grid h-6 w-6 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={14} />
          </span>
        )}
        <ChevronDown size={18} className={`shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 min-w-[16rem] overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25)] backdrop-blur-xl" onKeyDown={onKey}>
          {withSearch && (
            <div className="flex items-center gap-2 border-b border-slate-100 px-3.5">
              <Search size={16} className="shrink-0 text-slate-400" />
              <input
                ref={input}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                aria-controls={listId}
                aria-activedescendant={shown[active] ? `${listId}-${active}` : undefined}
                className="h-11 w-full bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          )}
          <ul ref={list} id={listId} role="listbox" tabIndex={-1} className="max-h-72 overflow-y-auto overscroll-contain p-1.5 focus:outline-none">
            {shown.length === 0 && <li className="px-3 py-6 text-center text-sm text-slate-500">No matches for “{q}”.</li>}
            {shown.map((o, i) => {
              const header = o.group && o.group !== lastGroup ? o.group : null;
              lastGroup = o.group;
              const on = o.value === value;
              return (
                <li key={String(o.value)} role="presentation">
                  {header && <div className="px-3 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{header}</div>}
                  <div
                    id={`${listId}-${i}`}
                    data-i={i}
                    role="option"
                    aria-selected={on}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(o)}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-[15px] ${i === active ? "bg-slate-100" : ""} ${on ? "font-semibold text-brand-800" : "text-slate-800"}`}
                  >
                    {o.icon && <span className="shrink-0">{o.icon}</span>}
                    <span className="min-w-0 flex-1 truncate">{o.label}</span>
                    {o.hint && <span className="shrink-0 text-xs text-slate-400">{o.hint}</span>}
                    {on && <Check size={16} className="shrink-0 text-brand-700" />}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
