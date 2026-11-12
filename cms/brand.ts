/**
 * Sabina brand colours. Editable in Settings › Site settings › Brand; these are the defaults
 * and the fallback when the database can't be reached. The website, the admin, the student and
 * tutor portals and emails all read them from there.
 */
export const BRAND_COLOURS = {
  primary: "#14209C",
  primaryLight: "#2A4ED6",
  primaryDark: "#0B123E",
  accent: "#F9C31C",
  accentDark: "#C77F02",
  success: "#10B981",
} as const;
export type BrandColours = Record<keyof typeof BRAND_COLOURS, string>;

const HEX = /^#[0-9a-f]{6}$/i;
export function brandColours(saved: Partial<Record<string, unknown>> | null | undefined): BrandColours {
  const out = { ...BRAND_COLOURS } as BrandColours;
  for (const k of Object.keys(BRAND_COLOURS) as (keyof BrandColours)[]) {
    const v = saved?.[k];
    if (typeof v === "string" && HEX.test(v)) out[k] = v;
  }
  return out;
}

const kebab = (k: string) => k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** CSS custom properties: --brand-* for the site and portals, plus --ep-accent* for the admin. */
export function brandCss(c: BrandColours, scope: "site" | "admin" = "site"): string {
  const site = Object.entries(c).map(([k, v]) => `--brand-${kebab(k)}:${v}`).join(";");
  if (scope === "site") return `:root{${site}}`;
  return `:root,html[data-theme]{${site};--ep-accent:${c.primary};--ep-accent-hover:${c.primaryDark};--ep-accent-fill:${c.primary};--ep-accent-fill-hover:${c.primaryDark};--ep-accent-ink:${c.primary};--ep-accent-soft:color-mix(in srgb,${c.primaryLight} 10%,#fff);--ep-series-a:${c.primary};--ep-series-b:${c.accent}}html[data-theme=dark]{--ep-accent:${c.primaryLight};--ep-accent-fill:${c.primaryLight};--ep-accent-ink:#9DB2F5;--ep-accent-soft:color-mix(in srgb,${c.primaryLight} 20%,transparent)}`;
}
