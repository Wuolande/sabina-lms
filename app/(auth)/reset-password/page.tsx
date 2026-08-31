"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, CheckCircle2, ArrowLeft, AlertCircle, KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token") || searchParams.get("access_token") || searchParams.get("code") || "";

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [token, setToken] = React.useState(tokenParam);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  // Check URL hash if tokens are in anchor fragment (#access_token=...)
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashToken = hashParams.get("access_token") || hashParams.get("token");
      if (hashToken) setToken(hashToken);
    }
  }, []);

  const calculateStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = calculateStrength(password);

  const getStrengthLabel = (s: number) => {
    switch (s) {
      case 1:
        return { label: "Weak (add capital, number or symbol)", color: "bg-rose-500", text: "text-rose-600" };
      case 2:
        return { label: "Fair (add more variety)", color: "bg-amber-500", text: "text-amber-600" };
      case 3:
        return { label: "Good (meets requirements)", color: "bg-blue-500", text: "text-blue-600" };
      case 4:
        return { label: "Strong & Secure", color: "bg-emerald-500", text: "text-emerald-600" };
      default:
        return { label: "Too Short (min 8 chars)", color: "bg-slate-200", text: "text-slate-400" };
    }
  };

  const strengthInfo = getStrengthLabel(strength);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          accessToken: token || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login?message=Password+updated+successfully");
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mb-5 flex justify-center">
          <Logo size="lg" href="/" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Set New Password
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Create a secure password for your Sabina LMS account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-card space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Password Requirement</p>
                <p className="mt-0.5 text-rose-700">{errorMsg}</p>
              </div>
            </div>
          )}

          {success ? (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 animate-bounce">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Password Updated!</h3>
              <p className="text-xs text-slate-500">
                Your account password has been updated securely. Redirecting to sign in...
              </p>
              <Link href="/login" className="block pt-2">
                <Button variant="default" size="sm" className="w-full font-bold bg-[#14209C]">
                  Continue to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password
                </label>
                <Input
                  type="password"
                  required
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="h-4 w-4" />}
                />

                {/* Password Strength Meter */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Strength:</span>
                      <span className={`font-bold ${strengthInfo.text}`}>{strengthInfo.label}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden flex gap-1">
                      <div className={`h-full flex-1 rounded-full ${strength >= 1 ? strengthInfo.color : "bg-slate-200"}`} />
                      <div className={`h-full flex-1 rounded-full ${strength >= 2 ? strengthInfo.color : "bg-slate-200"}`} />
                      <div className={`h-full flex-1 rounded-full ${strength >= 3 ? strengthInfo.color : "bg-slate-200"}`} />
                      <div className={`h-full flex-1 rounded-full ${strength >= 4 ? strengthInfo.color : "bg-slate-200"}`} />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  required
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock className="h-4 w-4" />}
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Password Security Standard:</span>
                </div>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
                  <li>At least 8 characters long</li>
                  <li>Mix of uppercase and lowercase letters</li>
                  <li>At least one number and one symbol</li>
                </ul>
              </div>

              <Button
                type="submit"
                variant="default"
                size="lg"
                isLoading={loading}
                disabled={loading || password.length < 8 || password !== confirmPassword}
                className="w-full font-bold bg-[#14209C] hover:bg-[#0e176b] text-white flex items-center justify-center gap-2"
              >
                <KeyRound className="h-4 w-4" />
                <span>Save New Password</span>
              </Button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-slate-500 hover:text-brand-700 flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-slate-500">Loading...</div>}>
      <ResetPasswordContent />
    </React.Suspense>
  );
}
