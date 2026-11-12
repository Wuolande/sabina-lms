"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, MailCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert, SubmitButton, TextInput, postJSON } from "@/components/auth/fields";

/** Two modes: with ?token= it confirms the email; otherwise it says "check your inbox" and can resend. */
function Verify() {
  const params = useSearchParams();
  const token = params.get("token");
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [state, setState] = useState<"idle" | "checking" | "done" | "failed">(token ? "checking" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resent, setResent] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;
    postJSON("/api/auth/verify-email", { token }).then(({ ok, data }) => {
      if (ok) setState("done");
      else {
        setState("failed");
        setError(data.error ?? "This confirmation link didn't work.");
      }
    });
  }, [token]);

  async function resend(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { ok, data } = await postJSON("/api/auth/resend-code", { email });
    setBusy(false);
    if (ok) setResent(true);
    else setError(data.error ?? "Couldn't send the email. Please try again.");
  }

  if (state === "checking")
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center" role="status">
        <Loader2 className="animate-spin text-brand-700" size={36} />
        <p className="text-slate-600">Confirming your email…</p>
      </div>
    );

  if (state === "done")
    return (
      <div className="space-y-6 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={34} />
        </span>
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900">You&apos;re all set</h1>
          <p className="text-slate-600">Your email is confirmed. Sign in to get started.</p>
        </div>
        <Link href="/login?notice=verified" className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-brand-700 font-semibold text-white hover:bg-brand-800">
          Continue to sign in
        </Link>
      </div>
    );

  return (
    <div className="space-y-7">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-700">
        <MailCheck size={28} />
      </span>
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900">Check your inbox</h1>
        <p className="text-slate-600">
          {email ? (
            <>
              We sent a confirmation link to <b className="text-slate-900">{email}</b>. Open it to activate your account.
            </>
          ) : (
            "We sent you a confirmation link. Open it to activate your account."
          )}
        </p>
      </div>

      {state === "failed" && error && <Alert>{error}</Alert>}
      {resent && <Alert tone="success">If that email has an account waiting for confirmation, a new link is on its way.</Alert>}

      <form onSubmit={resend} className="space-y-4 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200/70">
        <p className="text-sm font-semibold text-slate-800">Didn&apos;t get it? Check spam, or send it again.</p>
        <TextInput label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        {state !== "failed" && error && <Alert>{error}</Alert>}
        <SubmitButton busy={busy} busyText="Sending…">
          Send a new link
        </SubmitButton>
      </form>

      <p className="text-center text-sm text-slate-600">
        Already confirmed?{" "}
        <Link href="/login" className="font-semibold text-brand-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthShell>
      <Suspense>
        <Verify />
      </Suspense>
    </AuthShell>
  );
}
