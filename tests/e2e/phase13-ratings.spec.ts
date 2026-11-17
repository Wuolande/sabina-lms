import { Client } from "pg";
import { expect, test } from "@playwright/test";
import { account, api, approvedTutor, signIn, type Account } from "./accounts";

/**
 * Ratings after every lesson: the student can rate as the lesson ends (both joined), a banner on
 * their home page asks for it, highlights are saved, the tutor's profile shows the summary, and a
 * reminder goes out once, two hours after a finished lesson that wasn't rated.
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
const shift = (id: number, startMin: number) => sql(`update payload.bookings set starts_at = now() + ($2 || ' minutes')::interval, ends_at = now() + ($2 || ' minutes')::interval + interval '1 hour' where id = $1`, [id, String(startMin)]);

test("students rate lessons as they end, and tutors' profiles show the ratings", async ({ browser }, info) => {
  test.skip(info.project.name !== "desktop", "Runs once, on desktop");
  test.setTimeout(300_000);
  const tag = Math.random().toString(36).slice(2, 6);
  const tutor = await approvedTutor("Imani", `Rating${tag}`, ADMIN);
  await api("/api/tutor/schedule", { method: "PUT", cookie: tutor.cookie, body: JSON.stringify({ timezone: "Africa/Nairobi", weekly: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, start: "06:00", end: "22:00" })), timeOff: [], noticeHours: 0, bufferMinutes: 0, instantBooking: true }) });
  const student = await account("student", "Neema", `Rater${tag}`);
  const first = await paidLesson(student, tutor.profileId, tutor.slug, 30);
  const second = await paidLesson(student, tutor.profileId, tutor.slug, 40);

  // Not yet: a lesson that hasn't happened can't be rated.
  expect((await api(`/api/lessons/${first}`, { method: "POST", cookie: student.cookie, body: JSON.stringify({ action: "review", rating: 5 }) })).res.status).toBe(409);

  // Both join; with a few minutes left the lesson can be rated, before the tutor marks it finished.
  await shift(first, -2);
  await api(`/api/lessons/${first}`, { method: "POST", cookie: student.cookie, body: JSON.stringify({ action: "join" }) });
  await api(`/api/lessons/${first}`, { method: "POST", cookie: tutor.cookie, body: JSON.stringify({ action: "join" }) });
  await shift(first, -55);

  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await signIn(ctx, student);
  const page = await ctx.newPage();
  await page.goto("/student");
  const banner = page.getByRole("region", { name: /How was your lesson with Imani\?/ });
  await expect(banner).toBeVisible();
  await banner.getByRole("radio", { name: "5 stars" }).click();
  await banner.getByRole("button", { name: "Patient" }).click();
  await banner.getByRole("button", { name: "Clear explanations" }).click();
  await banner.getByLabel(/What made it great\?/).fill("Explained forces with everyday examples.");
  await banner.getByRole("button", { name: "Post rating" }).click();
  await expect(page.getByText("Thanks for rating your lesson")).toBeVisible();
  const saved = await sql<{ rating: number; tags: string[] }>(`select r.rating::int as rating, array(select value::text from payload.reviews_highlights h where h.parent_id = r.id order by value) as tags from payload.reviews r where r.booking_id = $1`, [first]);
  expect(saved).toEqual([{ rating: 5, tags: ["clear", "patient"] }]);
  // Only once.
  expect((await api(`/api/lessons/${first}`, { method: "POST", cookie: student.cookie, body: JSON.stringify({ action: "review", rating: 1 }) })).res.status).toBe(409);
  await page.reload();
  await expect(page.getByRole("region", { name: /How was your lesson/ })).toHaveCount(0);

  // The tutor's public profile shows the summary, the breakdown and what students say.
  const pub = await browser.newPage();
  await pub.goto(`/tutors/${tutor.slug}`);
  const summary = pub.getByTestId("rating-summary");
  await expect(summary).toContainText("5.0");
  await expect(summary).toContainText("1 review from real lessons");
  await expect(summary.getByRole("listitem").first()).toContainText("5 stars");
  await expect(pub.getByText("What students say")).toBeVisible();
  await expect(pub.getByText(/Patient · 1/)).toBeVisible();
  await pub.close();

  // The second lesson finished over two hours ago and wasn't rated: one reminder, once.
  await shift(second, -200);
  await sql(`update payload.bookings set status = 'completed', completed_at = now() - interval '2 hours', student_joined_at = starts_at, tutor_joined_at = starts_at where id = $1`, [second]);
  const admin = (await api("/api/auth/login", { method: "POST", body: JSON.stringify(ADMIN) })).cookie!;
  await api("/api/jobs", { method: "POST", cookie: admin, body: JSON.stringify({ action: "run" }) });
  await expect.poll(async () => (await sql(`select 1 from payload.notifications where user_id = $1 and kind = 'rate_lesson'`, [student.id])).length).toBe(1);
  expect((await sql<{ at: string | null }>(`select review_prompted_at as at from payload.bookings where id = $1`, [second]))[0]!.at).not.toBeNull();
  await api("/api/jobs", { method: "POST", cookie: admin, body: JSON.stringify({ action: "run" }) });
  expect((await sql(`select 1 from payload.notifications where user_id = $1 and kind = 'rate_lesson'`, [student.id])).length).toBe(1);
  // It's also the lesson waiting on the home page now.
  await page.goto("/student");
  await expect(page.getByRole("region", { name: /How was your lesson with Imani\?/ })).toBeVisible();
  await ctx.close();
});
