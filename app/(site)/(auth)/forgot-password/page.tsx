"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, KeyRound } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert, Honeypot, SubmitButton, TextInput, postJSON } from "@/components/auth/fields";

function Forgot() {
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [hp, setHp] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { ok, data } = await postJSON("/api/auth/forgot-password", { email, _hp_company: hp });
    setBusy(false);
    if (ok) setSent(true);
    else setError(data.error ?? "Something went wrong. Please try again.");
  }

  return (
    <div className="space-y-7">
      <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900">
        <ArrowLeft size={16} /> Back to sign in
      </Link>
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-700">
        <KeyRound size={26} />
      </span>
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900">Forgot your password?</h1>
        <p className="text-slate-600">Enter your email and we&apos;ll send you a link to choose a new one.</p>
      </div>
      {sent ? (
        <Alert tone="success">
          If <b>{email}</b> has a Sabina account, a reset link is on its way. It works for one hour.
        </Alert>
      ) : (
        <form onSubmit={submit} className="relative space-y-5" noValidate>
          <Honeypot value={hp} onChange={setHp} />
          <TextInput label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          {error && <Alert>{error}</Alert>}
          <SubmitButton busy={busy} busyText="Sending…">
            Send reset link
          </SubmitButton>
        </form>
      )}
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <Suspense>
        <Forgot />
      </Suspense>
    </AuthShell>
  );
}
