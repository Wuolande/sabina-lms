import type { Payload } from "payload";
import { brandColours, brandCss } from "../brand";

type Img = { url?: string | null } | number | string | null | undefined;
type Settings = { platformName?: string; brand?: { logo?: Img; logoDark?: Img; icon?: Img; colours?: Record<string, unknown> } };

async function settingsOf(payload?: Payload): Promise<Settings | null> {
  if (!payload) return null;
  try {
    return (await payload.findGlobal({ slug: "site-settings", depth: 1, overrideAccess: true })) as Settings;
  } catch {
    return null;
  }
}
const url = (m: Img) => (m && typeof m === "object" ? (m.url ?? undefined) : undefined);

/** Brand colours from Site settings, as CSS variables for the admin (login screen included). */
function BrandStyle({ s }: { s: Settings | null }) {
  return <style hidden style={{ display: "none" }} dangerouslySetInnerHTML={{ __html: brandCss(brandColours(s?.brand?.colours), "admin") }} />;
}

/** Sabina mark: an open book with a spark, in brand blue and gold. */
const Mark = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <rect width="32" height="32" rx="9" style={{ fill: "var(--brand-primary, #14209C)" }} />
    <path d="M7 11.5c3.2-1.4 6.2-1.2 9 .8v11c-2.8-2-5.8-2.2-9-.8v-11Z" style={{ fill: "#fff" }} opacity="0.95" />
    <path d="M25 11.5c-3.2-1.4-6.2-1.2-9 .8v11c2.8-2 5.8-2.2 9-.8v-11Z" style={{ fill: "#fff" }} opacity="0.75" />
    <circle cx="23.5" cy="7.5" r="2.6" style={{ fill: "var(--brand-accent, #F9C31C)" }} />
  </svg>
);

export async function Logo({ payload }: { payload?: Payload }) {
  const s = await settingsOf(payload);
  const logo = url(s?.brand?.logo);
  const logoDark = url(s?.brand?.logoDark) ?? logo;
  const name = s?.platformName || "Sabina Education";
  if (logo) {
    return (
      <span className="ep-brand-logo">
        <BrandStyle s={s} />
        <style>{`.ep-brand-logo img{height:40px;width:auto;max-width:240px;object-fit:contain}.ep-brand-logo .ep-brand-logo__dark{display:none}html[data-theme="dark"] .ep-brand-logo .ep-brand-logo__light{display:none}html[data-theme="dark"] .ep-brand-logo .ep-brand-logo__dark{display:block}`}</style>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="ep-brand-logo__light" src={logo} alt={name} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="ep-brand-logo__dark" src={logoDark} alt="" aria-hidden="true" />
      </span>
    );
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 12, fontFamily: "Outfit, 'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: "-0.02em" }}>
      <BrandStyle s={s} />
      <Mark size={36} />
      <span>
        Sabina<span style={{ color: "var(--brand-accent-dark, #C77F02)" }}>.</span>
      </span>
    </span>
  );
}

export async function Icon({ payload }: { payload?: Payload }) {
  const s = await settingsOf(payload);
  const icon = url(s?.brand?.icon);
  return (
    <>
      <BrandStyle s={s} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {icon ? <img className="ep-brand-icon" src={icon} alt="" width={26} height={26} /> : <Mark size={26} />}
    </>
  );
}
