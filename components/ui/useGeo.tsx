"use client";
import { useEffect, useState } from "react";
import type { Option } from "./Combobox";

type Geo = { countries: { name: string; code: string; flag: string; zones: string[] }[]; timezones: { zone: string; label: string; countries: string[] }[] };
let cache: Promise<Geo> | null = null;
const load = () =>
  (cache ??= fetch("/api/geo")
    .then((r) => (r.ok ? (r.json() as Promise<Geo>) : Promise.reject(new Error(String(r.status)))))
    .catch(() => {
      cache = null;
      return { countries: [], timezones: [] };
    }));

export function utcOffset(zone: string, at = new Date()) {
  try {
    const p = new Intl.DateTimeFormat("en-GB", { timeZone: zone, timeZoneName: "shortOffset" }).formatToParts(at).find((x) => x.type === "timeZoneName");
    return (p?.value ?? "GMT").replace("GMT", "UTC");
  } catch {
    return "";
  }
}

/** Countries and time zones managed in the admin, as options for <Combobox>. */
export function useGeo() {
  const [geo, setGeo] = useState<Geo | null>(null);
  useEffect(() => {
    let live = true;
    load().then((g) => live && setGeo(g));
    return () => {
      live = false;
    };
  }, []);
  const countryOptions: Option<string>[] = (geo?.countries ?? []).map((c) => ({ value: c.name, label: c.name, icon: <span aria-hidden>{c.flag}</span>, keywords: c.code }));
  const zoneOptions: Option<string>[] = (geo?.timezones ?? []).map((z) => ({ value: z.zone, label: z.label, hint: utcOffset(z.zone), keywords: `${z.zone} ${z.countries.join(" ")}` }));
  return { ready: Boolean(geo), geo, countryOptions, zoneOptions, zonesFor: (country: string | null | undefined) => geo?.countries.find((c) => c.name === country)?.zones ?? [] };
}

/** Make sure a saved value still shows even if the admin later turned it off. */
export const withCurrent = (opts: Option<string>[], current: string | null | undefined) =>
  current && !opts.some((o) => o.value === current) ? [{ value: current, label: current.replace(/_/g, " ") }, ...opts] : opts;
