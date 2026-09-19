"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import {
  PasswordStrengthMeter,
  PasswordConfirmationFeedback,
} from "@/components/ui/PasswordStrengthMeter";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "TUTOR" ? "TUTOR" : "STUDENT";

  const [role, setRole] = React.useState<"STUDENT" | "TUTOR">(initialRole);
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please verify both entries.");
      setIsLoading(false);
      return;
    }

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
                Password *
              </label>
              <Input
                type="password"
                required
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
              />
              <PasswordStrengthMeter password={password} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm Password *
              </label>
              <Input
                type="password"
                required
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
              />
              <PasswordConfirmationFeedback
                password={password}
                confirmPassword={confirmPassword}
              />
            </div>

            <Button
              type="submit"
              variant="default"
              size="lg"
              className="w-full font-bold bg-brand-700 hover:bg-brand-800 shadow-card cursor-pointer"
              isLoading={isLoading}
              disabled={isLoading || password.length < 8 || password !== confirmPassword}
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
