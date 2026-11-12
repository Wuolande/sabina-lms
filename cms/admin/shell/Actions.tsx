"use client";
import { useTheme } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./icons";

export type Notice = { href: string; title: string; sub: string; when: string; kind: "quote" | "message" };
export type Destination = { href: string; label: string; section: string; icon: string };
export type NewItem = { href: string; label: string; icon: string };

/** Close a popover on outside click or Escape, returning focus to its trigger. */
function useDismiss(open: boolean, close: () => void, ref: React.RefObject<HTMLElement | null>, trigger: React.RefObject<HTMLButtonElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { close(); trigger.current?.focus(); } };
    document.addEventListener("mousedown", onDown); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open, close, ref, trigger]);
}

function Notifications({ items, count }: { items: Notice[]; count: number }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null), btn = useRef<HTMLButtonElement>(null);
  useDismiss(open, useCallback(() => setOpen(false), []), box, btn);
  return (
    <div className="ep-pop" ref={box}>
      <button ref={btn} type="button" className="ep-hbtn" aria-label={count ? `Notifications, ${count} new` : "Notifications"} aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(!open)}>
        <Icon name="Bell" />{count > 0 && <span className="ep-hbtn__dot">{count > 9 ? "9+" : count}</span>}
      </button>
      {open && (
        <div className="ep-pop__panel ep-pop__panel--wide" role="menu">
          <div className="ep-pop__head"><b>Notifications</b><span>{count ? `${count} new` : "All caught up"}</span></div>
          {items.length ? items.map((n) => (
            <a key={n.href} href={n.href} className="ep-notice" role="menuitem">
              <span className={`ep-icon-chip ep-icon-chip--${n.kind === "quote" ? "alert" : "accent"}`}><Icon name={n.kind === "quote" ? "ClipboardList" : "Users"} /></span>
              <span className="ep-notice__txt"><b>{n.title}</b><small>{n.sub}</small></span><time>{n.when}</time>
            </a>
          )) : <p className="ep-pop__empty">Nothing new in the last 24 hours.</p>}
          <div className="ep-pop__foot"><a href="/admin/collections/users">All users</a></div>
        </div>
      )}
    </div>
  );
}

function NewMenu({ items }: { items: NewItem[] }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null), btn = useRef<HTMLButtonElement>(null);
  useDismiss(open, useCallback(() => setOpen(false), []), box, btn);
  if (!items.length) return null;
  return (
    <div className="ep-pop" ref={box}>
      <button ref={btn} type="button" className="ep-btn ep-btn--primary ep-btn--sm ep-new" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(!open)}>
        <Icon name="Plus" size={16} /><span>New</span>
      </button>
      {open && (
        <div className="ep-pop__panel" role="menu">
          {items.map((i) => <a key={i.href} href={i.href} role="menuitem" className="ep-pop__item"><Icon name={i.icon} />{i.label}</a>)}
        </div>
      )}
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <button type="button" className="ep-hbtn" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} title={dark ? "Light mode" : "Dark mode"} onClick={() => setTheme(dark ? "light" : "dark")}>
      <Icon name={dark ? "Sun" : "Moon"} />
    </button>
  );
}

function CommandPalette({ destinations }: { destinations: Destination[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const show = useCallback(() => { setQ(""); setSel(0); setOpen(true); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); show(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show]);
  useEffect(() => {
    const d = dialog.current; if (!d) return;
    if (open && !d.open) { d.showModal(); requestAnimationFrame(() => input.current?.focus()); }
    if (!open && d.open) d.close();
  }, [open]);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    const pages = destinations.filter((d) => !t || `${d.label} ${d.section}`.toLowerCase().includes(t)).slice(0, 8)
      .map((d) => ({ ...d, sub: d.section }));
    const searches = t ? [
      { href: `/admin/collections/users?search=${encodeURIComponent(q.trim())}`, label: `Search users for “${q.trim()}”`, sub: "People", icon: "Search", section: "People" },
    ] : [];
    return [...pages, ...searches];
  }, [q, destinations]);
  const go = (href: string) => { setOpen(false); router.push(href); };

  return (
    <>
      <button type="button" className="ep-search" onClick={show} aria-label="Search (Command K)">
        <Icon name="Search" size={16} /><span>Search…</span><kbd>⌘K</kbd>
      </button>
      <dialog ref={dialog} className="ep-cmd" onClose={() => setOpen(false)} onClick={(e) => { if (e.target === dialog.current) setOpen(false); }} aria-label="Command palette">
        <div className="ep-cmd__box">
          <div className="ep-cmd__input"><Icon name="Search" />
            <input ref={input} value={q} placeholder="Go to a page, or search users" aria-label="Search" role="combobox" aria-expanded="true" aria-controls="ep-cmd-list" aria-activedescendant={results[sel] ? `ep-cmd-${sel}` : undefined}
              onChange={(e) => { setQ(e.target.value); setSel(0); }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, results.length - 1)); }
                if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
                if (e.key === "Enter" && results[sel]) { e.preventDefault(); go(results[sel].href); }
              }} />
            <kbd>esc</kbd>
          </div>
          <ul id="ep-cmd-list" role="listbox" className="ep-cmd__list">
            {results.map((r, i) => (
              <li key={r.href} id={`ep-cmd-${i}`} role="option" aria-selected={i === sel} className={i === sel ? "is-sel" : undefined} onMouseEnter={() => setSel(i)} onClick={() => go(r.href)}>
                <Icon name={r.icon} /><span className="ep-cmd__label">{r.label}</span><small>{r.sub}</small>{i === sel && <Icon name="CornerDownLeft" size={14} />}
              </li>
            ))}
            {!results.length && <li className="ep-cmd__empty">Nothing found. Try “users”, “media” or a person’s name.</li>}
          </ul>
        </div>
      </dialog>
    </>
  );
}

export function HeaderActionsClient({ notices, noticeCount, destinations, newItems }: { notices: Notice[]; noticeCount: number; destinations: Destination[]; newItems: NewItem[] }) {
  return (
    <div className="ep-actions">
      <CommandPalette destinations={destinations} />
      <NewMenu items={newItems} />
      <Notifications items={notices} count={noticeCount} />
      <ThemeToggle />
    </div>
  );
}
