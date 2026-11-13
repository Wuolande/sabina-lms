import { expect, test } from "@playwright/test";
import { Client } from "pg";
import { account, api, approvedTutor, signIn } from "./accounts";

/**
 * Lesson packages: a tutor offers 5 lessons at 10% off, a student buys them (test checkout), books
 * two lessons from the package without paying again, cancels one in time (it goes back), and
 * finance refunds the unused lessons. The tutor's earnings use the package's per-lesson price.
 */
const ADMIN = { email: process.env.E2E_ADMIN_EMAIL || "admin@sabina.test", password: process.env.E2E_ADMIN_PASSWORD || "Admin12345!" };

async function sql<T = Record<string, unknown>>(q: string, params: unknown[] = []) {
  const db = new Client({ connectionString: process.env.DATABASE_URI });
  await db.connect();
  try {
    return (await db.query(q, params)).rows as T[];
  } finally {
    await db.end();
  }
}

test("tutor offers a package → student buys → books from it → cancels one back → refund of unused", async ({ browser }, info) => {
  test.skip(info.project.name !== "desktop", "Full journey runs once, on desktop");
  test.setTimeout(300_000);
  const tag = Math.random().toString(36).slice(2, 6);
  const tutor = await approvedTutor("Achieng", `Odhiambo${tag}`, ADMIN);
  await api("/api/tutor/schedule", {
    method: "PUT",
    cookie: tutor.cookie,
    body: JSON.stringify({ timezone: "Africa/Nairobi", weekly: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, start: "06:00", end: "22:00" })), timeOff: [], noticeHours: 0, bufferMinutes: 0, instantBooking: true }),
  });

  // 1. Tutor turns on a 5-lesson package at 10% off in their profile (rate 30/h).
  const tctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await signIn(tctx, tutor);
  const tp = await tctx.newPage();
  await tp.goto("/tutor/profile");
  await tp.getByRole("button", { name: /Subjects & pricing/ }).first().click();
  const five = tp.getByRole("checkbox", { name: "5 lessons", exact: true });
  await five.check();
  await tp.getByLabel("Discount for 5 lessons (%)").fill("10");
  await expect(tp.getByText("US$27 per hour instead of US$30")).toBeVisible();
  const saved = tp.waitForResponse((r) => r.url().includes("/api/tutor/application") && r.request().method() === "PATCH");
  await tp.getByRole("button", { name: /^Save/ }).first().click();
  expect((await saved).ok()).toBe(true);
  // A discount above the admin's cap is refused.
  const tooBig = await api("/api/tutor/application", { method: "PATCH", cookie: tutor.cookie, body: JSON.stringify({ packages: [{ lessons: 10, discountPercent: 45 }] }) });
  expect(tooBig.res.status).toBe(400);

  // 2. The public profile advertises it; the booking page offers it.
  const student = await account("student", "Imani", `Kariuki${tag}`, "Africa/Nairobi");
  const sctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await signIn(sctx, student);
  const sp = await sctx.newPage();
  await sp.goto(`/tutors/${tutor.slug}`);
  await expect(sp.getByRole("complementary").getByText(/Lesson packages: save up to 10%/)).toBeVisible();
  await sp.goto(`/tutors/${tutor.slug}/book`);
  await sp.getByRole("button", { name: /^60 min/ }).click();
  const offer = sp.locator("section", { hasText: "Save with a package" });
  await expect(offer.getByText("5 lessons", { exact: true })).toBeVisible();
  await expect(offer.getByText(/save 10%/)).toBeVisible();
  await offer.getByRole("button", { name: "Buy 5 lessons" }).click();

  // 3. Pay for the package with the test checkout.
  await sp.waitForURL(/\/checkout\/package\/\d+/);
  await expect(sp.getByRole("heading", { name: /5 lessons with Achieng/ })).toBeVisible();
  await expect(sp.getByText("US$135").first()).toBeVisible(); // 5 × 30 × 0.9
  await sp.getByRole("radio", { name: /Test payment/ }).click();
  await sp.getByRole("button", { name: /^Pay / }).click();
  await sp.waitForURL(/\/checkout\/dev/);
  await sp.getByRole("button", { name: /^Pay / }).click();
  await expect(sp.getByRole("heading", { name: "Your lessons are ready to book" })).toBeVisible();
  const [pkg] = await sql<{ id: number; status: string; per_lesson: string }>("select id, status, per_lesson from payload.lesson_packages where student_id = $1", [student.id]);
  expect(pkg!.status).toBe("active");
  expect(Number(pkg!.per_lesson)).toBe(27);

  // 4. Book two lessons from the package: no checkout, confirmed straight away (instant booking).
  await sp.getByRole("link", { name: "Book your first lesson" }).click();
  await sp.getByRole("button", { name: /^60 min/ }).click();
  await expect(sp.getByText("Use a lesson from my package")).toBeVisible();
  await expect(sp.getByText("5 lessons left")).toBeVisible();
  const times = sp.locator("section", { hasText: "2. Pick a day and time" }).getByRole("button", { pressed: false }).filter({ hasText: /\d:\d\d (AM|PM)/ });
  await times.first().click();
  await expect(sp.getByText("Prepaid")).toBeVisible();
  await sp.getByRole("button", { name: "Book lesson" }).click();
  await expect(sp.getByRole("heading", { name: "Your lesson is booked" })).toBeVisible();
  await sp.getByRole("button", { name: "Book another" }).click();
  await sp.getByRole("button", { name: /^60 min/ }).click();
  await expect(sp.getByText("4 lessons left")).toBeVisible();
  // A few days ahead, so cancelling it later is inside the free-cancellation window.
  await sp.getByRole("listbox", { name: "Days" }).locator("button:not([disabled])").nth(4).click();
  await times.first().click();
  await sp.getByRole("button", { name: "Book lesson" }).click();
  await expect(sp.getByRole("heading", { name: "Your lesson is booked" })).toBeVisible();

  const booked = await sql<{ id: number; status: string; payment_status: string; price: string }>("select id, status, payment_status, price from payload.bookings where package_id = $1 order by id", [pkg!.id]);
  expect(booked.map((b) => [b.status, b.payment_status, Number(b.price)])).toEqual([
    ["confirmed", "paid", 27],
    ["confirmed", "paid", 27],
  ]);
  expect((await sql("select 1 from payload.payments where booking_id = any($1)", [booked.map((b) => b.id)])).length).toBe(0);

  // 5. Cancel one in time: the lesson goes back into the package, no money moves.
  const cancel = await api(`/api/bookings/${booked[1]!.id}`, { method: "POST", cookie: student.cookie, body: JSON.stringify({ action: "cancel", reason: "Exam moved" }) });
  expect(cancel.res.ok).toBe(true);
  await sp.goto("/student/packages");
  await expect(sp.getByText("4 lessons left")).toBeVisible();
  await expect(sp.getByText("1 of 5 booked")).toBeVisible();

  // 6. The tutor's earnings use the package's per-lesson price: 27 less the 18% fee = 22.14.
  await tp.goto("/tutor/earnings");
  await expect(tp.getByText("US$22.14").first()).toBeVisible();

  // 7. Finance refunds the 4 unused lessons from the admin: 4 × 27 = 108.
  const admin = await api("/api/cms/users/login", { method: "POST", body: JSON.stringify(ADMIN) });
  const refund = await api(`/api/cms/lesson-packages/${pkg!.id}/refund-unused`, { method: "POST", cookie: admin.cookie, body: JSON.stringify({ reason: "Student moving abroad" }) });
  expect(refund.res.ok).toBe(true);
  expect(refund.data.amount).toBe(108);
  const [after] = await sql<{ status: string; refunded_amount: string }>("select status, refunded_amount from payload.lesson_packages where id = $1", [pkg!.id]);
  expect(after).toEqual({ status: "refunded", refunded_amount: "108" });
  // The booked lesson stays booked; no more lessons can be taken from the package.
  expect((await sql<{ status: string }>("select status from payload.bookings where id = $1", [booked[0]!.id]))[0]!.status).toBe("confirmed");
  const slots = await api(`/api/tutors/${tutor.slug}/slots?minutes=60`, { cookie: student.cookie });
  expect((slots.data.packages as unknown[]).length).toBe(0);

  // 8. Receipt and admin list.
  await sp.goto("/student/payments");
  await expect(sp.getByText(/5 × 60-minute lessons with Achieng/)).toBeVisible();
  await tctx.close();
  await sctx.close();
});
