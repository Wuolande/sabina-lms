import type { Payload, PayloadRequest } from "payload";
import { COUNTRY_SEED, TIMEZONE_SEED } from "./seed-data";

export type GeoCountry = { name: string; code: string; flag: string; zones: string[] };
export type GeoZone = { zone: string; label: string; countries: string[] };
export type GeoLists = { countries: GeoCountry[]; timezones: GeoZone[] };

const g = globalThis as unknown as { __sabinaGeo?: { at: number; data: GeoLists } | null };
const TTL = 5 * 60_000;

export const clearGeoCache = () => {
  g.__sabinaGeo = null;
};

export const flagOf = (code: string) => (/^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0))) : "");

const zoneCity = (zone: string) => zone.split("/").pop()!.replace(/_/g, " ");

/** Fill the two lists from the IANA database the first time (they're then managed in the admin). */
export async function ensureGeo(payload: Payload, req?: Partial<PayloadRequest>) {
  const [c, t] = await Promise.all([
    payload.count({ collection: "countries", overrideAccess: true, req }),
    payload.count({ collection: "timezones", overrideAccess: true, req }),
  ]);
  if (c.totalDocs && t.totalDocs) return false;
  const countryOf = new Map<string, string>();
  for (const k of COUNTRY_SEED) for (const z of k.zones) if (!countryOf.has(z)) countryOf.set(z, k.name);
  const ids = new Map<string, number>();
  if (!t.totalDocs) {
    for (const zone of TIMEZONE_SEED) {
      const label = zone === "UTC" ? "UTC (Coordinated Universal Time)" : countryOf.has(zone) ? `${zoneCity(zone)}, ${countryOf.get(zone)}` : `${zoneCity(zone)}, ${zone.split("/")[0]}`;
      const doc = await payload.create({ collection: "timezones", data: { zone, label, isActive: true }, overrideAccess: true, req, depth: 0 }).catch(() => null);
      if (doc) ids.set(zone, doc.id as number);
    }
  } else {
    const all = await payload.find({ collection: "timezones", limit: 1000, depth: 0, overrideAccess: true, req, pagination: false });
    for (const d of all.docs) ids.set(d.zone, d.id as number);
  }
  if (!c.totalDocs) {
    for (const k of COUNTRY_SEED) {
      await payload
        .create({ collection: "countries", data: { name: k.name, code: k.code, isActive: true, timezones: k.zones.map((z) => ids.get(z)).filter(Boolean) as number[] }, overrideAccess: true, req, depth: 0 })
        .catch(() => null);
    }
  }
  clearGeoCache();
  return true;
}

/** Active countries and time zones, cached for a few minutes (cleared whenever an admin edits them). */
export async function geoLists(payload: Payload): Promise<GeoLists> {
  if (g.__sabinaGeo && Date.now() - g.__sabinaGeo.at < TTL) return g.__sabinaGeo.data;
  await ensureGeo(payload);
  const [cs, zs] = await Promise.all([
    payload.find({ collection: "countries", where: { isActive: { equals: true } }, sort: "name", limit: 1000, pagination: false, depth: 1, overrideAccess: true }),
    payload.find({ collection: "timezones", where: { isActive: { equals: true } }, sort: "zone", limit: 2000, pagination: false, depth: 0, overrideAccess: true }),
  ]);
  const active = new Set(zs.docs.map((z) => z.zone));
  const countries: GeoCountry[] = cs.docs.map((c) => ({
    name: c.name,
    code: c.code,
    flag: flagOf(c.code),
    zones: ((c.timezones ?? []) as ({ zone: string } | number)[]).map((z) => (typeof z === "object" ? z.zone : "")).filter((z) => active.has(z)),
  }));
  const byZone = new Map<string, string[]>();
  for (const c of countries) for (const z of c.zones) byZone.set(z, [...(byZone.get(z) ?? []), c.name]);
  const timezones: GeoZone[] = zs.docs.map((z) => ({ zone: z.zone, label: z.label || z.zone, countries: byZone.get(z.zone) ?? [] }));
  const data = { countries, timezones };
  g.__sabinaGeo = { at: Date.now(), data };
  return data;
}

export async function isKnownCountry(payload: Payload, name: unknown) {
  if (name == null || name === "") return true;
  return (await geoLists(payload)).countries.some((c) => c.name === name);
}

export async function isKnownZone(payload: Payload, zone: unknown) {
  if (zone == null || zone === "") return true;
  return (await geoLists(payload)).timezones.some((z) => z.zone === zone);
}

/** Payload field validators: the value must be one of the countries / time zones managed in the admin. */
export const countryValidator = async (value: unknown, { req }: { req: PayloadRequest }) =>
  (await isKnownCountry(req.payload, value)) || "Choose a country from the list.";
export const zoneValidator = async (value: unknown, { req }: { req: PayloadRequest }) =>
  (await isKnownZone(req.payload, value)) || "Choose a time zone from the list.";
