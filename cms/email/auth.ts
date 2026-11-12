import { emailLayout, siteUrl } from "./layout";

type U = { firstName?: string | null; name?: string | null; email?: string | null } | undefined;
const hi = (u: U) => (u?.firstName ? `Hi ${u.firstName},` : "Hi,");

export const verifyEmailSubject = () => "Confirm your email for Sabina";
export function verifyEmailHTML({ token, user }: { token?: string; user?: U }) {
  const href = `${siteUrl()}/verify-email?token=${encodeURIComponent(token ?? "")}`;
  return emailLayout({
    preheader: "One click to confirm your email and start learning.",
    heading: "Confirm your email",
    body: [hi(user), "Welcome to Sabina. Confirm your email address to activate your account."],
    cta: { label: "Confirm my email", href },
    footnote: "If you didn't create a Sabina account, you can ignore this email.",
  });
}

export const resetPasswordSubject = () => "Reset your Sabina password";
export function resetPasswordHTML(args?: { token?: string; user?: U }) {
  const href = `${siteUrl()}/reset-password?token=${encodeURIComponent(args?.token ?? "")}`;
  return emailLayout({
    preheader: "Choose a new password for your Sabina account.",
    heading: "Reset your password",
    body: [hi(args?.user), "We received a request to reset the password for your Sabina account. This link works for one hour."],
    cta: { label: "Choose a new password", href },
    footnote: "If you didn't ask for this, you can ignore this email. Your password stays the same.",
  });
}
