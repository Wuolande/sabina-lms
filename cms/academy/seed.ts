import { lexical } from "../content/lexical";

type Rules = { cancelHours: number; trialMinutes: number; tutorShare: number; earlyJoin: number; lateRefund: number; lateRefundSentence: string; holdDays: number; minPayout: number; currency: string };

/** The starter course every new tutor sees: how Sabina works, in five short lessons and a quiz. */
export function starterCourse(r: Rules) {
  return {
    title: "Teaching on Sabina",
    slug: "teaching-on-sabina",
    summary: "How bookings, the classroom, cancellations and payouts work. Five short lessons and a quiz, about 20 minutes.",
    required: true,
    order: 0,
    status: "published" as const,
    lessons: [
      {
        title: "How bookings work",
        minutes: 4,
        body: lexical([
          ["p", "Students book from the times you open in **Availability**. They only see times that fit your hours, your notice period and the gap you want between lessons."],
          ["h3", "Instant bookings and requests"],
          ["ul", [
            "With **instant booking** on, a paid booking is confirmed straight away.",
            "With it off, each booking arrives as a **request**. Accept or decline it from Lessons. If you don't reply before the lesson time, the request expires and the student is refunded.",
          ]],
          ["h3", "Trial lessons"],
          ["p", "If you offer trials, each student can book one {trialMinutes}-minute trial with you at a lower price. Use it to understand their goals and plan the next lessons."],
        ]),
      },
      {
        title: "Your classroom",
        minutes: 4,
        body: lexical([
          ["p", "The classroom runs in the browser, so neither of you needs to install anything. It opens {earlyJoin} minutes before the start."],
          ["ul", [
            "Check your camera and microphone in the lobby before you join.",
            "Share your screen to show notes, slides or a worked example.",
            "Use the chat for links, spellings and formulas.",
            "When you're done, tap **Finish lesson** and leave a few notes for the student. They see them on their Progress page.",
          ]],
          ["h3", "Attendance matters"],
          ["p", "We record who joins. If you don't join a lesson, it's marked as a tutor no-show and the student gets a full refund. If the student doesn't come but you do, the lesson still counts as taught."],
        ]),
      },
      {
        title: "Cancellations and refunds",
        minutes: 3,
        body: lexical([
          ["ul", [
            "Students can cancel up to {cancelHours} hours before the start for a full refund. Later than that, {lateRefundSentence}.",
            "If you cancel or decline, the student is always refunded in full.",
            "Students can report a problem up to 48 hours after a lesson. Our team reviews each report.",
          ]],
          ["p", "Cancel only when you really have to. Reliable tutors get better reviews and more bookings."],
        ]),
      },
      {
        title: "Getting paid",
        minutes: 4,
        body: lexical([
          ["p", "You keep **{tutorShare}%** of each lesson's price. The rest is Sabina's fee, which covers payments, the classroom, marketing and support."],
          ["ul", [
            `Earnings become available ${r.holdDays} days after a lesson is completed.`,
            `Once you have at least ${r.minPayout} ${r.currency} available, request a payout from **Earnings**.`,
            "Add your M-Pesa number, PayPal email or bank details first. Our finance team sends payouts within 3 working days.",
          ]],
        ]),
      },
      {
        title: "Reviews and messages",
        minutes: 3,
        body: lexical([
          ["p", "After a completed lesson, students can leave a rating and a comment. You can reply publicly from **Reviews**. Keep replies short and kind, even to critical reviews."],
          ["h3", "Messages"],
          ["p", "Students can message you before they book. Answer quickly: it's often what decides whether they book."],
          ["p", "Keep lessons and payments on Sabina. Arranging paid lessons elsewhere with students you met here breaks our terms, and those lessons aren't protected by refunds or support."],
        ]),
      },
    ],
    quiz: {
      passMark: 80,
      questions: [
        { question: "A student books when your instant booking is off. What happens?", options: [{ text: "It's confirmed straight away" }, { text: "It's a request you accept or decline before the lesson time" }, { text: "The student has to message you first" }], answer: 2, explain: "Without instant booking, every booking is a request. Unanswered requests expire at the lesson time and the student is refunded." },
        { question: "When does the classroom open?", options: [{ text: "At the exact start time" }, { text: "{earlyJoin} minutes before the start" }, { text: "An hour before the start" }], answer: 2, explain: "You and the student can go in {earlyJoin} minutes early to check your camera and microphone." },
        { question: "You can't make a lesson and don't join. What happens?", options: [{ text: "Nothing, the lesson still counts" }, { text: "It's marked as a tutor no-show and the student gets a full refund" }, { text: "The student is charged half" }], answer: 2, explain: "If the tutor doesn't join, the student is refunded in full automatically." },
        { question: "What share of each lesson's price do you keep?", options: [{ text: "100%" }, { text: "{tutorShare}%" }, { text: "50%" }], answer: 2, explain: "Sabina's fee is the rest. It covers payments, the classroom and support." },
        { question: "A student asks to pay you directly on M-Pesa for future lessons. What should you do?", options: [{ text: "Agree, it's cheaper for them" }, { text: "Ask them to book on Sabina" }, { text: "Agree, but only for trial lessons" }], answer: 2, explain: "Lessons arranged off Sabina break our terms and aren't covered by refunds or support." },
      ],
    },
  };
}
