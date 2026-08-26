"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  AlertCircle,
  Zap,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Users,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { supabase } from "@/src/shared/database/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = React.useState<"STUDENT" | "TUTOR" | "ADMIN">("ADMIN");
  const [email, setEmail] = React.useState("admin@sabinaedge.com");
  const [password, setPassword] = React.useState("Admin@123456");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleRoleSelect = (newRole: "STUDENT" | "TUTOR" | "ADMIN") => {
    setRole(newRole);
    setErrorMsg(null);
    if (newRole === "STUDENT") {
      setEmail("student@sabinaedge.com");
      setPassword("password123");
    } else if (newRole === "TUTOR") {
      setEmail("tutor@sabinaedge.com");
      setPassword("password123");
    } else {
      setEmail("admin@sabinaedge.com");
      setPassword("Admin@123456");
    }
  };

  const handleQuickLogin = (targetRole: "STUDENT" | "TUTOR" | "ADMIN") => {
    // Set demo access session cookie
    if (typeof document !== "undefined") {
      document.cookie = `sb-access-token=demo-auth-${targetRole.toLowerCase()}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    }

    if (targetRole === "STUDENT") {
      router.push("/student");
    } else if (targetRole === "TUTOR") {
      router.push("/tutor");
    } else {
      router.push("/admin");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    // Set demo cookie to guarantee instant access
    if (typeof document !== "undefined") {
      document.cookie = `sb-access-token=demo-auth-${role.toLowerCase()}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    }

    try {
      // Attempt Supabase Auth in background (if configured)
      if (supabase) {
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        }).catch(() => null);
      }
    } catch {
      // Ignored for frictionless preview navigation
    }

    // Direct routing to selected role dashboard
    setTimeout(() => {
      if (role === "STUDENT") router.push("/student");
      else if (role === "TUTOR") router.push("/tutor");
      else router.push("/admin");
      setIsLoading(false);
    }, 250);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mb-5 flex justify-center">
          <Logo size="lg" href="/" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading">
          Welcome to Sabina LMS
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Select a persona or enter your credentials to open your workspace
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 space-y-4">
        {/* ── 1-Click Fast Pass Preview Panel ── */}
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-900 uppercase tracking-wider">
              <Zap className="h-3.5 w-3.5 text-amber-600 fill-amber-500" />
              1-Click Fast Access (No Password Needed)
            </span>
            <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
              Preview Mode
            </span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Jump directly into any workspace to explore student lessons, tutor academy, or admin controls:
          </p>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleQuickLogin("STUDENT")}
              className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:border-[#14209C] hover:bg-indigo-50/30 text-center transition-all cursor-pointer shadow-xs group"
            >
              <Users className="h-4 w-4 mx-auto text-indigo-600 group-hover:scale-110 transition-transform mb-1" />
              <strong className="text-xs font-bold text-slate-900 block leading-none">Student</strong>
              <span className="text-[10px] text-slate-400">Portal</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("TUTOR")}
              className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:border-[#14209C] hover:bg-indigo-50/30 text-center transition-all cursor-pointer shadow-xs group"
            >
              <GraduationCap className="h-4 w-4 mx-auto text-emerald-600 group-hover:scale-110 transition-transform mb-1" />
              <strong className="text-xs font-bold text-slate-900 block leading-none">Tutor</strong>
              <span className="text-[10px] text-slate-400">Academy</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("ADMIN")}
              className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:border-amber-500 hover:bg-amber-50/30 text-center transition-all cursor-pointer shadow-xs group"
            >
              <ShieldCheck className="h-4 w-4 mx-auto text-amber-600 group-hover:scale-110 transition-transform mb-1" />
              <strong className="text-xs font-bold text-slate-900 block leading-none">Admin</strong>
              <span className="text-[10px] text-slate-400">Overview</span>
            </button>
          </div>
        </div>

        {/* ── Standard Credential Login Form ── */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-card space-y-6">
          {/* Role selector tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Sign in as:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleRoleSelect("STUDENT")}
                className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  role === "STUDENT"
                    ? "border-[#14209C] bg-indigo-50 text-[#14209C] ring-1 ring-[#14209C]"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect("TUTOR")}
                className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  role === "TUTOR"
                    ? "border-[#14209C] bg-indigo-50 text-[#14209C] ring-1 ring-[#14209C]"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Tutor
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect("ADMIN")}
                className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  role === "ADMIN"
                    ? "border-amber-700 bg-amber-50 text-amber-900 ring-1 ring-amber-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-[#14209C] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              />
            </div>

            <Button
              type="submit"
              variant="default"
              size="lg"
              className="w-full font-bold bg-slate-950 hover:bg-slate-800 text-white rounded-xl shadow-xs cursor-pointer"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Sign In to {role.charAt(0) + role.slice(1).toLowerCase()} Portal
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-bold text-[#14209C] hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
