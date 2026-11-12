import { Client } from "pg";
import { expect, test, type Page } from "@playwright/test";
import { account, api, approvedTutor, signIn, type Account } from "./accounts";

/**
 * Phase 6: student–tutor messages (start from a profile, reply, unread badges, contact-detail
 * flag, who may write to whom), in-app notifications from bookings and payments, email
 * settings, admin on/off for an email, the email log, and lesson reminders.
 */
const ADMIN = { email: process.env.E2E_ADMIN_EMAIL || "admin@sabina.test", password: process.env.E2E_ADMIN_PASSWORD || "Admin12345!" };

async function sql<T = Record<string, unknown>>(q: string, args: unknown[] = []) {
  const db = new Client({ connectionString: process.env.DATABASE_URI });
  await db.connect();
  try {
    return (await db.query(q, args)).rows as T[];
  } finally {
    await db.end();
  }
}
async function paidLesson(student: Account, tutorId: number, slug: string, index: number) {
  const slots = (await api(`/api/tutors/${slug}/slots?minutes=60`, { cookie: student.cookie })).data.slots as string[];
  const b = await api("/api/bookings", { method: "POST", cookie: student.cookie, body: JSON.stringify({ tutorId, startsAt: slots[index], kind: "regular", minutes: 60 }) });
  const id = (b.data.booking as { id: number }).id;
  const co = await api("/api/payments/checkout", { method: "POST", cookie: student.cookie, body: JSON.stringify({ bookingId: id, provider: "dev" }) });
  await api("/api/payments/dev", { method: "POST", cookie: student.cookie, body: JSON.stringify({ ref: co.data.reference, outcome: "succeeded" }) });
  return id;
}
const emails = (to: string, template: string) => sql<{ status: string }>("select status from payload.email_log where \"to\" = $1 and template = $2 order by id", [to, template]);
const bubble = (page: Page, text: string) => page.getByRole("region", { name: "Conversation" }).getByText(text, { exact: true });
const noOverflow = async (page: Page, path: string) => {
  const [scroll, inner] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(scroll, `${path} is wider than the screen`).toBeLessThanOrEqual(inner);
};

