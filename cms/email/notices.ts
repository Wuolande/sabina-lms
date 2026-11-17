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

/** Credit (or an earnings bonus) from a friend's invite. */
export function referralReward(to: MailPerson, r: { amount: number; currency: string; friend: string; asEarnings?: boolean; welcome?: boolean }): Mail {
  const amt = new Intl.NumberFormat("en", { style: "currency", currency: r.currency, maximumFractionDigits: 2 }).format(r.amount);
  const heading = r.welcome ? `You have ${amt} of lesson credit` : r.asEarnings ? `${amt} bonus for inviting ${r.friend}` : `${amt} of lesson credit for inviting ${r.friend}`;
  const body = r.welcome
    ? [hi(to), `You joined with ${r.friend}'s invite and finished your first lesson, so we've added ${amt} of lesson credit to your account. It's taken off your next lesson automatically.`]
    : r.asEarnings
      ? [hi(to), `${r.friend} joined with your invite and finished their first lesson. We've added a ${amt} bonus to your earnings; it's paid out with your next withdrawal.`]
      : [hi(to), `${r.friend} joined with your invite and finished their first lesson. We've added ${amt} of lesson credit to your account; it's taken off your next lesson automatically.`];
  return {
    subject: heading,
    ...mailOf("referral_reward", { preheader: "Thanks for spreading the word.", heading, body, cta: { label: r.asEarnings ? "See your earnings" : "Invite more friends", href: `${siteUrl()}/${r.asEarnings ? "tutor/earnings" : "student/invite"}` } }),
  };
}

/** A couple of hours after a lesson, if the student hasn't rated it. */
export function rateLesson(to: MailPerson, l: { id: number; tutorName: string; subject?: string | null }): Mail {
  const what = l.subject ? `${l.subject} lesson with ${l.tutorName}` : `lesson with ${l.tutorName}`;
  return {
    subject: `How was your ${what}?`,
    ...mailOf("rate_lesson", {
      preheader: "Tap a star. It takes ten seconds and helps other students choose.",
      heading: `How was your lesson with ${l.tutorName}?`,
      body: [hi(to), `Rate your ${what}. It takes ten seconds, shows only your first name, and helps other students choose the right tutor.`],
      cta: { label: "Rate the lesson", href: `${siteUrl()}/student/lessons/${l.id}#review` },
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
