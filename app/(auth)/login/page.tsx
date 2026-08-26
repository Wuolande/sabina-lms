"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, AlertCircle } from "lucide-react";
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // 1. Attempt Supabase Auth login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (!error && data.session) {
        // Set cookie for Next.js middleware
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        
        if (role === "STUDENT") router.push("/student");
        else if (role === "TUTOR") router.push("/tutor");
        else router.push("/admin");
        return;
      }

      // 2. If in dev mode, allow bypass if needed
      if (process.env.NODE_ENV === "development") {
        if (role === "STUDENT") router.push("/student");
        else if (role === "TUTOR") router.push("/tutor");
        else router.push("/admin");
        return;
      }

      if (error) {
        setErrorMsg(error.message);
      }
    } catch (err: any) {
      if (process.env.NODE_ENV === "development") {
        if (role === "STUDENT") router.push("/student");
        else if (role === "TUTOR") router.push("/tutor");
        else router.push("/admin");
      } else {
        setErrorMsg(err.message || "Failed to sign in. Please check your credentials.");
      }
    } finally {
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
          Welcome back
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Sign in to your Sabina Edge learning or teaching workspace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
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
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
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
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
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
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
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
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="h-4 w-4" />}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-[#14209C] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
              />
            </div>

            <Button
              type="submit"
              variant="default"
              size="lg"
              className="w-full font-bold bg-[#14209C] hover:bg-[#0d1870] text-white shadow-card"
              isLoading={isLoading}
            >
              Sign In to {role === "STUDENT" ? "Student" : role === "TUTOR" ? "Tutor" : "Admin"} Portal
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-bold text-[#14209C] hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
