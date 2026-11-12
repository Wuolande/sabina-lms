"use client";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUp, ChevronLeft, MessageSquare, Search, ShieldCheck } from "lucide-react";
import type { ConversationView, MessageView, Party } from "@/cms/messages/types";

type Role = "student" | "tutor";
type Draft = { kind: "tutor" | "student"; id: number; other: Party };
type Pending = MessageView & { pending?: boolean; failed?: boolean; clientId?: string };

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
function listTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  if (sameDay(d, now)) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (sameDay(d, y)) return "Yesterday";
  if (now.getTime() - d.getTime() < 6 * 86400_000) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}
function dayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (sameDay(d, now)) return "Today";
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (sameDay(d, y)) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });
}
const clock = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function Avatar({ p, size = 44 }: { p: Party; size?: number }) {
  const letters = p.name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  return p.avatar ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={p.avatar} alt="" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-slate-300 to-slate-400 font-semibold text-white" style={{ width: size, height: size, fontSize: size * 0.36 }} aria-hidden="true">
      {letters || "?"}
    </span>
  );
}

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", cache: "no-store", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "Something went wrong. Please try again.");
  return data as T;
}

export function Inbox({ role, initial, openId, draft: initialDraft }: { role: Role; initial: ConversationView[]; openId: number | null; draft: Draft | null }) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [active, setActive] = useState<number | null>(openId);
  const [draft, setDraft] = useState<Draft | null>(initialDraft);
  const [query, setQuery] = useState("");

  const refreshList = useCallback(async () => {
    try {
      setList((await getJson<{ conversations: ConversationView[] }>("/api/messages")).conversations);
    } catch {
      /* keep what we have; the next poll will try again */
    }
  }, []);

  useEffect(() => {
    const t = setInterval(() => document.visibilityState === "visible" && refreshList(), 15_000);
    return () => clearInterval(t);
  }, [refreshList]);

  const open = (id: number) => {
    setDraft(null);
    setActive(id);
    setList((l) => l.map((c) => (c.id === id ? { ...c, unread: false } : c)));
    router.replace(`/${role}/messages?c=${id}`, { scroll: false });
  };
  const back = () => {
    setActive(null);
    setDraft(null);
    router.replace(`/${role}/messages`, { scroll: false });
  };

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? list.filter((c) => c.other.name.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q)) : list;
  }, [list, query]);
  const current = list.find((c) => c.id === active) ?? null;
  const threadOpen = Boolean(active || draft);

  return (
    // Phones: fill the space between the top bar and tab bar (an open thread also covers the tab bar, like iOS).
    <div
      className={`fixed inset-x-0 top-16 lg:static lg:h-[calc(100dvh-72px-4.5rem)] ${threadOpen ? "bottom-0 z-40" : "bottom-[calc(62px+env(safe-area-inset-bottom))] z-10"}`}
    >
      <div className={`flex h-full overflow-hidden bg-white lg:rounded-3xl lg:ring-1 lg:ring-slate-200/70 ${threadOpen ? "pb-[env(safe-area-inset-bottom)] lg:pb-0" : ""}`}>
        {/* Conversation list */}
        <section aria-label="Conversations" className={`${threadOpen ? "hidden lg:flex" : "flex"} w-full flex-col border-slate-200/70 lg:w-[340px] lg:shrink-0 lg:border-r`}>
          <div className="px-4 pb-3 pt-4">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Messages</h1>
            {list.length > 4 && (
              <label className="mt-3 flex h-9 items-center gap-2 rounded-xl bg-slate-100 px-3 text-slate-500">
                <Search size={16} aria-hidden="true" />
                <span className="sr-only">Search messages</span>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="w-full bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400" />
              </label>
            )}
          </div>
          {list.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-8 pb-16 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <MessageSquare size={26} />
              </span>
              <p className="mt-4 font-semibold text-slate-900">No messages yet</p>
              <p className="mt-1 text-sm text-slate-500">
                {role === "student" ? "Have a question before you book? Message a tutor from their profile." : "When a student writes to you, the conversation shows up here."}
              </p>
              {role === "student" && (
                <Link href="/find-tutors" className="mt-5 inline-flex h-10 items-center rounded-full bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800">
                  Find a tutor
                </Link>
              )}
            </div>
          ) : (
            <ul className="flex-1 overflow-y-auto px-2 pb-4">
              {shown.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => open(c.id)}
                    aria-current={c.id === active ? "true" : undefined}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${c.id === active ? "bg-brand-600 text-white" : "hover:bg-slate-50"}`}
                  >
                    <span className="relative">
                      <Avatar p={c.other} />
                      {c.unread && c.id !== active && <span className="absolute -left-1 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-brand-600 ring-2 ring-white" aria-label="Unread" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <b className={`truncate text-[15px] ${c.id === active ? "text-white" : "text-slate-900"}`}>{c.other.name}</b>
                        <span className={`shrink-0 text-xs ${c.id === active ? "text-white/80" : c.unread ? "font-semibold text-brand-700" : "text-slate-400"}`}>{listTime(c.at)}</span>
                      </span>
                      <span className={`mt-0.5 block truncate text-sm ${c.id === active ? "text-white/85" : c.unread ? "font-medium text-slate-900" : "text-slate-500"}`}>
                        {c.mine ? "You: " : ""}
                        {c.preview}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
              {shown.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-500">No conversations match “{query}”.</li>}
            </ul>
          )}
        </section>

        {/* Thread */}
        <section aria-label="Conversation" className={`${threadOpen ? "flex" : "hidden lg:flex"} min-w-0 flex-1 flex-col`}>
          {active ? (
            <Thread key={active} role={role} id={active} fallback={current?.other ?? null} onBack={back} onSent={refreshList} />
          ) : draft ? (
            <Thread
              key={`draft-${draft.id}`}
              role={role}
              id={null}
              draft={draft}
              fallback={draft.other}
              onBack={back}
              onSent={async (id) => {
                await refreshList();
                open(id);
              }}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-slate-400">
              <MessageSquare size={36} strokeWidth={1.5} />
              <p className="mt-3 text-sm">Choose a conversation to read it here.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Thread({ role, id, draft, fallback, onBack, onSent }: { role: Role; id: number | null; draft?: Draft; fallback: Party | null; onBack: () => void; onSent: (id: number) => void | Promise<void> }) {
  const [other, setOther] = useState<Party | null>(fallback);
  const [messages, setMessages] = useState<Pending[]>([]);
  const [closed, setClosed] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);
  const [flagged, setFlagged] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const lastId = useRef(0);

  const merge = useCallback((incoming: MessageView[]) => {
    if (!incoming.length) return;
    lastId.current = Math.max(lastId.current, ...incoming.map((m) => m.id));
    setMessages((cur) => {
      const known = new Set(cur.map((m) => m.id));
      return [...cur, ...incoming.filter((m) => !known.has(m.id))];
    });
  }, []);

  useEffect(() => {
    if (!id) return;
    let stop = false;
    getJson<{ other: Party; closed: boolean; messages: MessageView[] }>(`/api/messages/${id}`)
      .then((t) => {
        if (stop) return;
        setOther(t.other);
        setClosed(t.closed);
        merge(t.messages);
        window.dispatchEvent(new Event("sabina:badges"));
      })
      .catch((e: Error) => !stop && setError(e.message))
      .finally(() => !stop && setLoading(false));
    const poll = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const t = await getJson<{ closed: boolean; messages: MessageView[] }>(`/api/messages/${id}?after=${lastId.current}`);
        setClosed(t.closed);
        merge(t.messages);
      } catch {
        /* try again on the next tick */
      }
    }, 4000);
    return () => {
      stop = true;
      clearInterval(poll);
    };
  }, [id, merge]);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, loading]);

  const send = async (body: string, retryOf?: string) => {
    const clientId = retryOf ?? `c${Date.now()}`;
    const optimistic: Pending = { id: -Date.now(), body, at: new Date().toISOString(), mine: true, pending: true, clientId };
    setMessages((cur) => (retryOf ? cur.map((m) => (m.clientId === retryOf ? { ...m, pending: true, failed: false } : m)) : [...cur, optimistic]));
    try {
      const target = id ? { conversationId: id } : draft!.kind === "tutor" ? { tutorId: draft!.id } : { studentId: draft!.id };
      const out = await getJson<{ conversationId: number; message: MessageView; flagged: boolean }>("/api/messages", { method: "POST", body: JSON.stringify({ body, ...target }) });
      if (out.flagged) setFlagged(true);
      lastId.current = Math.max(lastId.current, out.message.id);
      setMessages((cur) => cur.map((m) => (m.clientId === clientId ? out.message : m)));
      setError(null);
      await onSent(out.conversationId);
    } catch (e) {
      setMessages((cur) => cur.map((m) => (m.clientId === clientId ? { ...m, pending: false, failed: true } : m)));
      setError((e as Error).message);
    }
  };

  const groups = useMemo(() => {
    const out: { day: string; items: Pending[] }[] = [];
    for (const m of messages) {
      const day = dayLabel(m.at);
      if (out.at(-1)?.day !== day) out.push({ day, items: [] });
      out.at(-1)!.items.push(m);
    }
    return out;
  }, [messages]);

  return (
    <>
      <header className="flex items-center gap-3 border-b border-slate-200/70 bg-white/80 px-3 py-2.5 backdrop-blur-xl lg:px-5 lg:py-3">
        <button type="button" onClick={onBack} className="-ml-1 flex h-10 items-center gap-0.5 rounded-xl pr-2 text-[15px] font-medium text-brand-700 lg:hidden" aria-label="Back to messages">
          <ChevronLeft size={24} /> <span className="sr-only sm:not-sr-only">Messages</span>
        </button>
        {other && <Avatar p={other} size={38} />}
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold text-slate-900">{other?.name ?? " "}</h2>
          {other?.subtitle && <p className="truncate text-xs text-slate-500">{other.subtitle}</p>}
        </div>
        {role === "student" && other?.href && (
          <Link href={`${other.href}/book`} className="hidden h-9 shrink-0 items-center rounded-full bg-brand-50 px-4 text-sm font-semibold text-brand-700 hover:bg-brand-100 sm:inline-flex">
            Book a lesson
          </Link>
        )}
      </header>

      <div ref={scroller} className="flex-1 overflow-y-auto bg-white px-3 py-4 lg:px-6" aria-live="polite">
        {!id && (
          <div className="mx-auto mb-4 flex max-w-md items-start gap-2.5 rounded-2xl bg-slate-50 p-3.5 text-[13px] leading-relaxed text-slate-600">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-600" />
            <p>
              Say hello and ask anything before you book. Keep lessons and payments on Sabina so you&apos;re covered by our refund policy.
            </p>
          </div>
        )}
        {loading && <p className="py-10 text-center text-sm text-slate-400">Loading messages…</p>}
        {groups.map((g) => (
          <div key={g.day} className="space-y-1">
            <p className="py-3 text-center text-[11.5px] font-medium text-slate-400">{g.day}</p>
            {g.items.map((m, i) => {
              const next = g.items[i + 1];
              const tail = !next || next.mine !== m.mine;
              return (
                <div key={m.clientId ?? m.id} className={`flex flex-col ${m.mine ? "items-end" : "items-start"}`}>
                  <p
                    title={clock(m.at)}
                    className={`max-w-[78%] whitespace-pre-wrap break-words px-3.5 py-2 text-[15px] leading-snug lg:max-w-[62%] ${
                      m.mine ? `rounded-[20px] bg-brand-600 text-white ${tail ? "rounded-br-md" : ""} ${m.pending ? "opacity-60" : ""}` : `rounded-[20px] bg-slate-100 text-slate-900 ${tail ? "rounded-bl-md" : ""}`
                    }`}
                  >
                    {m.body}
                  </p>
                  {m.failed ? (
                    <button type="button" onClick={() => send(m.body, m.clientId)} className="mt-1 text-xs font-medium text-red-600">
                      Not sent. Tap to try again.
                    </button>
                  ) : tail ? (
                    <span className="mb-2 mt-1 px-1 text-[11px] text-slate-400">{m.pending ? "Sending…" : clock(m.at)}</span>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {flagged && (
        <p role="status" className="mx-3 mb-2 rounded-2xl bg-amber-50 px-4 py-2.5 text-[13px] text-amber-900 ring-1 ring-amber-200 lg:mx-6">
          Looks like that message has contact details. That&apos;s fine to ask about, but please book and pay on Sabina: off-platform lessons aren&apos;t covered by refunds or support.
        </p>
      )}
      {error && (
        <p role="alert" className="mx-3 mb-2 text-sm text-red-600 lg:mx-6">
          {error}
        </p>
      )}
      {closed ? (
        <p className="border-t border-slate-200/70 px-5 py-4 text-center text-sm text-slate-500">Sabina support closed this conversation. You can still read it.</p>
      ) : (
        <Composer onSend={(b) => send(b)} name={other?.name ?? ""} />
      )}
    </>
  );
}

function Composer({ onSend, name }: { onSend: (body: string) => void; name: string }) {
  const [text, setText] = useState("");
  const box = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);
  const submit = () => {
    const body = text.trim();
    if (!body) return;
    onSend(body);
    setText("");
    box.current?.focus();
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-end gap-2 border-t border-slate-200/70 bg-white/90 px-3 py-2.5 backdrop-blur-xl lg:px-5 lg:py-3"
    >
      <label className="sr-only" htmlFor="message-box">
        Message {name}
      </label>
      <textarea
        id="message-box"
        ref={box}
        rows={1}
        value={text}
        maxLength={4000}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Message"
        className="max-h-40 min-h-[40px] flex-1 resize-none rounded-[20px] border border-slate-200 bg-white px-4 py-2 text-[15px] leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400"
      />
      <button
        type="submit"
        disabled={!text.trim()}
        aria-label="Send"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-400"
      >
        <ArrowUp size={20} strokeWidth={2.5} />
      </button>
    </form>
  );
}
