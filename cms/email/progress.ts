import { fmtDay, safeTz } from "../../lib/time";
import type { MailPerson } from "./booking";
import { mailOf, siteUrl } from "./layout";

const hi = (p: { firstName?: string | null }) => (p.firstName ? `Hi ${p.firstName},` : "Hi,");

export function homeworkSet(to: MailPerson, a: { id: number; kind: "homework" | "quiz"; title: string; tutorName: string; dueAt: string | null }) {
  const tz = safeTz(to.timezone);
  const what = a.kind === "quiz" ? "a quiz" : "homework";
  return {
    subject: `${a.tutorName} set ${what}: ${a.title}`,
    ...mailOf("homework_set", {
      preheader: `${a.title}${a.dueAt ? `, due ${fmtDay(a.dueAt, tz, { weekday: "short", month: "short", day: "numeric" })}` : ""}.`,
      heading: a.kind === "quiz" ? "You have a new quiz" : "You have new homework",
      body: [hi(to), `${a.tutorName} set ${what} for you: “${a.title}”.`, a.dueAt ? `Please finish it by ${fmtDay(a.dueAt, tz)}.` : "Finish it before your next lesson if you can."],
      cta: { label: a.kind === "quiz" ? "Start the quiz" : "Open homework", href: `${siteUrl()}/student/homework/${a.id}` },
    }),
  };
}

export function homeworkSubmitted(to: MailPerson, a: { id: number; kind: "homework" | "quiz"; title: string; studentName: string; score?: number | null; outOf?: number | null; studentId: number }) {
  const quiz = a.kind === "quiz";
  return {
    subject: quiz ? `${a.studentName} finished “${a.title}”: ${a.score}/${a.outOf}` : `${a.studentName} handed in “${a.title}”`,
    ...mailOf("homework_submitted", {
      preheader: quiz ? `Score: ${a.score} out of ${a.outOf}.` : "It's ready for your feedback.",
      heading: quiz ? "Quiz finished" : "Homework handed in",
      body: [hi(to), quiz ? `${a.studentName} finished “${a.title}” and got ${a.score} out of ${a.outOf}.` : `${a.studentName} handed in “${a.title}”. Leave some feedback when you have a moment.`],
      cta: { label: quiz ? "See answers" : "Give feedback", href: `${siteUrl()}/tutor/homework/${a.id}` },
    }),
  };
}

export function homeworkReviewed(to: MailPerson, a: { id: number; title: string; tutorName: string }) {
  return {
    subject: `Feedback on “${a.title}”`,
    ...mailOf("homework_reviewed", {
      preheader: `${a.tutorName} left feedback on your homework.`,
      heading: "Your homework is marked",
      body: [hi(to), `${a.tutorName} left feedback on “${a.title}”.`],
      cta: { label: "Read feedback", href: `${siteUrl()}/student/homework/${a.id}` },
    }),
  };
}
