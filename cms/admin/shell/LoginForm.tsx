"use client";
import { useState } from "react";

/** Staff sign-in form for the admin (styled by the theme; Payload's default form is hidden). */
export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.user) {
        if (!["admin", "manager", "finance", "support", "editor"].includes(d.user.role)) {
          // Tutors and students belong in their portals.
          window.location.href = d.user.role === "tutor" ? "/tutor" : "/student";
          return;
        }
        const back = new URLSearchParams(window.location.search).get("redirect");
        window.location.href = back && back.startsWith("/") && !back.startsWith("//") ? back : "/admin";
        return;
      }
      setErr(String(d.errors?.[0]?.message ?? d.message ?? "") || "Sign-in didn't work. Please try again.");
    } catch {
      setErr("Couldn't reach the server. Check your connection and try again.");
    }
    setBusy(false);
  }

  return (
    <form className="ep-login-form" onSubmit={submit} noValidate>
      <label className="ep-lf">
        <span>Email</span>
        <input type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
      </label>
      <label className="ep-lf">
        <span>Password</span>
        <input type="password" name="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {err ? (
        <p className="ep-lf-err" role="alert">
          {err}
        </p>
      ) : null}
      <button type="submit" className="btn btn--style-primary btn--size-large ep-lf-btn" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <div className="ep-lf-links">
        <a href="/admin/forgot">Forgot password?</a>
      </div>
    </form>
  );
}
