"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, ShieldCheck, ArrowLeft, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import {
  PasswordStrengthMeter,
  PasswordConfirmationFeedback,
} from "@/components/ui/PasswordStrengthMeter";
import { useModal } from "@/components/ui/modal-context";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { alert } = useModal();

  const initialRole = searchParams.get("role") === "TUTOR" ? "TUTOR" : "STUDENT";

  const [step, setStep] = React.useState<"form" | "confirm">("form");
  const [role, setRole] = React.useState<"STUDENT" | "TUTOR">(initialRole);
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // 6-digit confirmation code state
  const [otp, setOtp] = React.useState<string[]>(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [verifyError, setVerifyError] = React.useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = React.useState(0);
  const [resendStatus, setResendStatus] = React.useState<string | null>(null);

  const otpInputsRef = React.useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

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

      // Transition to Step 2: 6-digit email confirmation code
      setStep("confirm");
      setResendCooldown(60);
      setIsLoading(false);
      // Auto-focus first digit box
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    } catch {
      setErrorMsg("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      return;
    }

    const digit = cleaned[cleaned.length - 1];
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto advance to next input
    if (index < 5 && digit) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);

    const focusIdx = Math.min(pasted.length, 5);
    otpInputsRef.current[focusIdx]?.focus();

    // Auto submit if all 6 digits pasted
    if (pasted.length === 6) {
      submitVerification(pasted);
    }
  };

  const submitVerification = async (codeToVerify?: string) => {
    const code = codeToVerify || otp.join("");
    if (code.length < 6) {
      setVerifyError("Please enter all 6 digits of the confirmation code.");
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: code, type: "signup" }),
      });

      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data.error || "Invalid or expired confirmation code.");
        setIsVerifying(false);
        return;
      }

      await alert({
        title: "Email Confirmed!",
        message: "Your account is verified and ready. Let's finish setting up your profile.",
        variant: "success",
        buttonText: "Continue to Onboarding",
      });

      if (role === "STUDENT") {
        router.push("/onboarding/student");
      } else {
        router.push("/onboarding/tutor");
      }
    } catch {
      setVerifyError("Verification failed due to a network issue. Please try again.");
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setResendStatus("Sending new code...");
    setVerifyError(null);

    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "signup" }),
      });

      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data.error || "Failed to resend code.");
        setResendStatus(null);
        return;
      }

      setResendStatus("A new 6-digit code has been dispatched to your email.");
      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
    } catch {
      setVerifyError("Failed to resend confirmation code.");
      setResendStatus(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mb-5 flex justify-center">
          <Logo size="lg" href="/" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {step === "form" ? "Create your account" : "Verify your email"}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {step === "form"
            ? "Join thousands of students and tutors learning together"
            : "Complete email confirmation to activate your account"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-card space-y-6">
          {step === "form" ? (
            <>
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
                  Create Account & Send Verification Code
                </Button>
              </form>

              <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
                Already have an account?{" "}
                <Link href="/login" className="font-bold text-brand-700 hover:underline">
                  Sign in
                </Link>
              </div>
            </>
          ) : (
            /* Step 2: 6-Digit Email Verification Code */
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 border border-brand-100 shadow-sm">
                <Mail className="h-7 w-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900">
                  Enter 6-Digit Confirmation Code
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                  We have sent an authentication code to{" "}
                  <strong className="text-slate-900 font-semibold">{email}</strong>.
                  Please enter the 6 digits below:
                </p>
              </div>

              {verifyError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold border border-rose-200">
                  {verifyError}
                </div>
              )}

              {resendStatus && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{resendStatus}</span>
                </div>
              )}

              {/* 6-Digit OTP Box Grid */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputsRef.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    className="h-12 w-11 sm:h-14 sm:w-12 rounded-xl border-2 text-center text-xl sm:text-2xl font-black text-slate-900 border-slate-200 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/20 shadow-xs transition-all"
                  />
                ))}
              </div>

              <Button
                type="button"
                variant="default"
                size="lg"
                onClick={() => submitVerification()}
                className="w-full font-bold bg-brand-700 hover:bg-brand-800 shadow-card cursor-pointer"
                isLoading={isVerifying}
                disabled={isVerifying || otp.join("").length < 6}
              >
                Verify & Activate Account
              </Button>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Edit details / email</span>
                </button>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0}
                  className={`font-bold flex items-center gap-1 cursor-pointer ${
                    resendCooldown > 0
                      ? "text-slate-400 cursor-not-allowed"
                      : "text-brand-700 hover:underline"
                  }`}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${resendCooldown > 0 ? "" : "animate-spin-hover"}`} />
                  <span>
                    {resendCooldown > 0
                      ? `Resend code in ${resendCooldown}s`
                      : "Resend Code"}
                  </span>
                </button>
              </div>
            </div>
          )}
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
