"use client";
import { useId, useState, type ReactNode, type TextareaHTMLAttributes } from "react";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { richLength, type Lexical } from "@/cms/content/rich";
import { Combobox, type Option } from "@/components/ui/Combobox";
import { Check } from "lucide-react";
import { Field } from "@/components/auth/fields";

export const controlCls =
  "block w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

export function TextArea({ label, hint, error, value, maxLength, minHint, ...rest }: { label: string; hint?: ReactNode; error?: string | null; minHint?: number } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  const len = String(value ?? "").length;
  return (
    <Field
      label={label}
      id={id}
      error={error}
      hint={
        <span className="flex justify-between gap-3">
          <span>{hint}</span>
          {maxLength ? (
            <span className={minHint && len < minHint ? "text-amber-600" : "text-slate-400"}>
              {len}/{maxLength}
              {minHint && len < minHint ? ` · ${minHint - len} more needed` : ""}
            </span>
          ) : null}
        </span>
      }
    >
      <textarea id={id} value={value} maxLength={maxLength} className={`${controlCls} min-h-[120px] py-3 leading-relaxed`} {...rest} />
    </Field>
  );
}

/** Labelled rich text box (bold, italic, underline, lists) with a character counter. */
export function RichTextArea({ label, hint, error, value, onChange, maxLength, minHint, placeholder, disabled, minHeight }: { label: string; hint?: ReactNode; error?: string | null; value: unknown; onChange: (v: Lexical | null) => void; maxLength?: number; minHint?: number; placeholder?: string; disabled?: boolean; minHeight?: number }) {
  const id = useId();
  const [len, setLen] = useState(() => richLength(value));
  const over = Boolean(maxLength && len > maxLength);
  return (
    <Field
      label={label}
      id={id}
      error={error ?? (over ? `Keep it under ${maxLength} characters.` : null)}
      hint={
        <span className="flex justify-between gap-3">
          <span>{hint}</span>
          {maxLength ? (
            <span className={over ? "text-red-600" : minHint && len < minHint ? "text-amber-600" : "text-slate-400"}>
              {len}/{maxLength}
              {minHint && len < minHint ? ` · ${minHint - len} more needed` : ""}
            </span>
          ) : null}
        </span>
      }
    >
      <RichTextEditor id={id} value={value} onChange={onChange} onLength={setLen} placeholder={placeholder} disabled={disabled} minHeight={minHeight} />
    </Field>
  );
}

/** Labelled dropdown built on <Combobox>: modern list, search for long lists, keyboard friendly. */
export function Select<T extends string | number>({
  label,
  hint,
  error,
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  disabled,
  searchable,
  clearable,
}: {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  options: Option<T>[];
  value: T | null | undefined;
  onChange: (v: T | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  clearable?: boolean;
}) {
  const id = useId();
  return (
    <Field label={label} id={id} hint={hint} error={error}>
      <Combobox id={id} options={options} value={value} onChange={onChange} placeholder={placeholder} searchPlaceholder={searchPlaceholder} disabled={disabled} searchable={searchable} clearable={clearable} />
    </Field>
  );
}

/** Multi-select as tappable chips. */
export function Chips<T extends string | number>({ label, hint, options, value, onChange, max, disabled }: { label: string; hint?: ReactNode; options: { value: T; label: string }[]; value: T[]; onChange: (v: T[]) => void; max?: number; disabled?: boolean }) {
  const toggle = (v: T) => (value.includes(v) ? onChange(value.filter((x) => x !== v)) : max && value.length >= max ? undefined : onChange([...value, v]));
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="text-sm font-semibold text-slate-800">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o.value);
          const blocked = !on && Boolean(max && value.length >= max);
          return (
            <button
              key={String(o.value)}
              type="button"
              aria-pressed={on}
              disabled={disabled || blocked}
              onClick={() => toggle(o.value)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium ring-1 transition disabled:cursor-not-allowed ${
                on ? "bg-brand-700 text-white ring-brand-700" : blocked ? "bg-slate-50 text-slate-300 ring-slate-200" : "bg-white text-slate-700 ring-slate-200 hover:ring-slate-300"
              }`}
            >
              {on && <Check size={14} />}
              {o.label}
            </button>
          );
        })}
      </div>
      {hint && <p className="text-[13px] text-slate-500">{hint}</p>}
    </fieldset>
  );
}

export function Toggle({ label, sub, checked, onChange, disabled }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`flex items-start justify-between gap-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/60 ${disabled ? "opacity-60" : "cursor-pointer"}`}>
      <span>
        <b className="block text-sm text-slate-900">{label}</b>
        {sub && <span className="text-[13px] text-slate-500">{sub}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-brand-700 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-600/25" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70 sm:p-7 ${className}`}>{children}</section>;
}
