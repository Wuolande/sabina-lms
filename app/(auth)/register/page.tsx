"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "TUTOR" ? "TUTOR" : "STUDENT";

  const [role, setRole] = React.useState<"STUDENT" | "TUTOR">(initialRole);
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Registration failed");
        setIsLoading(false);
        return;
      }

      if (role === "STUDENT") {
        router.push("/onboarding/student");
      } else {
        router.push("/onboarding/tutor");
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mb-5 flex justify-center">
          <Logo size="lg" href="/" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Create your account
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Join thousands of students and tutors learning together
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-card space-y-6">
          {/* Role Choice */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              I want to:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("STUDENT")}
                className={`p-3.5 rounded-xl border text-center transition-all ${
                  role === "STUDENT"
                    ? "border-brand-700 bg-brand-50 text-brand-800 ring-2 ring-brand-700 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="block text-sm font-bold">Learn as a Student</span>
                <span className="block text-[11px] text-slate-500 mt-0.5">Book 1-on-1 lessons</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("TUTOR")}
                className={`p-3.5 rounded-xl border text-center transition-all ${
                  role === "TUTOR"
                    ? "border-brand-700 bg-brand-50 text-brand-800 ring-2 ring-brand-700 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="block text-sm font-bold">Teach as a Tutor</span>
                <span className="block text-[11px] text-slate-500 mt-0.5">Earn $40-$100/hr</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold border border-rose-200">
                {errorMsg}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  First Name
                </label>
                <Input
                  required
                  placeholder="e.g. Alex"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Last Name
                </label>
                <Input
                  required
                  placeholder="e.g. Rivera"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <Input
                type="email"
                required
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="h-4 w-4" />}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <Input
                type="password"
                required
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
              />

              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Strength:</span>
                    <span
                      className={`font-bold ${
                        password.length < 8
                          ? "text-slate-400"
                          : password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }`}
                    >
                      {password.length < 8
                        ? "Min 8 characters required"
                        : password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)
                        ? "Strong & Compliant"
                        : "Fair (add uppercase & number)"}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden flex gap-1">
                    <div className={`h-full flex-1 rounded-full ${password.length >= 8 ? "bg-emerald-500" : "bg-slate-200"}`} />
                    <div className={`h-full flex-1 rounded-full ${password.length >= 8 && /[A-Z]/.test(password) ? "bg-emerald-500" : "bg-slate-200"}`} />
                    <div className={`h-full flex-1 rounded-full ${password.length >= 8 && /[0-9]/.test(password) ? "bg-emerald-500" : "bg-slate-200"}`} />
                    <div className={`h-full flex-1 rounded-full ${password.length >= 8 && /[^A-Za-z0-9]/.test(password) ? "bg-emerald-500" : "bg-slate-200"}`} />
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="default"
              size="lg"
              className="w-full font-bold bg-brand-700 hover:bg-brand-800 shadow-card"
              isLoading={isLoading}
              disabled={isLoading || (password.length > 0 && password.length < 8)}
            >
              Continue to {role === "STUDENT" ? "Student" : "Tutor"} Setup
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-brand-700 hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading...</div>}>
      <RegisterContent />
    </React.Suspense>
  );
}
