"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, GraduationCap } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert, Honeypot, PasswordChecklist, PasswordInput, SubmitButton, TextInput, passwordOk, postJSON } from "@/components/auth/fields";

type Role = "student" | "tutor";

function RoleCard({ value, current, onPick, title, sub, Icon }: { value: Role; current: Role; onPick: (r: Role) => void; title: string; sub: string; Icon: typeof BookOpen }) {
  const on = value === current;
  return (
    <label
      className={`relative flex cursor-pointer gap-3 rounded-2xl border p-4 transition focus-within:ring-4 focus-within:ring-brand-600/15 ${on ? "border-brand-600 bg-brand-50/60 shadow-sm" : "border-slate-200 hover:border-slate-300"}`}
    >
      <input type="radio" name="role" value={value} checked={on} onChange={() => onPick(value)} className="sr-only" />
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${on ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-600"}`}>
        <Icon size={20} />
      </span>
      <span className="pr-6">
        <b className="block text-[15px] text-slate-900">{title}</b>
        <span className="text-[13px] text-slate-500">{sub}</span>
      </span>
      <span aria-hidden className={`absolute right-4 top-4 h-4 w-4 rounded-full border-2 ${on ? "border-brand-700 bg-brand-700 shadow-[inset_0_0_0_3px_#fff]" : "border-slate-300"}`} />
    </label>
  );
}

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState<Role>(params.get("role")?.toLowerCase() === "tutor" ? "tutor" : "student");
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accept, setAccept] = useState(false);
  const [hp, setHp] = useState("");
  const [tz, setTz] = useState("UTC");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taken, setTaken] = useState(false);

  useEffect(() => {
    try {
      setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
    } catch {
      /* keep UTC */
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setTaken(false);
    if (!firstName.trim() || !lastName.trim()) return setError("Enter your first and last name.");
    if (!passwordOk(password)) return setError("Choose a password with 8+ characters, including a letter and a number.");
    if (!accept) return setError("Please accept the terms and privacy policy to continue.");
    setBusy(true);
    const { ok, data } = await postJSON<{ code?: string }>("/api/auth/register", { role, firstName, lastName, email, password, acceptTerms: accept, timezone: tz, _hp_company: hp });
    if (ok) {
      router.push(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}&sent=1`);
      return;
    }
    setTaken(data.code === "EMAIL_TAKEN");
    setError(data.error ?? "We couldn't create your account. Please try again.");
    setBusy(false);
  }

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl sm:text-[2.1rem] font-bold tracking-tight text-slate-900">Create your account</h1>
        <p className="text-slate-600">Free to join. It takes less than a minute.</p>
      </div>

      <form onSubmit={submit} className="relative space-y-5" noValidate>
        <Honeypot value={hp} onChange={setHp} />
        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="sr-only">I want to</legend>
          <RoleCard value="student" current={role} onPick={setRole} title="I want to learn" sub="Find a tutor and book lessons" Icon={BookOpen} />
          <RoleCard value="tutor" current={role} onPick={setRole} title="I want to teach" sub="Apply to tutor on Sabina" Icon={GraduationCap} />
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="First name" autoComplete="given-name" required value={firstName} onChange={(e) => setFirst(e.target.value)} />
          <TextInput label="Last name" autoComplete="family-name" required value={lastName} onChange={(e) => setLast(e.target.value)} />
        </div>
        <TextInput label="Email" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <div className="space-y-2.5">
          <PasswordInput label="Password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <PasswordChecklist value={password} />
        </div>

        <label className="flex items-start gap-3 text-sm text-slate-600">
          <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="mt-0.5 h-5 w-5 rounded-md border-slate-300 text-brand-700 focus:ring-brand-600" />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="font-semibold text-brand-700 underline-offset-2 hover:underline" target="_blank">
              terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-semibold text-brand-700 underline-offset-2 hover:underline" target="_blank">
              privacy policy
            </Link>
            .
          </span>
        </label>

        {error && (
          <Alert>
            {error}
            {taken && (
              <>
                {" "}
                <Link href={`/login?email=${encodeURIComponent(email)}`} className="font-semibold underline">
                  Sign in instead
                </Link>
              </>
            )}
          </Alert>
        )}

        <SubmitButton busy={busy} busyText="Creating your account…">
          {role === "tutor" ? "Create tutor account" : "Create student account"}
        </SubmitButton>
      </form>

      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-700 hover:text-brand-800">
          Sign in
        </Link>
      </p>
    </div>
  );
}

function Shell() {
  const params = useSearchParams();
  return (
    <AuthShell audience={params.get("role")?.toLowerCase() === "tutor" ? "tutor" : "student"}>
      <RegisterForm />
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <Shell />
    </Suspense>
  );
}
