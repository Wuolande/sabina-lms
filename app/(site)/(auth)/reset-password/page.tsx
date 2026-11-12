"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert, PasswordChecklist, PasswordInput, SubmitButton, passwordOk, postJSON } from "@/components/auth/fields";

function Reset() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!passwordOk(password)) return setError("Choose a password with 8+ characters, including a letter and a number.");
    if (password !== confirm) return setError("The two passwords don't match.");
    setBusy(true);
    const { ok, data } = await postJSON<{ redirectTo?: string; code?: string }>("/api/auth/reset-password", { token, password });
    if (ok) {
      window.location.assign(data.redirectTo ?? "/student");
      return;
    }
    setExpired(data.code === "INVALID_TOKEN");
    setError(data.error ?? "Something went wrong. Please try again.");
    setBusy(false);
  }

  if (!token)
    return (
      <div className="space-y-5">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900">This link is incomplete</h1>
        <p className="text-slate-600">Open the link from the email again, or ask for a new one.</p>
        <Link href="/forgot-password" className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-brand-700 font-semibold text-white hover:bg-brand-800">
          Get a new link
        </Link>
      </div>
    );

  return (
    <div className="space-y-7">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-700">
        <LockKeyhole size={26} />
      </span>
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900">Choose a new password</h1>
        <p className="text-slate-600">You&apos;ll be signed in straight after.</p>
      </div>
      <form onSubmit={submit} className="space-y-5" noValidate>
        <div className="space-y-2.5">
          <PasswordInput label="New password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
          <PasswordChecklist value={password} />
        </div>
        <PasswordInput label="Repeat new password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {error && (
          <Alert>
            {error}
            {expired && (
              <>
                {" "}
                <Link href="/forgot-password" className="font-semibold underline">
                  Get a new link
                </Link>
              </>
            )}
          </Alert>
        )}
        <SubmitButton busy={busy} busyText="Saving…">
          Save and sign in
        </SubmitButton>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense>
        <Reset />
      </Suspense>
    </AuthShell>
  );
}
