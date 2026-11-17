/**
 * Sabina brand colours. Editable in Settings › Site settings › Brand; these are the defaults
 * and the fallback when the database can't be reached. The website, the admin, the student and
 * tutor portals, the classroom and emails all read them from there.
 *
 * The colours come from the Sabina Edge logo: royal blue (#1800AB), navy (#06368F) and gold
 * (#FCC10D). Every shade the site uses (brand-50 … brand-950, accent-50 … accent-950) is worked
 * out from them, so changing a colour in the admin changes it everywhere.
 */
export const BRAND_COLOURS = {
  /** Royal blue of the shield. Buttons, links, the main brand colour. */
  primary: "#1800AB",
  /** Blue of the logo's tagline. Light tints (brand-50 … brand-500) are made from it. */
  primaryLight: "#2D419B",
  /** Navy of the "SABINA" wordmark and the shield rim. */
  primaryDark: "#06368F",
  /** Gold of "EDGE", the stars and the swoosh. Highlights. */
  accent: "#FCC10D",
  accentDark: "#C99400",
  success: "#10B981",
  /** The gold in the logo itself (star, edge, "E", orbit). */
  gold: "#FCC10D",
} as const;
export type BrandColours = Record<keyof typeof BRAND_COLOURS, string>;

/** Colours used before the 2026 rebrand. Saved settings still on these are moved to the new ones. */
export const OLD_BRAND_COLOURS = { primary: "#14209C", primaryLight: "#2A4ED6", primaryDark: "#0B123E", accent: "#F9C31C", accentDark: "#C77F02" } as const;

const HEX = /^#[0-9a-f]{6}$/i;
export function brandColours(saved: Partial<Record<string, unknown>> | null | undefined): BrandColours {
  const out = { ...BRAND_COLOURS } as BrandColours;
  for (const k of Object.keys(BRAND_COLOURS) as (keyof BrandColours)[]) {
    const v = saved?.[k];
    if (typeof v === "string" && HEX.test(v)) out[k] = v;
  }
  return out;
}

/* ------------------------------------------------------------------ shades */

type RGB = [number, number, number];
const rgb = (hex: string): RGB => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as RGB;
const mix = (a: RGB, b: RGB, t: number): RGB => a.map((v, i) => Math.round(v + (b[i]! - v) * t)) as RGB;
const WHITE: RGB = [255, 255, 255];
const BLACK: RGB = [0, 0, 0];
/** A deep, slightly grey ink. Mixing the primary into it gives calm navies instead of an electric blue-black. */
const INK: RGB = [14, 21, 48];
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

/**
 * The brand scale: brand-700 is the royal blue, darker shades deepen it into navy, and lighter
 * shades soften the logo's tagline blue with white, so tints such as brand-50 still read as blue.
 */
export function brandScale(c: BrandColours): Record<(typeof STEPS)[number], RGB> {
  const p = rgb(c.primary), l = rgb(c.primaryLight);
  return {
    50: mix(l, WHITE, 0.94),
    100: mix(l, WHITE, 0.86),
    200: mix(l, WHITE, 0.7),
    300: mix(l, WHITE, 0.45),
    400: mix(l, WHITE, 0.2),
    500: l,
    600: mix(p, l, 0.4),
    700: p,
    800: mix(p, INK, 0.38),
    900: mix(p, INK, 0.72),
    950: mix(p, INK, 0.88),
  };
}

/** The accent scale, with the logo gold itself at accent-400. */
export function accentScale(c: BrandColours): Record<(typeof STEPS)[number], RGB> {
  const a = rgb(c.accent);
  return {
    50: mix(a, WHITE, 0.93),
    100: mix(a, WHITE, 0.82),
    200: mix(a, WHITE, 0.64),
    300: mix(a, WHITE, 0.36),
    400: a,
    500: mix(a, BLACK, 0.12),
    600: mix(a, BLACK, 0.25),
    700: mix(a, BLACK, 0.4),
    800: mix(a, BLACK, 0.55),
    900: mix(a, BLACK, 0.68),
    950: mix(a, BLACK, 0.8),
  };
}

const kebab = (k: string) => k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** "H S% L%" for the few shadcn-style variables that use HSL. */
function hsl([r, g, b]: RGB) {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B), min = Math.min(R, G, B), l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === R ? (G - B) / d + (G < B ? 6 : 0) : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Site variables: the colours, every shade as "r g b" (so Tailwind's /opacity works), and aliases. */
export function siteBrandVars(c: BrandColours): string {
  const vars: string[] = Object.entries(c).map(([k, v]) => `--brand-${kebab(k)}:${v}`);
  for (const [step, v] of Object.entries(brandScale(c))) vars.push(`--brand-${step}:${v.join(" ")}`);
  for (const [step, v] of Object.entries(accentScale(c))) vars.push(`--accent-${step}:${v.join(" ")}`);
  vars.push(`--color-primary:${c.primary}`, `--color-secondary:${c.accent}`);
  vars.push(`--primary:${hsl(rgb(c.primary))}`, `--ring:${hsl(rgb(c.primary))}`, `--secondary:${hsl(rgb(c.accent))}`, `--accent:${hsl(rgb(c.accent))}`);
  return vars.join(";");
}

/** CSS custom properties: --brand-* for the site and portals, plus --ep-accent* for the admin. */
export function brandCss(c: BrandColours, scope: "site" | "admin" = "site"): string {
  const site = siteBrandVars(c);
  if (scope === "site") return `:root{${site}}`;
  return `:root,html[data-theme]{${site};--ep-accent:${c.primary};--ep-accent-hover:${c.primaryDark};--ep-accent-fill:${c.primary};--ep-accent-fill-hover:${c.primaryDark};--ep-accent-ink:${c.primary};--ep-accent-soft:color-mix(in srgb,${c.accent} 12%,#fff);--ep-series-a:${c.primary};--ep-series-b:${c.accent};--ep-chart-progress:${c.primary};--ep-chart-single:${c.primary}}html[data-theme=dark]{--ep-accent:${c.accent};--ep-accent-fill:${c.primary};--ep-accent-ink:${c.accent};--ep-accent-soft:color-mix(in srgb,${c.accent} 20%,transparent);--ep-chart-progress:${c.accent};--ep-chart-single:${c.accent}}`;
}
