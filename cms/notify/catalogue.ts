/** Every transactional email, as listed in the admin under Messages → Emails. */
export const EMAIL_CATALOGUE = [
  { key: "booking_confirmed_student", name: "Lesson booked", audience: "Student", description: "After payment, when the lesson is confirmed straight away." },
  { key: "booking_confirmed_tutor", name: "New lesson", audience: "Tutor", description: "A student booked and paid for a lesson." },
  { key: "booking_requested_student", name: "Request sent", audience: "Student", description: "After payment, while the tutor decides." },
  { key: "booking_requested_tutor", name: "Lesson request", audience: "Tutor", description: "A student asked for a lesson; the tutor must accept or decline." },
  { key: "request_accepted", name: "Lesson confirmed", audience: "Student", description: "The tutor accepted the request." },
  { key: "request_declined", name: "Request declined", audience: "Student", description: "The tutor declined. The student is refunded." },
  { key: "lesson_cancelled", name: "Lesson cancelled", audience: "Student or tutor", description: "The other person cancelled." },
  { key: "lesson_reminder_day", name: "Reminder: tomorrow", audience: "Student and tutor", description: "About 24 hours before a lesson. People can turn reminders off." },
  { key: "lesson_reminder_hour", name: "Reminder: starting soon", audience: "Student and tutor", description: "About 1 hour before a lesson. People can turn reminders off." },
  { key: "new_message", name: "New message", audience: "Student or tutor", description: "Someone sent a message. At most one email per conversation every 30 minutes." },
  { key: "review_received", name: "New review", audience: "Tutor", description: "A student reviewed a lesson." },
  { key: "payment_receipt", name: "Payment receipt", audience: "Student", description: "Payment received for a lesson." },
  { key: "refund_issued", name: "Refund sent", audience: "Student", description: "Money was refunded." },
  { key: "payout_requested", name: "Payout requested", audience: "Tutor", description: "The tutor asked to withdraw earnings." },
  { key: "payout_sent", name: "Payout sent", audience: "Tutor", description: "Finance marked a payout as paid." },
  { key: "application_received", name: "Application received", audience: "Tutor", description: "A tutor submitted their application." },
  { key: "application_approved", name: "Application approved", audience: "Tutor", description: "The tutor's profile is live." },
  { key: "application_changes", name: "Changes requested", audience: "Tutor", description: "The application needs changes." },
  { key: "application_rejected", name: "Application not approved", audience: "Tutor", description: "The application was rejected." },
] as const;

export type EmailKey = (typeof EMAIL_CATALOGUE)[number]["key"];
/** Emails people can turn off in their notification settings, and the preference that controls them. */
export const OPTIONAL: Partial<Record<EmailKey, "messages" | "reminders">> = { new_message: "messages", lesson_reminder_day: "reminders", lesson_reminder_hour: "reminders" };