test("messages, notifications, email settings and reminders", async ({ browser }, info) => {
  test.skip(info.project.name !== "desktop", "Runs once, on desktop");
  test.setTimeout(300_000);
  const tag = Math.random().toString(36).slice(2, 6);
  await sql("update payload.email_templates set enabled = true"); // a failed earlier run may have left one off
  const tutor = await approvedTutor("Wanjiru", `Kamau${tag}`, ADMIN);
  await api("/api/tutor/schedule", { method: "PUT", cookie: tutor.cookie, body: JSON.stringify({ timezone: "Africa/Nairobi", weekly: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, start: "06:00", end: "22:00" })), timeOff: [], noticeHours: 0, bufferMinutes: 0, instantBooking: true }) });
  const student = await account("student", "Imani", `Mwangi${tag}`);

  const sctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await signIn(sctx, student);
  const sp = await sctx.newPage();

  // 1. Student starts a conversation from the tutor's public profile.
  await sp.goto(`/tutors/${tutor.slug}`);
  await sp.getByRole("link", { name: "Send a message" }).click();
  await sp.waitForURL(/\/student\/messages\?tutor=/);
  await expect(sp.getByText(/Say hello and ask anything before you book/)).toBeVisible();
  await sp.getByLabel(/^Message /).fill("Hi! Do you cover KCSE chemistry practicals?");
  await sp.keyboard.press("Enter");
  await sp.waitForURL(/\/student\/messages\?c=\d+/);
  await expect(bubble(sp, "Hi! Do you cover KCSE chemistry practicals?")).toBeVisible();
  const conv = Number(new URL(sp.url()).searchParams.get("c"));
  expect((await api("/api/notifications?counts=1", { cookie: tutor.cookie })).data.messages).toBe(1);
  await expect.poll(async () => (await emails(tutor.email, "new_message")).map((r) => r.status)).toEqual(["no_smtp"]);

  // 2. Tutor sees it unread, opens it and replies; the student's open thread picks it up.
  const tctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await signIn(tctx, tutor);
  const tp = await tctx.newPage();
  await tp.goto("/tutor/messages");
  await expect(tp.getByRole("navigation", { name: "Portal" }).getByLabel("1 unread")).toBeVisible();
  await tp.getByRole("button", { name: new RegExp(`Imani M\\.`) }).click();
  await expect(bubble(tp, "Hi! Do you cover KCSE chemistry practicals?")).toBeVisible();
  await tp.getByLabel(/^Message /).fill("Yes, every week. Book a trial and we'll start with titration.");
  await tp.getByRole("button", { name: "Send" }).click();
  await expect(bubble(sp, "Yes, every week. Book a trial and we'll start with titration.")).toBeVisible({ timeout: 10_000 });
  expect((await api("/api/notifications?counts=1", { cookie: tutor.cookie })).data.messages).toBe(0);

  // 3. Contact details are allowed but flagged for staff, and the sender gets a gentle note.
  await sp.getByLabel(/^Message /).fill("Great. My WhatsApp is +254 712 345 678");
  await sp.keyboard.press("Enter");
  await expect(sp.getByText(/Looks like that message has contact details/)).toBeVisible();
  expect((await sql<{ flagged: boolean }>("select flagged from payload.conversations where id = $1", [conv]))[0]!.flagged).toBe(true);

  // 4. Who may write to whom.
  const stranger = await account("student", "Juma", `Out${tag}`);
  expect((await api("/api/messages", { method: "POST", cookie: tutor.cookie, body: JSON.stringify({ studentId: stranger.id, body: "Hello" }) })).res.status).toBe(403);
  expect((await api(`/api/messages/${conv}`, { cookie: stranger.cookie })).res.status).toBe(404);
  expect((await api("/api/messages", { method: "POST", cookie: student.cookie, body: JSON.stringify({ conversationId: conv, body: "   " }) })).res.status).toBe(400);

  // 5. Booking + payment land in notifications; the bell shows unread; mark all as read.
  const lesson = await paidLesson(student, tutor.profileId, tutor.slug, 30);
  await sp.goto("/student/notifications");
  await expect(sp.getByText("Your lesson is booked")).toBeVisible();
  await expect(sp.getByText("Payment received", { exact: true })).toBeVisible();
  await expect(sp.getByRole("link", { name: /Notifications, \d+ unread/ })).toBeVisible();
  await sp.getByRole("button", { name: "Mark all as read" }).click();
  await expect(sp.getByText("You're all caught up.")).toBeVisible();
  await tp.goto("/tutor/notifications");
  await expect(tp.getByText("You have a new lesson")).toBeVisible();

  // 6. Email settings: turn message emails off.
  await sp.goto("/student/notifications");
  await sp.getByRole("switch", { name: "New messages" }).click();
  await expect(sp.getByText("Saved", { exact: true })).toBeVisible();
  await expect.poll(async () => (await sql<{ v: boolean }>("select email_prefs_messages as v from payload.users where id = $1", [student.id]))[0]!.v).toBe(false);

  // 7. Admin turns the payment receipt off: the next receipt is logged as off, not sent.
  const admin = await api("/api/auth/login", { method: "POST", body: JSON.stringify(ADMIN) });
  const adminCookie = admin.res.headers.get("set-cookie")!.split(";")[0]!;
  const tpl = (await api("/api/email-templates?where[key][equals]=payment_receipt", { cookie: adminCookie })).data.docs[0] as { id: number };
  expect((await api(`/api/email-templates/${tpl.id}`, { method: "PATCH", cookie: adminCookie, body: JSON.stringify({ enabled: false }) })).res.status).toBe(200);
  await paidLesson(student, tutor.profileId, tutor.slug, 40);
  await expect.poll(async () => (await emails(student.email, "payment_receipt")).map((r) => r.status)).toEqual(["no_smtp", "off"]);
  await api(`/api/email-templates/${tpl.id}`, { method: "PATCH", cookie: adminCookie, body: JSON.stringify({ enabled: true }) });

  // 8. Reminder an hour before: sent once to each side, shown in notifications.
  await sql("update payload.bookings set starts_at = now() + interval '50 minutes', ends_at = now() + interval '110 minutes', created_at = now() - interval '1 day' where id = $1", [lesson]);
  await sp.goto("/student/lessons");
  await sp.goto("/student/lessons");
  await expect.poll(async () => (await emails(student.email, "lesson_reminder_hour")).length).toBe(1);
  await expect.poll(async () => (await emails(tutor.email, "lesson_reminder_hour")).length).toBe(1);
  await sp.goto("/student/notifications");
  await expect(sp.getByText("Your lesson starts in about an hour")).toBeVisible();
  // The cron endpoint refuses callers without the secret.
  expect((await api("/api/cron/housekeeping")).res.status).toBe(401);

  // 9. Tutor can message a student from My students (existing thread opens).
  await tp.goto("/tutor/students");
  await tp.getByRole("link", { name: /^Message Imani/ }).click();
  await expect(bubble(tp, "Hi! Do you cover KCSE chemistry practicals?")).toBeVisible();

  // 10. Phone layouts: list, thread, notifications.
  await sp.setViewportSize({ width: 390, height: 844 });
  for (const p of ["/student/messages", `/student/messages?c=${conv}`, "/student/notifications"]) {
    await sp.goto(p);
    await sp.waitForLoadState("networkidle");
    await noOverflow(sp, p);
  }
  await sp.goto(`/student/messages?c=${conv}`);
  await expect(sp.getByRole("button", { name: "Back to messages" })).toBeVisible();
  await expect(sp.getByRole("button", { name: "Send" })).toBeInViewport();
});
