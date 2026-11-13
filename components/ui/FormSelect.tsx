"use client";
import { useState } from "react";
import { Combobox, type Option } from "./Combobox";

/** <Combobox> for plain HTML forms (e.g. GET search filters): submits its value under `name`. */
export function FormSelect({ name, defaultValue, options, placeholder, searchPlaceholder, "aria-label": ariaLabel, autoSubmit }: { name: string; defaultValue?: string; options: Option<string>[]; placeholder: string; searchPlaceholder?: string; "aria-label"?: string; autoSubmit?: boolean }) {
  const [v, setV] = useState<string | null>(defaultValue || null);
  return (
    <span className="block">
      <Combobox
        name={name}
        aria-label={ariaLabel}
        size="sm"
        options={[{ value: "", label: placeholder }, ...options]}
        value={v ?? ""}
        searchPlaceholder={searchPlaceholder}
        onChange={(x) => {
          setV(x || null);
          if (autoSubmit) requestAnimationFrame(() => document.querySelector<HTMLInputElement>(`input[type=hidden][name="${name}"]`)?.form?.requestSubmit());
        }}
      />
    </span>
  );
}
