import Link from "next/link";

/**
 * The Sabina Edge shield: a blue shield with a gold edge, a star above it, a sparkle, the "SE"
 * monogram and a gold orbit. Colours come from Site settings (--brand-primary, --brand-primary-dark,
 * --brand-gold), with the logo's own colours as fallbacks. Pure SVG, so it is sharp at any size.
 */
export function SabinaMark({ size = 40, className = "", title }: { size?: number; className?: string; title?: string }) {
  const gold = "var(--brand-gold, #FCC10D)";
  return (
    <svg width={Math.round(size * 0.8)} height={size} viewBox="0 0 120 150" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <linearGradient id="sb-shield-face" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" style={{ stopColor: "var(--brand-primary, #1800AB)" }} />
          <stop offset="1" style={{ stopColor: "rgb(var(--brand-800, 20 8 124))" }} />
        </linearGradient>
      </defs>
      <path d="M60 2C61 10 62 13 69 14C62 15 61 18 60 26C59 18 58 15 51 14C58 13 59 10 60 2Z" style={{ fill: gold }} />
      <path d="M60 22C78 22 96 26 111 33V80C111 111 89 132 60 146C31 132 9 111 9 80V33C24 26 42 22 60 22Z" style={{ fill: "var(--brand-primary-dark, #06368F)" }} />
      <path d="M111 40V80C111 111 89 132 60 146V139C85 127 104 108 104 80V46Z" style={{ fill: gold }} />
      <path d="M60 29C76 29 91 32 104 38V80C104 107 85 125 60 137C35 125 16 107 16 80V38C29 32 44 29 60 29Z" fill="url(#sb-shield-face)" />
      <path d="M88 40C88.6 45 89.4 46 94 46.6C89.4 47.2 88.6 48.2 88 53C87.4 48.2 86.6 47.2 82 46.6C86.6 46 87.4 45 88 40Z" style={{ fill: gold }} />
      <path d="M55 64H37Q28 64 28 73V74Q28 83 37 83H46Q55 83 55 92V94Q55 103 46 103H26" fill="none" stroke="#fff" strokeWidth="9" strokeLinejoin="round" />
      <path d="M93 64H70V103H93M70 83.5H89" fill="none" style={{ stroke: gold }} strokeWidth="9" strokeLinejoin="round" />
      <path d="M12 111C40 128 92 120 110 60C96 110 46 122 12 111Z" style={{ fill: gold }} />
    </svg>
  );
}

/**
 * Shield plus the "SABINA / EDGE" wordmark (and, optionally, the tagline), as in the brand logo.
 * `tone="light"` is for dark backgrounds.
 */
export function SabinaLogo({ tone = "dark", href = "/", size = 40, tagline = false }: { tone?: "dark" | "light"; href?: string | null; size?: number; tagline?: boolean }) {
  const word = Math.round(size * 0.42);
  const inner = (
    <span className="inline-flex items-center gap-2.5" aria-label="Sabina Edge">
      <SabinaMark size={size} />
      <span className="flex flex-col justify-center font-heading font-extrabold uppercase leading-[0.92] tracking-[0.04em]" aria-hidden="true">
        <span style={{ fontSize: word, color: tone === "light" ? "#fff" : "var(--brand-primary-dark, #06368F)" }}>
          Sabina
        </span>
        <span style={{ fontSize: word, color: "var(--brand-gold, #FCC10D)" }}>Edge</span>
        {tagline && (
          <span className={`mt-1 text-[9px] font-bold tracking-[0.08em] ${tone === "light" ? "text-white/70" : "text-brand-500"}`}>Building minds. Impacting lives.</span>
        )}
      </span>
    </span>
  );
  return href ? (
    <Link href={href} aria-label="Sabina Edge home" className="inline-flex shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
      {inner}
    </Link>
  ) : (
    inner
  );
}
