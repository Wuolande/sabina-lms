import { Client } from "pg";
import { expect, test, type Page } from "@playwright/test";
import { account, api, approvedTutor, signIn, type Account } from "./accounts";

/**
 * Phase 5: the classroom opens on time and only for the two people in the lesson; attendance
 * decides completed / tutor no-show (with refund); reviews, replies, notes, problem reports,
 * My students and Progress. Video uses a dummy LiveKit project locally, so the room itself
 * can't connect; we check the token, the lobby and the friendly connection error.
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
/** Move a lesson so it starts `startMin` minutes from now (negative = in the past). */
const shift = (id: number, startMin: number) => sql(`update payload.bookings set starts_at = now() + ($2 || ' minutes')::interval, ends_at = now() + ($2 || ' minutes')::interval + interval '1 hour' where id = $1`, [id, String(startMin)]);
const noOverflow = async (page: Page, path: string) => {
  const [scroll, inner] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(scroll, `${path} is wider than the screen`).toBeLessThanOrEqual(inner);
};

test("classroom, attendance, reviews, notes and progress", async ({ browser }, info) => {
  test.skip(info.project.name !== "desktop", "Runs once, on desktop");
  test.setTimeout(360_000);
  const tag = Math.random().toString(36).slice(2, 6);
  const tutor = await approvedTutor("Zawadi", `Njoroge${tag}`, ADMIN);
  await api("/api/tutor/schedule", { method: "PUT", cookie: tutor.cookie, body: JSON.stringify({ timezone: "Africa/Nairobi", weekly: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, start: "06:00", end: "22:00" })), timeOff: [], noticeHours: 0, bufferMinutes: 0, instantBooking: true }) });
  const student = await account("student", "Baraka", `Otieno${tag}`);
  const lesson = await paidLesson(student, tutor.profileId, tutor.slug, 30);

  const sctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await signIn(sctx, student);
  const sp = await sctx.newPage();

  // 1. Too early: the lobby shows when it opens, and the API refuses a token.
  await shift(lesson, 120);
  await sp.goto(`/lessons/${lesson}`);
  await expect(sp.getByRole("button", { name: /^Opens at / })).toBeDisabled();
  expect((await api(`/api/lessons/${lesson}`, { method: "POST", cookie: student.cookie, body: JSON.stringify({ action: "join" }) })).res.status).toBe(409);

  // 2. Five minutes before: "Join lesson" on the list and in the lobby; a token is issued.
  await shift(lesson, 5);
  await sp.goto("/student/lessons");
  await sp.getByRole("link", { name: "Join lesson" }).click();
  await sp.waitForURL(`**/lessons/${lesson}`);
  await expect(sp.getByRole("heading", { level: 1 })).toContainText("Physics");
  await expect(sp.getByText(/Starts in \d+:\d\d\. You can go in now\./)).toBeVisible();
  const join = await api(`/api/lessons/${lesson}`, { method: "POST", cookie: student.cookie, body: JSON.stringify({ action: "join" }) });
  expect(join.res.status).toBe(200);
  expect(String(join.data.token).split(".")).toHaveLength(3);
  expect(join.data.role).toBe("student");
  // The dummy video server can't be reached: the student sees a clear message, not a broken page.
  await sp.getByRole("button", { name: "Join lesson" }).click();
  await expect(sp.locator("p[role=alert]")).toContainText(/couldn't connect to the classroom|couldn't open the classroom/i);
  // Nobody else gets in.
  const stranger = await account("student", "Eve", `Out${tag}`);
  expect((await api(`/api/lessons/${lesson}`, { method: "POST", cookie: stranger.cookie, body: JSON.stringify({ action: "join" }) })).res.status).toBe(404);
  const sp2 = await (await browser.newContext()).newPage();
  await signIn(sp2.context(), stranger);
  expect((await sp2.goto(`/lessons/${lesson}`))?.status()).toBe(404);

  // 3. The tutor joins too, then the lesson ends: attendance marks it completed.
  expect((await api(`/api/lessons/${lesson}`, { method: "POST", cookie: tutor.cookie, body: JSON.stringify({ action: "join" }) })).data.role).toBe("tutor");
  await shift(lesson, -100);
  await sp.goto("/student/lessons");
  await sp.getByRole("tab", { name: /Past/ }).click();
  await expect(sp.locator("article").getByText("Completed")).toBeVisible();
  expect((await sql<{ status: string }>("select status from payload.bookings where id = $1", [lesson]))[0]!.status).toBe("completed");
  expect((await sql<{ n: string }>("select stats_lessons_taught as n from payload.tutor_profiles where id = $1", [tutor.profileId]))[0]!.n).toBe("1");

  // 4. A second lesson the tutor never joins: tutor no-show, full refund.
  const missed = await paidLesson(student, tutor.profileId, tutor.slug, 40);
  await shift(missed, -200);
  await sp.goto(`/student/lessons/${missed}`);
  await expect(sp.getByText(/didn't join this lesson, so we've refunded you in full/)).toBeVisible();
  expect((await sql<{ payment_status: string }>("select payment_status from payload.bookings where id = $1", [missed]))[0]!.payment_status).toBe("refunded");

  // 5. Review the completed lesson (5 stars) from the lesson page.
  await sp.goto("/student/lessons");
  await sp.getByRole("tab", { name: /Past/ }).click();
  await sp.getByRole("link", { name: "Write a review" }).click();
  await sp.getByRole("radio", { name: "5 stars" }).click();
  await sp.getByLabel(/What made it great\?/).fill("Clear explanations and lots of practice questions.");
  await sp.getByRole("button", { name: "Post review" }).click();
  await expect(sp.getByText("“Clear explanations and lots of practice questions.”")).toBeVisible();
  expect((await api(`/api/lessons/${lesson}`, { method: "POST", cookie: student.cookie, body: JSON.stringify({ action: "review", rating: 1 }) })).res.status).toBe(409);
  // Report a problem on it.
  await sp.getByRole("button", { name: "Report a problem" }).click();
  await sp.getByLabel("What went wrong?").fill("The sound dropped for a few minutes near the end.");
  await sp.getByRole("button", { name: "Send report" }).click();
  await expect(sp.getByText("Thanks for telling us.")).toBeVisible();

  // 6. Tutor: reviews page with a reply, notes on the lesson, My students.
  const tctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await signIn(tctx, tutor);
  const tp = await tctx.newPage();
  await tp.goto("/tutor/reviews");
  await expect(tp.getByText("5.0")).toBeVisible();
  await tp.getByRole("button", { name: "Reply" }).click();
  await tp.getByLabel("Your reply").fill("Thank you, Baraka. See you next week!");
  await tp.getByRole("button", { name: "Post reply" }).click();
  await expect(tp.getByLabel("Your reply")).toHaveCount(0); // closes once saved
  await expect(tp.getByText("Thank you, Baraka. See you next week!")).toBeVisible();
  await tp.goto(`/tutor/lessons/${lesson}`);
  await tp.getByRole("button", { name: /Add lesson notes/ }).click();
  await tp.getByLabel("Notes for your student").fill("Covered projectile motion. Practise questions 4 to 9 before Thursday.");
  await tp.getByRole("button", { name: "Save notes" }).click();
  await expect(tp.getByText("Covered projectile motion.", { exact: false })).toBeVisible();
  await tp.goto("/tutor/students");
  await expect(tp.getByText(`Baraka O.`)).toBeVisible();

  // 7. Public profile shows the rating, review and reply.
  const anon = await (await browser.newContext()).newPage();
  await anon.goto(`/tutors/${tutor.slug}`);
  await expect(anon.getByRole("heading", { name: "Reviews (1)" })).toBeVisible();
  await expect(anon.getByText("Clear explanations and lots of practice questions.")).toBeVisible();
  await expect(anon.getByText(/replied:/)).toBeVisible();

  // 8. Student progress shows the lesson, hours and the tutor's notes.
  await sp.goto("/student/progress");
  await expect(sp.locator("div", { hasText: /^1Lessons$/ }).first()).toBeVisible();
  await expect(sp.getByText(/Covered projectile motion/)).toBeVisible();

  // 9. Phone layouts.
  await shift(lesson, 5); // lobby view again for the layout check
  await sql("update payload.bookings set status = 'confirmed' where id = $1", [lesson]);
  for (const [page, paths] of [
    [sp, [`/lessons/${lesson}`, `/student/lessons/${missed}`, "/student/progress"]],
    [tp, ["/tutor/reviews", "/tutor/students", `/tutor/lessons/${lesson}`]],
  ] as const) {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const p of paths) {
      await page.goto(p);
      await page.waitForLoadState("load");
      await page.locator("main").first().waitFor();
      await page.waitForTimeout(500);
      await noOverflow(page, p);
    }
  }
});
