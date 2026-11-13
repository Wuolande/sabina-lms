import { money } from "../../lib/money";
import { fmtDay, fmtRange, safeTz } from "../../lib/time";
import type { MailLesson, MailPerson } from "./booking";
import { mailOf, siteUrl } from "./layout";

const hi = (p: { firstName?: string | null }) => (p.firstName ? `Hi ${p.firstName},` : "Hi,");

export function paymentReceipt(to: MailPerson, p: { reference: string; amount: number; currency: string; lesson: MailLesson; paymentId: number }) {
  const tz = safeTz(to.timezone);
  return {
    subject: `Receipt ${p.reference}: ${money(p.amount, p.currency)}`,
    ...mailOf("payment_receipt", {
      preheader: `Payment received for your lesson with ${p.lesson.tutorName}.`,
      heading: "Payment received",
      body: [hi(to), `We've received ${money(p.amount, p.currency)} for your lesson with ${p.lesson.tutorName} on ${fmtDay(p.lesson.startsAt, tz)}, ${fmtRange(p.lesson.startsAt, p.lesson.endsAt, tz)}.`, `Receipt ${p.reference} · booking ${p.lesson.reference}.`],
      cta: { label: "View receipt", href: `${siteUrl()}/student/payments/${p.paymentId}` },
    }),
  };
}

export function packageReceipt(to: MailPerson, p: { reference: string; amount: number; currency: string; id: number; lessons: number; minutes: number; tutorName: string; expiresAt: string | null }) {
  const tz = safeTz(to.timezone);
  return {
    subject: `Receipt ${p.reference}: ${p.lessons} lessons with ${p.tutorName}`,
    ...mailOf("package_receipt", {
      preheader: `Your ${p.lessons} lessons with ${p.tutorName} are ready to book.`,
      heading: "Your lessons are ready to book",
      body: [
        hi(to),
        `We've received ${money(p.amount, p.currency)} for ${p.lessons} ${p.minutes}-minute lessons with ${p.tutorName}.`,
        `Book them whenever suits you${p.expiresAt ? `, up to ${fmtDay(p.expiresAt, tz)}` : ""}. If you cancel a lesson in time, it goes back into your package.`,
        `Receipt ${p.reference}.`,
      ],
      cta: { label: "Book a lesson", href: `${siteUrl()}/student/packages` },
    }),
  };
}

export function refundIssued(to: MailPerson, r: { amount: number; currency: string; bookingRef: string; reason: string }) {
  return {
    subject: `Refund of ${money(r.amount, r.currency)} on its way`,
    ...mailOf("refund_issued", {
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
    ...mailOf("payout_requested", {
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
    ...mailOf("payout_sent", {
      preheader: "Your payout has been sent.",
      heading: "Your payout has been sent",
      body: [hi(to), `We've sent ${money(p.amount, p.currency)} (payout ${p.reference}).`, ...(p.transferRef ? [`Transfer reference: ${p.transferRef}.`] : [])],
      cta: { label: "View earnings", href: `${siteUrl()}/tutor/earnings` },
    }),
  };
}
