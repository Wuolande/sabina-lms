"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, LogOut, Menu, Search, Settings, Sparkles, X } from "lucide-react";
import { SabinaLogo } from "@/components/brand/SabinaMark";
import { NAV, PHASE_NAMES, isActive, itemFor, type PortalRole } from "./nav";
import { NavIcon } from "./icons";
import type { PortalUser } from "./types";

const PortalUserContext = createContext<PortalUser | null>(null);
/** The signed-in student or tutor, inside the portal. */
export const usePortalUser = () => {
  const u = useContext(PortalUserContext);
  if (!u) throw new Error("usePortalUser must be used inside PortalShell");
  return u;
};

const initials = (u: PortalUser) => `${u.firstName[0] ?? ""}${u.lastName[0] ?? ""}`.toUpperCase() || u.email[0]!.toUpperCase();

export function UserAvatar({ user, size = 36 }: { user: PortalUser; size?: number }) {
  return user.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={user.avatarUrl} alt="" width={size} height={size} className="rounded-full object-cover ring-2 ring-white" style={{ width: size, height: size }} />
  ) : (
    <span
      className="grid place-items-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 font-semibold text-white ring-2 ring-white"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {initials(user)}
    </span>
  );
}

type Badges = { messages: number; notifications: number };
const BadgeContext = createContext<Badges>({ messages: 0, notifications: 0 });
const badgeFor = (href: string, b: Badges) => (href.endsWith("/messages") ? b.messages : href.endsWith("/notifications") ? b.notifications : 0);

/** Unread counts, refreshed every 30s, on navigation, and when a page fires `sabina:badges`. */
function useBadges(path: string): Badges {
  const [b, setB] = useState<Badges>({ messages: 0, notifications: 0 });
  useEffect(() => {
    let stop = false;
    const load = () =>
      fetch("/api/notifications?counts=1", { credentials: "include", cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => !stop && d && setB({ messages: d.messages ?? 0, notifications: d.notifications ?? 0 }))
        .catch(() => undefined);
    void load();
    const t = setInterval(() => document.visibilityState === "visible" && load(), 30_000);
    window.addEventListener("sabina:badges", load);
    return () => {
      stop = true;
      clearInterval(t);
      window.removeEventListener("sabina:badges", load);
    };
  }, [path]);
  return b;
}

const Count = ({ n, active }: { n: number; active?: boolean }) =>
  n > 0 ? (
    <span className={`min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold leading-4 ${active ? "bg-white text-brand-700" : "bg-brand-600 text-white"}`} aria-label={`${n} unread`}>
      {n > 99 ? "99+" : n}
    </span>
  ) : null;

async function signOut() {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => undefined);
  window.location.assign("/login");
}

