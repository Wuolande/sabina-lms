import { Client } from "pg";
import { expect, test } from "@playwright/test";
import { account, api, approvedTutor, signIn } from "./accounts";

/**
 * Phase 4: pay to book (test checkout), a declined payment and retry, holds that run out,
 * refunds on cancel/decline, tutor earnings and a payout marked paid by finance.
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
const hours = { timezone: "Africa/Nairobi", weekly: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, start: "08:00", end: "20:00" })), timeOff: [], noticeHours: 0, bufferMinutes: 0 };

test("pay to book, failed payment, expiry, refunds, earnings and payout", async ({ browser }, info) => {
  test.skip(info.project.name !== "desktop", "Runs once, on desktop");
  test.setTimeout(360_000);
  const tag = Math.random().toString(36).slice(2, 6);
  const tutor = await approvedTutor("Imani", `Mutua${tag}`, ADMIN);
  expect((await api("/api/tutor/schedule", { method: "PUT", cookie: tutor.cookie, body: JSON.stringify({ ...hours, instantBooking: true }) })).res.ok).toBe(true);
  const student = await account("student", "Leo", `Kariuki${tag}`);
  const slots = async (minutes = 60) => (await api(`/api/tutors/${tutor.slug}/slots?minutes=${minutes}`, { cookie: student.cookie })).data.slots as string[];

  // 1. Book in the browser and pay with the test checkout.
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await signIn(ctx, student);
  const page = await ctx.newPage();
  await page.goto(`/tutors/${tutor.slug}/book`);
  const reloaded = page.waitForResponse((r) => r.url().includes("/slots?minutes=60"));
  await page.getByRole("button", { name: /60 min/ }).click();
  await reloaded;
  await page.locator("section", { hasText: "2. Pick a day and time" }).getByRole("button").filter({ hasText: /\d:\d\d (AM|PM)/ }).first().click();
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await expect(page.getByRole("heading", { name: "Pay to confirm" })).toBeVisible();
  await expect(page.getByText(/We're holding this time for you for/)).toBeVisible();
  await page.getByRole("radio", { name: /Test payment/ }).click();
  await page.getByRole("button", { name: "Pay US$30" }).click();
  await page.waitForURL(/\/checkout\/dev/);
  // First attempt is declined: nothing is booked, the time is still held, and retry works.
  await page.getByRole("button", { name: "Simulate a declined payment" }).click();
  await expect(page.getByRole("heading", { name: "Payment didn't go through" })).toBeVisible();
  await page.getByRole("link", { name: "Try again" }).click();
  await page.getByRole("radio", { name: /Test payment/ }).click();
  await page.getByRole("button", { name: "Pay US$30" }).click();
  await page.waitForURL(/\/checkout\/dev/);
  await page.getByRole("button", { name: "Pay US$30" }).click();
  await expect(page.getByRole("heading", { name: "You're booked!" })).toBeVisible();
  await page.getByRole("link", { name: "View receipt" }).click();
  await expect(page.getByRole("heading", { name: "Receipt" })).toBeVisible();
  await expect(page.getByText("Total paid")).toBeVisible();
  await expect(page.getByText(/^US\$30(\.00)?$/).last()).toBeVisible();

  // 2. An unpaid hold blocks the time, then releases it when it runs out.
  const free = await slots();
  const held = await api("/api/bookings", { method: "POST", cookie: student.cookie, body: JSON.stringify({ tutorId: tutor.profileId, startsAt: free[3], kind: "regular", minutes: 60 }) });
  expect(held.res.status).toBe(201);
  expect((held.data.booking as { status: string }).status).toBe("pending_payment");
  const heldId = (held.data.booking as { id: number }).id;
  expect(await slots()).not.toContain(free[3]);
  await page.goto("/student/lessons");
  await expect(page.locator("article", { hasText: "Awaiting payment" }).getByRole("link", { name: "Pay now" })).toBeVisible();
  await sql("update payload.bookings set hold_until = now() - interval '1 minute' where id = $1", [heldId]);
  expect(await slots()).toContain(free[3]);
  const late = await api("/api/payments/checkout", { method: "POST", cookie: student.cookie, body: JSON.stringify({ bookingId: heldId, provider: "dev" }) });
  expect(late.res.status).toBe(409);

  // 3. Paying after the hold ran out still books the lesson while the time is free.
  const later = free.find((t) => Date.parse(t) > Date.now() + 48 * 3600_000)!;
  const again = await api("/api/bookings", { method: "POST", cookie: student.cookie, body: JSON.stringify({ tutorId: tutor.profileId, startsAt: later, kind: "regular", minutes: 60 }) });
  const againId = (again.data.booking as { id: number }).id;
  const co = await api("/api/payments/checkout", { method: "POST", cookie: student.cookie, body: JSON.stringify({ bookingId: againId, provider: "dev" }) });
  await sql("update payload.bookings set hold_until = now() - interval '1 minute' where id = $1", [againId]);
  await api(`/api/tutors/${tutor.slug}/slots`); // housekeeping expires the hold
  expect((await sql<{ status: string }>("select status from payload.bookings where id = $1", [againId]))[0]!.status).toBe("expired");
  await api("/api/payments/dev", { method: "POST", cookie: student.cookie, body: JSON.stringify({ ref: co.data.reference, outcome: "succeeded" }) });
  expect((await sql<{ status: string; payment_status: string }>("select status, payment_status from payload.bookings where id = $1", [againId]))[0]).toEqual({ status: "confirmed", payment_status: "paid" });

  // 4. Cancelling in time refunds in full.
  await page.goto("/student/lessons");
  const card = page.locator("article", { hasText: (await sql<{ reference: string }>("select reference from payload.bookings where id = $1", [againId]))[0]!.reference });
  await card.getByRole("button", { name: "Cancel lesson" }).click();
  await card.getByRole("dialog").getByRole("button", { name: "Cancel lesson" }).click();
  await page.getByRole("tab", { name: /Cancelled/ }).click();
  await expect(page.getByText(/Refunded US\$30/)).toBeVisible();
  await page.goto("/student/payments");
  await expect(page.getByText("Refunded", { exact: true })).toBeVisible();

  // A late cancellation (inside 24 hours) keeps the money with the tutor by default.
  const soon = await api("/api/bookings", { method: "POST", cookie: student.cookie, body: JSON.stringify({ tutorId: tutor.profileId, startsAt: (await slots(30))[1], kind: "regular", minutes: 30 }) });
  const soonId = (soon.data.booking as { id: number }).id;
  const co3 = await api("/api/payments/checkout", { method: "POST", cookie: student.cookie, body: JSON.stringify({ bookingId: soonId, provider: "dev" }) });
  await api("/api/payments/dev", { method: "POST", cookie: student.cookie, body: JSON.stringify({ ref: co3.data.reference, outcome: "succeeded" }) });
  await api(`/api/bookings/${soonId}`, { method: "POST", cookie: student.cookie, body: JSON.stringify({ action: "cancel" }) });
  expect((await sql<{ late_cancellation: boolean; payment_status: string }>("select late_cancellation, payment_status from payload.bookings where id = $1", [soonId]))[0]).toEqual({ late_cancellation: true, payment_status: "paid" });

  // 5. A tutor declining a paid request refunds it too.
  await api("/api/tutor/schedule", { method: "PUT", cookie: tutor.cookie, body: JSON.stringify({ ...hours, instantBooking: false }) });
  const req = await api("/api/bookings", { method: "POST", cookie: student.cookie, body: JSON.stringify({ tutorId: tutor.profileId, startsAt: (await slots(30))[10], kind: "regular", minutes: 30 }) });
  const reqId = (req.data.booking as { id: number }).id;
  const co2 = await api("/api/payments/checkout", { method: "POST", cookie: student.cookie, body: JSON.stringify({ bookingId: reqId, provider: "dev" }) });
  await api("/api/payments/dev", { method: "POST", cookie: student.cookie, body: JSON.stringify({ ref: co2.data.reference, outcome: "succeeded" }) });
  expect((await sql<{ status: string }>("select status from payload.bookings where id = $1", [reqId]))[0]!.status).toBe("requested");
  expect((await api(`/api/bookings/${reqId}`, { method: "POST", cookie: tutor.cookie, body: JSON.stringify({ action: "decline", reason: "Away that day" }) })).res.ok).toBe(true);
  expect((await sql<{ payment_status: string; refunded_amount: string }>("select payment_status, refunded_amount from payload.bookings where id = $1", [reqId]))[0]).toEqual({ payment_status: "refunded", refunded_amount: "15" });

  // 6. Earnings: move the first (paid, confirmed) lesson into the past so it clears.
  const first = (await sql<{ id: number }>("select id from payload.bookings where student_id = $1 and status = 'confirmed' and payment_status = 'paid' order by id limit 1", [student.id]))[0]!.id;
  await sql("update payload.bookings set starts_at = now() - interval '5 days', ends_at = now() - interval '5 days' + interval '1 hour', tutor_joined_at = now() - interval '5 days' where id = $1", [first]);
  const tctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await signIn(tctx, tutor);
  const tp = await tctx.newPage();
  await tp.goto("/tutor/earnings");
  // 30 paid − 18% fee = 24.60 available.
  await expect(tp.locator("section", { hasText: "Withdraw" }).getByText("US$24.60")).toBeVisible();
  await expect(tp.getByRole("button", { name: "Request payout" })).toBeDisabled();
  await tp.getByLabel("M-Pesa number").fill("12");
  await tp.getByRole("button", { name: "Save payout details" }).click();
  await expect(tp.getByText(/Enter your M-Pesa number/)).toBeVisible();
  await tp.getByLabel("M-Pesa number").fill("+254 712 345 678");
  await tp.getByRole("button", { name: "Save payout details" }).click();
  await expect(tp.getByText("M-Pesa · +254 712 345 678")).toBeVisible();
  await tp.getByRole("button", { name: "Request payout" }).click();
  await expect(tp.getByText(/Payout of US\$24\.60 requested/)).toBeVisible();
  await expect(tp.getByText("Requested", { exact: true })).toBeVisible();
  // Nothing left to withdraw twice.
  expect((await api("/api/tutor/payouts", { method: "POST", cookie: tutor.cookie })).res.status).toBe(400);

  // 7. Finance marks it paid in the admin; the tutor sees it.
  const admin = await api("/api/auth/login", { method: "POST", body: JSON.stringify(ADMIN) });
  const payout = (await sql<{ id: number }>("select id from payload.payouts where tutor_user_id = $1", [tutor.id]))[0]!.id;
  const mark = await api(`/api/cms/payouts/${payout}`, { method: "PATCH", cookie: admin.cookie, body: JSON.stringify({ status: "paid", transferRef: "QK12AB34CD" }) });
  expect(mark.res.ok).toBe(true);
  await tp.reload();
  await expect(tp.getByRole("listitem").getByText("Paid", { exact: true })).toBeVisible();
  await expect(tp.getByText(/ref QK12AB34CD/)).toBeVisible();

  // 8. Privacy and webhooks: students can't see others' payments; forged webhooks are rejected.
  const stranger = await account("student", "Eve", `Other${tag}`);
  const ref = (await sql<{ reference: string }>("select reference from payload.payments where student_id = $1 limit 1", [student.id]))[0]!.reference;
  expect((await api(`/api/payments/status/${ref}`, { cookie: stranger.cookie })).res.status).toBe(404);
  expect((await api(`/api/payments/dev`, { method: "POST", cookie: stranger.cookie, body: JSON.stringify({ ref, outcome: "succeeded" }) })).res.status).toBe(404);
  const forged = await fetch(`${process.env.BASE_URL || "http://localhost:3000"}/api/payments/webhook/paystack`, { method: "POST", headers: { "Content-Type": "application/json", "x-paystack-signature": "deadbeef" }, body: JSON.stringify({ event: "charge.success", data: { reference: ref, status: "success" } }) });
  expect(forged.status).toBe(400);
  expect((await api("/api/cms/payouts", { cookie: stranger.cookie })).data.docs).toEqual([]);

  // 9. Phone layouts.
  for (const [p, paths] of [
    [page, ["/student/payments", `/checkout/pay/${heldId}`]],
    [tp, ["/tutor/earnings"]],
  ] as const) {
    await p.setViewportSize({ width: 390, height: 844 });
    for (const path of paths) {
      await p.goto(path);
      const [scroll, inner] = await p.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
      expect(scroll, `${path} is wider than the screen`).toBeLessThanOrEqual(inner);
    }
  }
});
