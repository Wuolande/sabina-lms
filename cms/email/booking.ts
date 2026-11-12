import { fmtDay, fmtRange, safeTz, tzLabel } from "../../lib/time";
import { mailOf, siteUrl } from "./layout";

export type MailPerson = { email: string; firstName?: string | null; timezone?: string | null };
export type MailLesson = { reference: string; startsAt: string; endsAt: string; minutes: number; subject?: string | null; kind: "trial" | "regular"; studentName: string; tutorName: string; note?: string | null; reason?: string | null };

const hi = (p: MailPerson) => (p.firstName ? `Hi ${p.firstName},` : "Hi,");
const when = (l: MailLesson, p: MailPerson) => {
  const tz = safeTz(p.timezone);
  return `${fmtDay(l.startsAt, tz)}, ${fmtRange(l.startsAt, l.endsAt, tz)}, ${tzLabel(tz, Date.parse(l.startsAt))}`;
};
const what = (l: MailLesson) => `${l.kind === "trial" ? "Trial lesson" : `${l.minutes}-minute lesson`}${l.subject ? ` · ${l.subject}` : ""}`;
const ref = (l: MailLesson) => `Booking reference ${l.reference}.`;

type Mail = import("./layout").Mail;

/** Student: their instant booking is confirmed. Tutor: a new lesson was booked. */
export function bookedConfirmed(l: MailLesson, student: MailPerson, tutor: MailPerson): { student: Mail; tutor: Mail } {
  return {
    student: {
      subject: `Booked: ${what(l)} with ${l.tutorName}`,
      ...mailOf("booking_confirmed_student", {
        preheader: when(l, student),
        heading: "Your lesson is booked",
        body: [hi(student), `${what(l)} with ${l.tutorName}.`, when(l, student), ref(l)],
        cta: { label: "View my lessons", href: `${siteUrl()}/student/lessons` },
      }),
    },
    tutor: {
      subject: `New lesson: ${l.studentName}, ${when(l, tutor)}`,
      ...mailOf("booking_confirmed_tutor", {
        preheader: `${l.studentName} booked ${what(l).toLowerCase()}.`,
        heading: "You have a new lesson",
        body: [hi(tutor), `${l.studentName} booked a ${what(l).toLowerCase()}.`, when(l, tutor), ...(l.note ? [`Their note: "${l.note}"`] : []), ref(l)],
        cta: { label: "Open my schedule", href: `${siteUrl()}/tutor/lessons` },
      }),
    },
  };
}

/** Booking needs the tutor to accept. */
export function bookingRequested(l: MailLesson, student: MailPerson, tutor: MailPerson): { student: Mail; tutor: Mail } {
  return {
    student: {
      subject: `Request sent to ${l.tutorName}`,
      ...mailOf("booking_requested_student", {
        preheader: `${l.tutorName} will confirm soon.`,
        heading: "Your request is on its way",
        body: [hi(student), `We've asked ${l.tutorName} to confirm your ${what(l).toLowerCase()}.`, when(l, student), "The time is held for you while they decide. We'll email you as soon as they reply.", ref(l)],
        cta: { label: "View my lessons", href: `${siteUrl()}/student/lessons` },
      }),
    },
    tutor: {
      subject: `Lesson request from ${l.studentName}`,
      ...mailOf("booking_requested_tutor", {
        preheader: `Please accept or decline: ${when(l, tutor)}`,
        heading: "New lesson request",
        body: [hi(tutor), `${l.studentName} would like a ${what(l).toLowerCase()}.`, when(l, tutor), ...(l.note ? [`Their note: "${l.note}"`] : []), "Please accept or decline before the lesson time, otherwise the request expires."],
        cta: { label: "Review the request", href: `${siteUrl()}/tutor/lessons` },
      }),
    },
  };
}

export function requestAccepted(l: MailLesson, student: MailPerson): Mail {
  return {
    subject: `${l.tutorName} confirmed your lesson`,
    ...mailOf("request_accepted", { preheader: when(l, student), heading: "Your lesson is confirmed", body: [hi(student), `${l.tutorName} accepted your ${what(l).toLowerCase()}.`, when(l, student), ref(l)], cta: { label: "View my lessons", href: `${siteUrl()}/student/lessons` } }),
  };
}

export function requestDeclined(l: MailLesson, student: MailPerson): Mail {
  return {
    subject: `${l.tutorName} can't take this lesson`,
    ...mailOf("request_declined", {
      preheader: "Pick another time or another tutor.",
      heading: "Your request was declined",
      body: [hi(student), `${l.tutorName} isn't able to teach at ${when(l, student)}.`, ...(l.reason ? [`Their message: "${l.reason}"`] : []), "You can pick another time, or find another tutor."],
      cta: { label: "Find a time", href: `${siteUrl()}/find-tutors` },
    }),
  };
}

export function lessonCancelled(l: MailLesson, to: MailPerson, by: string, late = false): Mail {
  return {
    subject: `Cancelled: ${what(l)} on ${fmtDay(l.startsAt, safeTz(to.timezone), { month: "short", day: "numeric" })}`,
    ...mailOf("lesson_cancelled", {
      preheader: `${by} cancelled the lesson.`,
      heading: "A lesson was cancelled",
      body: [hi(to), `${by} cancelled the ${what(l).toLowerCase()} on ${when(l, to)}.`, ...(l.reason ? [`Reason: "${l.reason}"`] : []), ...(late ? ["This was inside the free-cancellation window."] : []), ref(l)],
      cta: { label: "Open Sabina", href: siteUrl() },
    }),
  };
}
