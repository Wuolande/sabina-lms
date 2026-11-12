import { fmtDay, fmtRange, safeTz, tzLabel } from "../../lib/time";
import type { MailLesson, MailPerson } from "./booking";
import { mailOf, siteUrl, type Mail } from "./layout";

const hi = (p: { firstName?: string | null }) => (p.firstName ? `Hi ${p.firstName},` : "Hi,");

/** Reminder before a lesson. `soon` = about an hour before; otherwise the day before. */
export function lessonReminder(l: MailLesson & { id: number }, to: MailPerson, role: "student" | "tutor", soon: boolean): Mail {
  const tz = safeTz(to.timezone);
  const other = role === "student" ? l.tutorName : l.studentName;
  const at = `${fmtRange(l.startsAt, l.endsAt, tz)}, ${tzLabel(tz, Date.parse(l.startsAt))}`;
  const what = l.subject ? `${l.subject} with ${other}` : `your lesson with ${other}`;
  return soon
    ? {
        subject: `Starting soon: ${what}`,
        ...mailOf("lesson_reminder_hour", {
          preheader: `Today, ${at}. The classroom opens 15 minutes before.`,
          heading: "Your lesson starts in about an hour",
          body: [hi(to), `${what.charAt(0).toUpperCase()}${what.slice(1)}, today at ${at}.`, "The classroom opens 15 minutes before the start. Check your camera and microphone in the lobby before you join."],
          cta: { label: "Open the lesson", href: `${siteUrl()}/${role}/lessons/${l.id}` },
        }),
      }
    : {
        subject: `Tomorrow: ${what}`,
        ...mailOf("lesson_reminder_day", {
          preheader: `${fmtDay(l.startsAt, tz)}, ${at}.`,
          heading: "You have a lesson tomorrow",
          body: [hi(to), `${what.charAt(0).toUpperCase()}${what.slice(1)}.`, `${fmtDay(l.startsAt, tz)}, ${at}.`, ...(role === "student" ? ["Free cancellation ends 24 hours before the start."] : [])],
          cta: { label: "View the lesson", href: `${siteUrl()}/${role}/lessons/${l.id}` },
        }),
      };
}

export function newMessage(to: MailPerson, from: string, preview: string, href: string): Mail {
  return {
    subject: `New message from ${from}`,
    ...mailOf("new_message", {
      preheader: preview.slice(0, 120),
      heading: `${from} sent you a message`,
      body: [hi(to), `"${preview.length > 280 ? `${preview.slice(0, 277)}…` : preview}"`],
      cta: { label: "Reply", href: `${siteUrl()}${href}` },
      footnote: "You can turn off message emails in Notifications → Email settings.",
    }),
  };
}

export function reviewReceived(to: MailPerson, from: string, rating: number, comment: string): Mail {
  return {
    subject: `${from} left you a ${rating}-star review`,
    ...mailOf("review_received", {
      preheader: comment ? comment.slice(0, 120) : `${rating} out of 5 stars.`,
      heading: "You have a new review",
      body: [hi(to), `${from} rated your lesson ${rating} out of 5.`, ...(comment ? [`"${comment}"`] : []), "You can reply publicly from your reviews page."],
      cta: { label: "See the review", href: `${siteUrl()}/tutor/reviews` },
    }),
  };
}
