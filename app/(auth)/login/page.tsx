"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect");
  const errorParam = searchParams.get("error");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(errorParam);



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
      if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") {
        defaultTarget = "/admin";
      } else if (userRole === "TUTOR") {
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
