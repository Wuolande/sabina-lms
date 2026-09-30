"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailParam = searchParams.get("email") || "";
  const tokenParam = searchParams.get("token") || "";
  const typeParam = searchParams.get("type") || "signup";
  const roleParam = searchParams.get("role") || "STUDENT";
  const noticeParam = searchParams.get("notice");

  const [email, setEmail] = React.useState(emailParam);
  const [otp, setOtp] = React.useState<string[]>(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isAutoVerifying, setIsAutoVerifying] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(
    noticeParam === "unconfirmed"
      ? "Please verify your email address to continue signing in."
      : null
  );
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
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

  // Focus first input on mount
  React.useEffect(() => {
    if (!tokenParam) {
      otpInputsRef.current[0]?.focus();
    }
  }, [tokenParam]);

  // Auto-verify if token is provided in URL (e.g. clicked direct email link)
  React.useEffect(() => {
    if (tokenParam && emailParam && !isAutoVerifying) {
      setIsAutoVerifying(true);
      executeVerification(tokenParam, emailParam, typeParam);
    }
  }, [tokenParam, emailParam]);

  const handleOtpChange = (index: number, value: string) => {
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

    // Auto-advance to next box
    if (index < 5 && digit) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
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

    if (pasted.length === 6) {
      executeVerification(pasted, email, typeParam);
    }
  };

  const executeVerification = async (code: string, targetEmail: string, verificationType: string) => {
    if (!targetEmail) {
      setErrorMsg("Email address is required.");
      setIsAutoVerifying(false);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail.trim().toLowerCase(),
          token: code.trim(),
          type: verificationType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Invalid or expired confirmation code.");
        setIsLoading(false);
        setIsAutoVerifying(false);
        return;
      }

      setSuccessMsg("Email successfully verified! Redirecting to your account...");

      // Determine redirect target
      const userRole = data.user?.user_metadata?.role || roleParam;
      setTimeout(() => {
        if (userRole === "TUTOR") {
          router.push("/onboarding/tutor");
        } else if (userRole === "STUDENT") {
          router.push("/onboarding/student");
        } else {
          router.push("/login?verified=true");
        }
      }, 1500);
    } catch {
      setErrorMsg("Verification failed due to a network error. Please try again.");
      setIsLoading(false);
      setIsAutoVerifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      setErrorMsg("Please enter all 6 digits of the confirmation code.");
      return;
    }
    executeVerification(code, email, typeParam);
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;

    setResendStatus("Sending fresh code...");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          type: typeParam,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to resend code.");
        setResendStatus(null);
        return;
      }

      setResendStatus("Code sent! Check your inbox.");
      setResendCooldown(60);
      setTimeout(() => setResendStatus(null), 4000);
    } catch {
      setErrorMsg("Network error when resending code. Please try again.");
      setResendStatus(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mb-5 flex justify-center">
          <Logo size="lg" href="/" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading">
          Verify Your Email
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          We sent a 6-digit confirmation code to{" "}
          <strong className="text-slate-800 font-semibold">{email || "your email address"}</strong>.
          Enter it below to activate your account.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 space-y-4">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-card rounded-3xl border border-slate-200/80 space-y-6">
          {/* Notification Messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {isAutoVerifying ? (
            <div className="py-8 text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-brand animate-spin mx-auto" />
              <p className="text-sm font-bold text-slate-700">Verifying confirmation link...</p>
              <p className="text-xs text-slate-400">Please wait while we activate your account.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 6-Digit OTP Input Boxes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider text-center mb-3">
                  6-Digit Confirmation Code
                </label>
                <div className="flex justify-between gap-2 sm:gap-3">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputsRef.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      onPaste={handlePaste}
                      className="w-11 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-black font-mono rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all outline-none"
                    />
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="default"
                size="default"
                isLoading={isLoading}
                disabled={otp.join("").length < 6 || isLoading}
                className="w-full bg-slate-950 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs py-3.5 shadow-xs cursor-pointer"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Confirm Email & Activate Account
              </Button>

              {/* Resend Section */}
              <div className="pt-2 text-center space-y-2">
                <p className="text-xs text-slate-500">
                  Didn&apos;t receive the code? Check your spam folder or
                </p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className={`text-xs font-bold transition-colors inline-flex items-center gap-1.5 ${
                    resendCooldown > 0
                      ? "text-slate-400 cursor-not-allowed"
                      : "text-brand hover:text-brand/80 cursor-pointer underline"
                  }`}
                >
                  <RefreshCw className={`h-3 w-3 ${resendCooldown > 0 ? "animate-spin" : ""}`} />
                  {resendCooldown > 0
                    ? `Resend available in ${resendCooldown}s`
                    : "Send a new confirmation code"}
                </button>
                {resendStatus && (
                  <p className="text-xs font-medium text-emerald-600 animate-fade-in">
                    {resendStatus}
                  </p>
                )}
              </div>
            </form>
          )}

          {/* Navigation Links */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-slate-600 hover:text-brand font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Login
            </Link>
            <Link href="/register" className="font-bold text-brand hover:underline">
              Change Email
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
          Loading verification portal...
        </div>
      }
    >
      <VerifyEmailContent />
    </React.Suspense>
  );
}