function SidebarNav({ role, onNavigate }: { role: PortalRole; onNavigate?: () => void }) {
  const path = usePathname() ?? "";
  const badges = useContext(BadgeContext);
  return (
    <nav aria-label="Portal" className="space-y-1">
      {NAV[role].map((item) => {
        const active = isActive(path, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-medium transition ${
              active ? "bg-brand-700 text-white shadow-[0_6px_18px_-8px_rgba(20,32,156,0.7)]" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <NavIcon name={item.icon} className={active ? "text-white" : "text-slate-400 group-hover:text-slate-600"} />
            <span className="flex-1 truncate">{item.label}</span>
            <Count n={badgeFor(item.href, badges)} active={active} />
            {item.phase ? (
              <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide ${active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"}`}>Soon</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function AccountMenu({ user, role }: { user: PortalUser; role: PortalRole }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full p-1 pr-2 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <UserAvatar user={user} size={34} />
        <span className="hidden text-left sm:block">
          <b className="block max-w-[140px] truncate text-sm leading-tight text-slate-900">{user.firstName}</b>
          <span className="block text-xs capitalize text-slate-500">{role}</span>
        </span>
        <ChevronDown size={16} className="hidden text-slate-400 sm:block" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
          <div className="border-b border-slate-100 px-4 py-3">
            <b className="block truncate text-sm text-slate-900">{user.name}</b>
            <span className="block truncate text-xs text-slate-500">{user.email}</span>
          </div>
          <Link role="menuitem" href={`/${role}/settings`} onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
            <Settings size={16} /> Account settings
          </Link>
          <button role="menuitem" type="button" onClick={signOut} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

/** Shown in place of a section that hasn't been rebuilt on Payload yet. */
function ComingSoon({ label, phase, role }: { label: string; phase: number; role: PortalRole }) {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-accent-50 text-accent-600 ring-1 ring-accent-200">
        <Sparkles size={28} />
      </span>
      <h1 className="mt-6 font-heading text-2xl font-bold text-slate-900">{label} is being rebuilt</h1>
      <p className="mt-3 text-slate-600">
        We&apos;re moving Sabina to a faster, more reliable platform. This section returns in phase {phase}: <b>{PHASE_NAMES[phase]}</b>.
      </p>
      <Link href={`/${role}`} className="mt-8 inline-flex h-11 items-center rounded-xl bg-brand-700 px-5 font-semibold text-white hover:bg-brand-800">
        Back to home
      </Link>
    </div>
  );
}

export function PortalShell({ user, role, children }: { user: PortalUser; role: PortalRole; children: ReactNode }) {
  const path = usePathname() ?? "";
  const [drawer, setDrawer] = useState(false);
  const current = itemFor(role, path);

  useEffect(() => setDrawer(false), [path]);
  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawer]);

  const primary = NAV[role].filter((i) => i.primary);
  const badges = useBadges(path);

  return (
    <PortalUserContext.Provider value={user}>
      <BadgeContext.Provider value={badges}>
      <div className="min-h-dvh bg-[#F6F7FB]">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-slate-200/70 bg-white lg:flex">
          <div className="flex h-[72px] items-center px-6">
            <SabinaLogo href={`/${role}`} size={32} />
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {role === "student" && (
              <Link
                href="/find-tutors"
                className="mb-5 flex items-center justify-center gap-2 rounded-xl bg-accent-400 px-4 py-2.5 text-sm font-semibold text-brand-950 shadow-sm transition hover:bg-accent-300"
              >
                <Search size={16} /> Find a tutor
              </Link>
            )}
            <SidebarNav role={role} />
          </div>
          <div className="m-4 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-4 text-white">
            <p className="text-sm font-semibold">Need help?</p>
            <p className="mt-1 text-xs text-white/70">Our team answers within a few hours.</p>
            <Link href="/contact" className="mt-3 inline-flex rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/20 hover:bg-white/25">
              Contact support
            </Link>
          </div>
        </aside>

        {/* Mobile drawer */}
        {drawer && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <button type="button" aria-label="Close menu" className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDrawer(false)} />
            <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-[320px] flex-col bg-white shadow-2xl">
              <div className="flex h-16 items-center justify-between px-5">
                <SabinaLogo href={`/${role}`} size={30} />
                <button type="button" onClick={() => setDrawer(false)} className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Close menu">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-6">
                <SidebarNav role={role} onNavigate={() => setDrawer(false)} />
              </div>
              <button type="button" onClick={signOut} className="m-4 flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700">
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </div>
        )}

        <div className="lg:pl-[264px]">
          {/* Top bar */}
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/70 bg-white/80 px-4 backdrop-blur-xl sm:px-6 lg:h-[72px] lg:px-8">
            <button type="button" onClick={() => setDrawer(true)} className="grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu">
              <Menu size={21} />
            </button>
            <div className="lg:hidden">
              <SabinaLogo href={`/${role}`} size={28} />
            </div>
            <h2 className="hidden font-heading text-lg font-semibold text-slate-900 lg:block">{current?.label ?? ""}</h2>
            <div className="ml-auto flex items-center gap-2">
              <Link
                href={`/${role}/notifications`}
                aria-label={badges.notifications ? `Notifications, ${badges.notifications} unread` : "Notifications"}
                className="relative grid h-10 w-10 place-items-center rounded-full text-slate-600 transition hover:bg-slate-100"
              >
                <Bell size={20} />
                {badges.notifications > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />}
              </Link>
              <AccountMenu user={user} role={role} />
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1280px] px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-8 lg:pb-10">
            {current?.phase ? <ComingSoon label={current.label} phase={current.phase} role={role} /> : children}
          </main>
        </div>

        {/* Mobile bottom nav */}
        <nav aria-label="Quick" className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
          <ul className="grid grid-cols-5">
            {primary.map((item) => {
              const active = isActive(path, item);
              return (
                <li key={item.href}>
                  <Link href={item.href} aria-current={active ? "page" : undefined} className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${active ? "text-brand-700" : "text-slate-500"}`}>
                    <span className="relative">
                      <NavIcon name={item.icon} size={21} />
                      {badgeFor(item.href, badges) > 0 && (
                        <span className="absolute -right-2.5 -top-1.5 min-w-[18px] rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-[18px] text-white ring-2 ring-white">{badgeFor(item.href, badges)}</span>
                      )}
                    </span>
                    {item.short ?? item.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <button type="button" onClick={() => setDrawer(true)} className="flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-slate-500">
                <Menu size={21} />
                More
              </button>
            </li>
          </ul>
        </nav>
      </div>
      </BadgeContext.Provider>
    </PortalUserContext.Provider>
  );
}
