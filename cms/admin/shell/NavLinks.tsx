"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useNav } from "@payloadcms/ui";
import { Icon } from "./icons";

export type NavSection = {
  title?: string;
  collapsible?: boolean;
  items: { href: string; label: string; icon: string; badge?: number }[];
};

/** Sidebar links: active page highlight, live unread badges, and auto-dismiss on mobile. */
export function NavLinks({ sections }: { sections: NavSection[] }) {
  const path = usePathname() ?? "";
  const { navOpen, setNavOpen } = useNav();
  const isActive = (href: string) => (href === "/admin" ? path === "/admin" : path === href || path.startsWith(`${href}/`));

  // Groups start closed (except active one) and remember user toggle state on this device.
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      setOpen(JSON.parse(localStorage.getItem("ep-nav-open") ?? "{}"));
    } catch {
      /* storage unavailable */
    }
  }, []);

  const toggle = (key: string, next: boolean) =>
    setOpen((o) => {
      const v = { ...o, [key]: next };
      try {
        localStorage.setItem("ep-nav-open", JSON.stringify(v));
      } catch {
        /* storage unavailable */
      }
      return v;
    });

  const handleLinkClick = () => {
    // Automatically close sidebar on mobile when navigating
    if (navOpen && typeof window !== "undefined" && window.innerWidth < 1024) {
      setNavOpen(false);
    }
  };

  return (
    <div className="ep-nav__sections">
      {sections.map((s, i) => {
        const containsActive = s.items.some((it) => isActive(it.href));
        const expanded = !s.collapsible || open[s.title ?? i] || containsActive;

        return (
          <div key={s.title ?? i} className="ep-nav__section">
            {s.title &&
              (s.collapsible ? (
                <button
                  type="button"
                  className="ep-nav__heading ep-nav__heading--toggle"
                  aria-expanded={expanded}
                  onClick={() => toggle(s.title!, !expanded)}
                >
                  <span className="ep-nav__heading-title">{s.title}</span>
                  <div className="ep-nav__heading-meta">
                    {!expanded && s.items.some((it) => it.badge) ? (
                      <span className="ep-nav__dot" aria-label="New items" />
                    ) : null}
                    <span aria-hidden="true" className="ep-nav__chev">›</span>
                  </div>
                </button>
              ) : (
                <p className="ep-nav__heading">{s.title}</p>
              ))}

            {expanded && (
              <ul className="ep-nav__list">
                {s.items.map((it) => {
                  const active = isActive(it.href);
                  return (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        onClick={handleLinkClick}
                        className={`ep-nav__link${active ? " is-active" : ""}`}
                        aria-current={active ? "page" : undefined}
                      >
                        <span className="ep-nav__icon-wrap">
                          <Icon name={it.icon} size={17} />
                        </span>
                        <span className="ep-nav__label">{it.label}</span>
                        {!!it.badge && (
                          <span className="ep-nav__badge" aria-label={`${it.badge} new`}>
                            {it.badge > 99 ? "99+" : it.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Opens the sidebar by default on wide screens (Payload starts it closed for new users).
 * If the user explicitly closes it, that choice is remembered.
 */
export function NavDefaultOpen() {
  const { navOpen, setNavOpen } = useNav();
  const ready = useRef(false);

  useEffect(() => {
    let closedByUser = false;
    try {
      closedByUser = localStorage.getItem("ep-nav-closed") === "1";
    } catch {
      /* storage unavailable */
    }
    // Payload restores its own saved nav state just after hydration, so open on the next tick.
    const t = window.setTimeout(() => {
      if (!closedByUser && window.matchMedia("(min-width: 1024px)").matches) setNavOpen(true);
      ready.current = true;
    }, 60);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready.current || !window.matchMedia("(min-width: 1024px)").matches) return;
    try {
      localStorage.setItem("ep-nav-closed", navOpen ? "0" : "1");
    } catch {
      /* storage unavailable */
    }
  }, [navOpen]);

  return null;
}
