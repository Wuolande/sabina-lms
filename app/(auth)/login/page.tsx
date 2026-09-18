"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Mail,
  AlertCircle,
  Zap,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";

const ADMIN_ACCOUNT = {
  email: "admin@sabinaedge.com",
  pass: "Admin@123456",
  role: "ADMIN",
  target: "/admin",
};

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect");
  const errorParam = searchParams.get("error");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(errorParam);

  const handleAdminQuickLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setEmail(ADMIN_ACCOUNT.email);
    setPassword(ADMIN_ACCOUNT.pass);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: ADMIN_ACCOUNT.email, password: ADMIN_ACCOUNT.pass }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Login failed");
        setIsLoading(false);
        return;
      }

      const destination = redirectPath || ADMIN_ACCOUNT.target;
      router.push(destination);
    } catch (err) {
      setErrorMsg("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const trimmedEmail = email.trim().toLowerCase();

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Invalid login credentials");
        setIsLoading(false);
        return;
      }

      const userRole = data.user?.user_metadata?.role;
      let defaultTarget = "/student";
      if (userRole === "ADMIN" || userRole === "SUPER_ADMIN" || trimmedEmail.includes("admin")) {
        defaultTarget = "/admin";
      } else if (userRole === "TUTOR" || trimmedEmail.includes("tutor")) {
        defaultTarget = "/tutor";
      }

      const targetUrl = redirectPath || defaultTarget;
      router.push(targetUrl);
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
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading">
          Sign In to Sabina LMS
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Access your personalized dashboard, courses, and schedules
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 space-y-4">
        {/* ── 1-Click Super Admin Fast Pass ── */}
        <div className="rounded-3xl border border-amber-200/90 bg-gradient-to-br from-amber-50/90 via-white to-amber-50/50 p-4 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-950 uppercase tracking-wider">
              <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              Quick Administrator Access
            </span>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
              Super Admin
            </span>
          </div>

          <button
            type="button"
            onClick={handleAdminQuickLogin}
            disabled={isLoading}
            className="w-full p-3 rounded-2xl border border-amber-200 bg-white hover:bg-amber-100/70 active:scale-[0.99] transition-all flex items-center justify-between cursor-pointer group shadow-xs disabled:opacity-60"
          >
            <div className="flex items-center gap-2.5 text-left">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800 group-hover:bg-amber-200 transition-colors">
                <ShieldCheck className="h-4.5 w-4.5 text-amber-700" />
              </div>
              <div>
                <strong className="text-xs font-extrabold text-slate-900 block">System Administrator</strong>
                <span className="text-[11px] text-slate-500 block font-mono">admin@sabinaedge.com</span>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-800 group-hover:text-amber-950 flex items-center gap-1">
              Sign In <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>
        </div>

        {/* ── Standard Credentials Form ── */}
        <div className="bg-white py-6 px-6 sm:px-8 shadow-card rounded-3xl border border-slate-200/80 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                leftIcon={<Mail className="h-4 w-4 text-slate-400" />}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-brand-700 hover:text-brand-800 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                leftIcon={<Lock className="h-4 w-4 text-slate-400" />}
              />
            </div>

            <Button
              type="submit"
              variant="default"
              size="default"
              isLoading={isLoading}
              className="w-full bg-slate-950 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs py-3 shadow-xs cursor-pointer"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Sign In
            </Button>
          </form>

          {/* Additional Links */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-bold text-brand hover:underline">
                Sign up
              </Link>
            </span>
            <Link href="/become-a-tutor" className="text-slate-600 hover:text-brand font-medium">
              Apply as Tutor →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginPageContent />
    </React.Suspense>
  );
}
