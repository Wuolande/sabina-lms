"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CalendarCheck, CalendarX, Clock, CreditCard, GraduationCap, RotateCcw, Star, Wallet } from "lucide-react";
import type { NotificationView } from "@/cms/notify/types";

const ICONS: { test: RegExp; icon: typeof Bell; tint: string }[] = [
  { test: /reminder/, icon: Clock, tint: "bg-amber-100 text-amber-700" },
  { test: /cancel|declined/, icon: CalendarX, tint: "bg-rose-100 text-rose-700" },
  { test: /booking|request/, icon: CalendarCheck, tint: "bg-brand-100 text-brand-700" },
  { test: /refund/, icon: RotateCcw, tint: "bg-violet-100 text-violet-700" },
  { test: /payment/, icon: CreditCard, tint: "bg-emerald-100 text-emerald-700" },
  { test: /payout/, icon: Wallet, tint: "bg-emerald-100 text-emerald-700" },
  { test: /review/, icon: Star, tint: "bg-yellow-100 text-yellow-700" },
  { test: /application/, icon: GraduationCap, tint: "bg-sky-100 text-sky-700" },
];
const iconFor = (kind: string) => ICONS.find((i) => i.test.test(kind)) ?? { icon: Bell, tint: "bg-slate-100 text-slate-600" };

function when(iso: string) {
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 24 * 60 && d.toDateString() === new Date().toDateString()) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}
function bucket(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  if (now.getTime() - d.getTime() < 7 * 86400_000) return "This week";
  return "Earlier";
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-slate-200"}`}
    >
      <span className={`absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[22px]" : "translate-x-[2px]"}`} />
    </button>
  );
}

export function NotificationCenter({ initial, prefs: initialPrefs }: { initial: NotificationView[]; prefs: { messages: boolean; reminders: boolean } }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [prefs, setPrefs] = useState(initialPrefs);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const unread = items.filter((n) => !n.read).length;

  const groups = useMemo(() => {
    const out: { label: string; items: NotificationView[] }[] = [];
    for (const n of items) {
      const label = bucket(n.at);
      if (out.at(-1)?.label !== label) out.push({ label, items: [] });
      out.at(-1)!.items.push(n);
    }
    return out;
  }, [items]);

  const mark = (body: object) => fetch("/api/notifications", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => undefined);

  const openItem = async (n: NotificationView) => {
    if (!n.read) {
      setItems((cur) => cur.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      await mark({ ids: [n.id] });
      window.dispatchEvent(new Event("sabina:badges"));
    }
    if (n.href) router.push(n.href);
  };
  const markAll = async () => {
    setItems((cur) => cur.map((x) => ({ ...x, read: true })));
    await mark({ all: true });
    window.dispatchEvent(new Event("sabina:badges"));
  };
  const savePref = async (key: "messages" | "reminders", value: boolean) => {
    const before = prefs;
    setPrefs({ ...prefs, [key]: value });
    setError(null);
    const res = await fetch("/api/notifications/prefs", { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [key]: value }) }).catch(() => null);
    if (!res?.ok) {
      setPrefs(before);
      setError("Couldn't save that change. Check your connection and try again.");
      return;
    }
    setSaved(key);
    setTimeout(() => setSaved(null), 1800);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-[28px] font-bold tracking-tight text-slate-900">Notifications</h1>
          <p className="mt-1 text-[15px] text-slate-500">{unread ? `${unread} unread` : "You're all caught up."}</p>
        </div>
        {unread > 0 && (
          <button type="button" onClick={markAll} className="h-9 shrink-0 rounded-full px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50">
            Mark all as read
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl bg-white px-6 py-14 text-center ring-1 ring-slate-200/70">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
            <Bell size={26} />
          </span>
          <p className="mt-4 font-semibold text-slate-900">Nothing here yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">Bookings, reminders, payments and reviews show up here as they happen.</p>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.label}>
            <h2 className="mb-2 px-4 text-[13px] font-medium uppercase tracking-wide text-slate-500">{g.label}</h2>
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200/70">
              {g.items.map((n) => {
                const { icon: Icon, tint } = iconFor(n.kind);
                return (
                  <li key={n.id}>
                    <button type="button" onClick={() => openItem(n)} className="flex w-full items-start gap-3.5 px-4 py-3.5 text-left transition hover:bg-slate-50">
                      <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tint}`}>
                        <Icon size={18} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-3">
                          <b className={`text-[15px] ${n.read ? "font-medium text-slate-700" : "font-semibold text-slate-900"}`}>{n.title}</b>
                          <span className="shrink-0 text-xs text-slate-400">{when(n.at)}</span>
                        </span>
                        {n.body && <span className="mt-0.5 block text-sm leading-snug text-slate-500">{n.body}</span>}
                      </span>
                      {!n.read && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" aria-label="Unread" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}

      <section aria-labelledby="email-settings">
        <h2 id="email-settings" className="mb-2 px-4 text-[13px] font-medium uppercase tracking-wide text-slate-500">
          Email settings
        </h2>
        <div className="divide-y divide-slate-100 rounded-3xl bg-white ring-1 ring-slate-200/70">
          {(
            [
              ["messages", "New messages", "At most one email per conversation every 30 minutes."],
              ["reminders", "Lesson reminders", "The day before and an hour before each lesson."],
            ] as const
          ).map(([key, label, hint]) => (
            <div key={key} className="flex items-center gap-4 px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-slate-900">{label}</p>
                <p className="text-sm text-slate-500">{saved === key ? "Saved" : hint}</p>
              </div>
              <Switch checked={prefs[key]} onChange={(v) => savePref(key, v)} label={label} />
            </div>
          ))}
        </div>
        {error ? (
          <p role="alert" className="mt-2 px-4 text-sm text-red-600">
            {error}
          </p>
        ) : (
          <p className="mt-2 px-4 text-[13px] text-slate-500">Booking, payment and account emails are always sent.</p>
        )}
      </section>
    </div>
  );
}
