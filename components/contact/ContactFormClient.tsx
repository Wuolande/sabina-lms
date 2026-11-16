"use client";

import * as React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

const EMPTY = { name: "", email: "", subject: "", message: "", _hp_website: "" };
const label = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700";

export function ContactFormClient({ defaults, sent }: { defaults?: { name?: string; email?: string }; sent: { title: string; text: string } }) {
  const [f, setF] = React.useState({ ...EMPTY, name: defaults?.name ?? "", email: defaults?.email ?? "" });
  const [state, setState] = React.useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = React.useState<string | null>(null);
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((v) => ({ ...v, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setState("sending");
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "We couldn't send your message. Try again in a moment.");
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't send your message. Check your connection and try again.");
      setState("idle");
    }
  };

  return (
    <div className="w-full min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:rounded-3xl sm:p-8 lg:col-span-2">
      {state === "sent" ? (
        <div className="space-y-4 py-12 text-center" role="status">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{sent.title}</h2>
          <p className="mx-auto max-w-sm text-sm text-slate-500">{sent.text}</p>
          <Button
            variant="outline"
            onClick={() => {
              setF((v) => ({ ...EMPTY, name: v.name, email: v.email }));
              setState("idle");
            }}
          >
            Send another message
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate={false}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="contact-name" className={label}>
                Your name
              </label>
              <Input id="contact-name" required maxLength={120} autoComplete="name" value={f.name} onChange={set("name")} />
            </div>
            <div>
              <label htmlFor="contact-email" className={label}>
                Email
              </label>
              <Input id="contact-email" type="email" required autoComplete="email" inputMode="email" value={f.email} onChange={set("email")} />
            </div>
          </div>
          <div>
            <label htmlFor="contact-subject" className={label}>
              Subject
            </label>
            <Input id="contact-subject" required maxLength={160} placeholder="e.g. A question about a booking" value={f.subject} onChange={set("subject")} />
          </div>
          <div>
            <label htmlFor="contact-message" className={label}>
              Message
            </label>
            <Textarea id="contact-message" required minLength={10} maxLength={5000} rows={5} placeholder="Tell us what you need help with. If it's about a lesson, include its reference." value={f.message} onChange={set("message")} />
          </div>
          {/* Hidden from people; bots that fill it in are ignored. */}
          <input type="text" name="_hp_website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={f._hp_website} onChange={set("_hp_website")} />
          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" disabled={state === "sending"} className="h-12 min-h-[44px] w-full bg-brand font-bold text-white shadow-subtle hover:brightness-90">
            {state === "sending" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Sending…
              </>
            ) : (
              "Send message"
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
