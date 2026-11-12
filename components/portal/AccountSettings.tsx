"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Globe2, LogOut, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { Alert, PasswordChecklist, PasswordInput, SubmitButton, TextInput, passwordOk } from "@/components/auth/fields";
import { UserAvatar, usePortalUser } from "./PortalShell";

function Section({ icon: Icon, title, sub, children }: { icon: typeof UserRound; title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-6 rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70 sm:p-8 lg:grid-cols-[260px_minmax(0,1fr)]">
      <div>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <Icon size={20} />
        </span>
        <h2 className="mt-3 font-heading text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{sub}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

/** Time zones known to this browser (built after mount: server and browser lists differ). */
function useZones() {
  const [list, setList] = useState<{ z: string; label: string }[]>([]);
  useEffect(() => {
    let zs: string[];
    try {
      zs = (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf("timeZone");
    } catch {
      zs = ["UTC", "Africa/Nairobi", "Africa/Lagos", "Europe/London", "America/New_York"];
    }
    setList(zs.map((z) => ({ z, label: `${z.replace(/_/g, " ")} (${offsetOf(z)})` })));
  }, []);
  return list;
}

function offsetOf(tz: string) {
  try {
    const part = new Intl.DateTimeFormat("en-GB", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(new Date()).find((p) => p.type === "timeZoneName");
    return part?.value.replace("GMT", "UTC") ?? "";
  } catch {
    return "";
  }
}

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, credentials: "include", headers: body instanceof FormData ? undefined : { "Content-Type": "application/json" }, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data: data as Record<string, unknown> & { error?: string } };
}

function ProfileForm() {
  const user = usePortalUser();
  const router = useRouter();
  const [f, setF] = useState({ firstName: user.firstName, lastName: user.lastName, phone: user.phone, country: user.country, timezone: user.timezone });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [avatar, setAvatar] = useState(user.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const tzOptions = useZones();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { ok, data } = await send("/api/account/profile", "PATCH", f);
    setBusy(false);
    setMsg(ok ? { tone: "success", text: "Saved." } : { tone: "error", text: data.error ?? "Couldn't save. Please try again." });
    if (ok) router.refresh();
  }

  async function upload(file: File) {
    setUploading(true);
    setMsg(null);
    const fd = new FormData();
    fd.append("file", file);
    const { ok, data } = await send("/api/account/avatar", "POST", fd);
    setUploading(false);
    if (ok) {
      setAvatar(String(data.avatarUrl ?? ""));
      router.refresh();
    } else setMsg({ tone: "error", text: data.error ?? "Couldn't upload that photo." });
  }

  async function removePhoto() {
    const { ok } = await send("/api/account/avatar", "DELETE");
    if (ok) {
      setAvatar(null);
      router.refresh();
    }
  }

  return (
    <form onSubmit={save} className="space-y-5" noValidate>
      <div className="flex flex-wrap items-center gap-4">
        <UserAvatar user={{ ...user, avatarUrl: avatar }} size={72} />
        <div className="flex flex-wrap gap-2">
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
            <Camera size={16} /> {uploading ? "Uploading…" : avatar ? "Change photo" : "Upload photo"}
          </button>
          {avatar && (
            <button type="button" onClick={removePhoto} className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100">
              <Trash2 size={16} /> Remove
            </button>
          )}
        </div>
        <p className="w-full text-xs text-slate-500">JPG, PNG or WebP, up to 5 MB. A clear, friendly face helps {user.role === "tutor" ? "students choose you" : "your tutor recognise you"}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="First name" autoComplete="given-name" value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} />
        <TextInput label="Last name" autoComplete="family-name" value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} />
        <TextInput label="Phone" type="tel" autoComplete="tel" placeholder="+254 712 345 678" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <TextInput label="Country" autoComplete="country-name" placeholder="Kenya" value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="tz" className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          <Globe2 size={15} /> Time zone
        </label>
        <select
          id="tz"
          value={f.timezone}
          onChange={(e) => setF({ ...f, timezone: e.target.value })}
          className="block h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] text-slate-900 shadow-sm focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/15"
        >
          {!tzOptions.some((o) => o.z === f.timezone) && <option value={f.timezone}>{f.timezone.replace(/_/g, " ")}</option>}
          {tzOptions.map(({ z, label }) => (
            <option key={z} value={z}>
              {label}
            </option>
          ))}
        </select>
        <p className="text-[13px] text-slate-500">Lesson times are shown in this time zone.</p>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
        <div className="sm:w-48">
          <SubmitButton busy={busy} busyText="Saving…">
            Save changes
          </SubmitButton>
        </div>
        {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
      </div>
      <p className="text-xs text-slate-400">
        Email: <b className="text-slate-600">{user.email}</b>. To change it, contact support.
      </p>
    </form>
  );
}

function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!passwordOk(next)) return setMsg({ tone: "error", text: "Choose a password with 8+ characters, including a letter and a number." });
    setBusy(true);
    const { ok, data } = await send("/api/account/password", "POST", { currentPassword: current, newPassword: next });
    setBusy(false);
    if (ok) {
      setCurrent("");
      setNext("");
      setMsg({ tone: "success", text: "Password changed." });
    } else setMsg({ tone: "error", text: data.error ?? "Couldn't change your password." });
  }

  return (
    <form onSubmit={save} className="space-y-5" noValidate>
      <PasswordInput label="Current password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      <div className="space-y-2.5">
        <PasswordInput label="New password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
        <PasswordChecklist value={next} />
      </div>
      <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
        <div className="sm:w-48">
          <SubmitButton busy={busy} busyText="Saving…">
            Change password
          </SubmitButton>
        </div>
        {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
      </div>
    </form>
  );
}

export function AccountSettings() {
  const user = usePortalUser();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Account settings</h1>
        <p className="mt-1 text-slate-500">Your personal details, time zone and password.</p>
      </header>
      <Section icon={UserRound} title="Profile" sub={user.role === "tutor" ? "Your subjects, rates and bio arrive with your public profile." : "How you appear to your tutors."}>
        <ProfileForm />
      </Section>
      <Section icon={ShieldCheck} title="Password & security" sub="Use a password you don't use anywhere else.">
        <PasswordForm />
        <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">Sign out</p>
            <p className="text-xs text-slate-500">End your session on this device.</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
              window.location.assign("/login");
            }}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </Section>
    </div>
  );
}
