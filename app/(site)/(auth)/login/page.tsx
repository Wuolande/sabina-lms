"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert, Honeypot, PasswordInput, SubmitButton, TextInput, postJSON } from "@/components/auth/fields";

const NOTICES: Record<string, string> = {
  inactive: "This account is not active. Please contact support.",
  verified: "Your email is confirmed. Sign in to continue.",
};

function LoginForm() {
  const params = useSearchParams();
  const redirect = params.get("redirect");
  const notice = params.get("notice") ?? params.get("error");
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [hp, setHp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setUnverified(false);
    const { ok, data } = await postJSON<{ redirectTo?: string; requiresEmailConfirmation?: boolean }>("/api/auth/login", { email, password, _hp_company: hp });
    if (ok) {
      const safe = redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : null;
      window.location.assign(safe ?? data.redirectTo ?? "/student");
      return;
    }
    if (data.requiresEmailConfirmation) setUnverified(true);
    setError(data.error ?? "Sign-in didn't work. Please try again.");
    setBusy(false);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl sm:text-[2.1rem] font-bold tracking-tight text-slate-900">Welcome back</h1>
        <p className="text-slate-600">Sign in to your lessons, messages and progress.</p>
      </div>

      {notice && NOTICES[notice] && <Alert tone={notice === "verified" ? "success" : "info"}>{NOTICES[notice]}</Alert>}

      <form onSubmit={submit} className="relative space-y-5" noValidate>
        <Honeypot value={hp} onChange={setHp} />
        <TextInput label="Email" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoFocus />
        <div className="space-y-2">
          <PasswordInput label="Password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="flex justify-end">
            <Link href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`} className="text-sm font-semibold text-brand-700 hover:text-brand-800">
              Forgot password?
            </Link>
          </div>
        </div>

        {error && (
          <Alert>
            {error}
            {unverified && (
              <>
                {" "}
                <Link href={`/verify-email?email=${encodeURIComponent(email)}`} className="font-semibold underline">
                  Send a new confirmation link
                </Link>
              </>
            )}
          </Alert>
        )}

        <SubmitButton busy={busy} busyText="Signing in…">
          Sign in
        </SubmitButton>
      </form>

      <p className="text-center text-sm text-slate-600">
        New to Sabina?{" "}
        <Link href="/register" className="font-semibold text-brand-700 hover:text-brand-800">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
