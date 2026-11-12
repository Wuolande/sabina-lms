import Link from "next/link";

/** Sabina mark (open book + gold spark) and wordmark. Pure SVG: no data fetching. */
export function SabinaMark({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="9" fill="#14209C" />
      <path d="M7 11.5c3.2-1.4 6.2-1.2 9 .8v11c-2.8-2-5.8-2.2-9-.8v-11Z" fill="#fff" opacity="0.95" />
      <path d="M25 11.5c-3.2-1.4-6.2-1.2-9 .8v11c2.8-2 5.8-2.2 9-.8v-11Z" fill="#fff" opacity="0.75" />
      <circle cx="23.5" cy="7.5" r="2.6" fill="#F9C31C" />
    </svg>
  );
}

export function SabinaLogo({ tone = "dark", href = "/", size = 34 }: { tone?: "dark" | "light"; href?: string | null; size?: number }) {
  const inner = (
    <span className="inline-flex items-center gap-2.5">
      <SabinaMark size={size} />
      <span className={`font-heading text-[1.4rem] font-bold tracking-tight ${tone === "light" ? "text-white" : "text-slate-900"}`}>
        Sabina<span className="text-accent-400">.</span>
      </span>
    </span>
  );
  return href ? (
    <Link href={href} aria-label="Sabina home" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
      {inner}
    </Link>
  ) : (
    inner
  );
}
