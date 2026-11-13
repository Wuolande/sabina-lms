"use client";
import { useEffect, useMemo, useState } from "react";
import { SelectInput, useField } from "@payloadcms/ui";
import type { TextFieldClientProps } from "payload";

type Geo = { countries: { name: string; code: string; flag: string }[]; timezones: { zone: string; label: string; countries: string[] }[] };
let cache: Promise<Geo> | null = null;
const loadGeo = () => (cache ??= fetch("/api/geo", { credentials: "include" }).then((r) => r.json() as Promise<Geo>).catch(() => ((cache = null), { countries: [], timezones: [] })));

export function offsetLabel(zone: string) {
  try {
    const p = new Intl.DateTimeFormat("en-GB", { timeZone: zone, timeZoneName: "shortOffset" }).formatToParts(new Date()).find((x) => x.type === "timeZoneName");
    return (p?.value ?? "GMT").replace("GMT", "UTC");
  } catch {
    return "";
  }
}

function GeoSelect({ kind, ...props }: TextFieldClientProps & { kind: "country" | "timezone" }) {
  const { path, field, readOnly } = props;
  const { value, setValue, showError } = useField<string>({ path });
  const [geo, setGeo] = useState<Geo | null>(null);
  useEffect(() => {
    let live = true;
    loadGeo().then((g) => live && setGeo(g));
    return () => {
      live = false;
    };
  }, []);
  const options = useMemo(() => {
    if (!geo) return [];
    const list =
      kind === "country"
        ? geo.countries.map((c) => ({ label: `${c.flag} ${c.name}`, value: c.name }))
        : geo.timezones.map((z) => ({ label: `${z.label} (${offsetLabel(z.zone)})${z.countries.length ? "" : ""}`, value: z.zone }));
    // Keep an old value visible even if it has since been switched off in the admin.
    if (value && !list.some((o) => o.value === value)) list.unshift({ label: `${value} (not in the list)`, value });
    return list;
  }, [geo, kind, value]);
  const desc = field.admin?.description;
  return (
    <SelectInput
      path={path}
      name={field.name}
      label={field.label || (kind === "country" ? "Country" : "Time zone")}
      required={field.required}
      readOnly={readOnly}
      description={typeof desc === "string" ? desc : undefined}
      options={options}
      value={value ?? ""}
      showError={showError}
      isClearable={!field.required}
      placeholder={geo ? (kind === "country" ? "Search countries…" : "Search time zones…") : "Loading…"}
      filterOption={(o, input) => {
        if (!input) return true;
        const q = input.toLowerCase();
        if (String(o.label).toLowerCase().includes(q) || String(o.value).toLowerCase().includes(q)) return true;
        if (kind === "timezone") return Boolean(geo?.timezones.find((z) => z.zone === o.value)?.countries.some((c) => c.toLowerCase().includes(q)));
        return false;
      }}
      onChange={(o) => setValue(Array.isArray(o) ? (o[0]?.value ?? null) : ((o as { value?: string } | null)?.value ?? null))}
    />
  );
}

export const CountrySelect = (p: TextFieldClientProps) => <GeoSelect {...p} kind="country" />;
export const TimezoneSelect = (p: TextFieldClientProps) => <GeoSelect {...p} kind="timezone" />;
