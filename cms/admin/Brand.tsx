import type { Payload } from "payload";
import { brandColours, brandCss } from "../brand";
import { SabinaMark } from "@/components/brand/SabinaMark";

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

const Mark = ({ size = 28 }: { size?: number }) => <SabinaMark size={size} />;

export async function Logo({ payload }: { payload?: Payload }) {
  const s = await settingsOf(payload);
  const logo = url(s?.brand?.logo);
  const logoDark = url(s?.brand?.logoDark) ?? logo;
  const name = s?.platformName || "Sabina Edge";
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
    <span aria-label={name} style={{ display: "inline-flex", alignItems: "center", gap: 10, fontFamily: "Outfit, 'Plus Jakarta Sans', sans-serif", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 0.92 }}>
      <BrandStyle s={s} />
      <Mark size={40} />
      <span aria-hidden="true" style={{ display: "flex", flexDirection: "column", fontSize: 17 }}>
        <span style={{ color: "var(--ep-brand-word, #06368F)" }}>Sabina</span>
        <span style={{ color: "var(--brand-gold, #FCC10D)" }}>Edge</span>
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
      {icon ? <img className="ep-brand-icon" src={icon} alt="" width={26} height={26} /> : <Mark size={30} />}
    </>
  );
}
