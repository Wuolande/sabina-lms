import { money } from "../../lib/money";
import { fmtDay, fmtRange, safeTz } from "../../lib/time";
import type { MailLesson, MailPerson } from "./booking";
import { emailLayout, siteUrl } from "./layout";

const hi = (p: { firstName?: string | null }) => (p.firstName ? `Hi ${p.firstName},` : "Hi,");

export function paymentReceipt(to: MailPerson, p: { reference: string; amount: number; currency: string; lesson: MailLesson; paymentId: number }) {
  const tz = safeTz(to.timezone);
  return {
    subject: `Receipt ${p.reference}: ${money(p.amount, p.currency)}`,
    html: emailLayout({
      preheader: `Payment received for your lesson with ${p.lesson.tutorName}.`,
      heading: "Payment received",
      body: [hi(to), `We've received ${money(p.amount, p.currency)} for your lesson with ${p.lesson.tutorName} on ${fmtDay(p.lesson.startsAt, tz)}, ${fmtRange(p.lesson.startsAt, p.lesson.endsAt, tz)}.`, `Receipt ${p.reference} · booking ${p.lesson.reference}.`],
      cta: { label: "View receipt", href: `${siteUrl()}/student/payments/${p.paymentId}` },
    }),
  };
}

export function refundIssued(to: MailPerson, r: { amount: number; currency: string; bookingRef: string; reason: string }) {
  return {
    subject: `Refund of ${money(r.amount, r.currency)} on its way`,
    html: emailLayout({
      preheader: "Refunds usually reach you within 5–10 working days.",
      heading: "We've refunded you",
      body: [hi(to), `We've sent back ${money(r.amount, r.currency)} for booking ${r.bookingRef}.`, `Reason: ${r.reason}.`, "Card refunds usually appear within 5–10 working days; M-Pesa refunds are usually faster."],
      cta: { label: "See my payments", href: `${siteUrl()}/student/payments` },
    }),
  };
}

export function payoutRequested(to: MailPerson, p: { amount: number; currency: string; reference: string; to: string }) {
  return {
    subject: `Payout requested: ${money(p.amount, p.currency)}`,
    html: emailLayout({
      preheader: "Our finance team sends payouts within 3 working days.",
      heading: "Payout requested",
      body: [hi(to), `We've received your request to withdraw ${money(p.amount, p.currency)} to ${p.to}.`, `Reference ${p.reference}. Our finance team sends payouts within 3 working days and we'll email you when it's done.`],
      cta: { label: "View earnings", href: `${siteUrl()}/tutor/earnings` },
    }),
  };
}

export function payoutSent(to: MailPerson, p: { amount: number; currency: string; reference: string; transferRef?: string | null }) {
  return {
    subject: `Paid: ${money(p.amount, p.currency)} is on its way`,
    html: emailLayout({
      preheader: "Your payout has been sent.",
      heading: "Your payout has been sent",
      body: [hi(to), `We've sent ${money(p.amount, p.currency)} (payout ${p.reference}).`, ...(p.transferRef ? [`Transfer reference: ${p.transferRef}.`] : [])],
      cta: { label: "View earnings", href: `${siteUrl()}/tutor/earnings` },
    }),
  };
}
