import { expect, test, type Page } from "@playwright/test";
import { account, api, approvedTutor, signIn, choose } from "./accounts";

/**
 * Phase 3: a tutor sets weekly hours, a student books a trial (request), the tutor accepts, the
 * student cancels; double-booking is refused even when two students race for the same time.
 */
const ADMIN = { email: process.env.E2E_ADMIN_EMAIL || "admin@sabina.test", password: process.env.E2E_ADMIN_PASSWORD || "Admin12345!" };

const fitsScreen = async (page: Page, path: string) => {
  const [scroll, inner] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(scroll, `${path} is wider than the screen`).toBeLessThanOrEqual(inner);
};

test("tutor hours → student books → tutor accepts → student cancels; no double booking", async ({ browser }, info) => {
  test.skip(info.project.name !== "desktop", "Full journey runs once, on desktop");
  test.setTimeout(300_000);
  const tag = Math.random().toString(36).slice(2, 6);
  const tutor = await approvedTutor("Baraka", `Ochieng${tag}`, ADMIN);

  // 1. Tutor sets hours: every day 09:00–17:00 Nairobi, no notice, requests (not instant).
  const tctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await signIn(tctx, tutor);
  const tp = await tctx.newPage();
  await tp.goto("/tutor");
  await expect(tp.getByText("Set your availability")).toBeVisible();
  await tp.goto("/tutor/availability");
  await expect(tp.getByText("You're not open for bookings yet.")).toBeVisible();
  await tp.getByRole("button", { name: "Weekdays 9–5" }).click();
  for (const d of ["Saturday", "Sunday"]) await tp.locator("li", { hasText: d }).getByRole("checkbox").check();
  await expect(tp.getByText("56 hours a week open for booking.")).toBeVisible();
  await choose(tp, "Minimum notice", "None");
  await tp.getByText("Instant booking", { exact: true }).click();
  await tp.getByRole("button", { name: "Add time off" }).click();
  await tp.getByRole("button", { name: "Save changes" }).click();
  await expect(tp.getByText("Saved. Students now see your new hours.")).toBeVisible();
  await tp.reload();
  await expect(tp.getByText("56 hours a week open for booking.")).toBeVisible();

  // Time off today means the first open day is tomorrow or later.
  const slots = await api(`/api/tutors/${tutor.slug}/slots?minutes=60`);
  const open = slots.data.slots as string[];
  expect(open.length).toBeGreaterThan(20);
  expect(slots.data.instant).toBe(false);
  const todayNairobi = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" }).format(new Date());
  expect(open.some((s) => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" }).format(new Date(s)) === todayNairobi)).toBe(false);

  // 2. Student (in London) books a trial from the profile.
  const student = await account("student", "Neema", `Wafula${tag}`, "Europe/London");
  const sctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await signIn(sctx, student);
  const sp = await sctx.newPage();
  await sp.goto(`/tutors/${tutor.slug}`);
  await sp.getByRole("link", { name: "Book a trial lesson" }).click();
  await expect(sp.getByRole("heading", { name: /Book a lesson with Baraka/ })).toBeVisible();
  await expect(sp.getByRole("button", { name: /Trial/ })).toHaveAttribute("aria-pressed", "true");
  await expect(sp.getByRole("combobox", { name: "Time zone" })).toContainText("London");
  const firstTime = sp.locator("section", { hasText: "2. Pick a day and time" }).getByRole("button", { pressed: false }).filter({ hasText: /\d:\d\d (AM|PM)/ }).first();
  await firstTime.click();
  await sp.getByLabel(/Note for Baraka/).fill("Help with circular motion, please.");
  const booked = sp.waitForResponse((r) => r.url().endsWith("/api/bookings") && r.request().method() === "POST");
  await sp.getByRole("button", { name: "Continue to payment" }).click();
  expect((await booked).status()).toBe(201);
  const trialStart = ((await (await booked).json()) as { booking: { startsAt: string } }).booking.startsAt;
  // Phase 4: pay (test checkout) to send the request.
  await sp.getByRole("radio", { name: /Test payment/ }).click();
  await sp.getByRole("button", { name: /^Pay / }).click();
  await sp.waitForURL(/\/checkout\/dev/);
  await sp.getByRole("button", { name: /^Pay / }).click();
  await expect(sp.getByRole("heading", { name: "Paid. Request sent" })).toBeVisible();

  // A second trial with the same tutor isn't offered any more.
  const again = await api(`/api/tutors/${tutor.slug}/slots`, { cookie: student.cookie });
  expect((again.data.options as { kind: string }[]).some((o) => o.kind === "trial")).toBe(false);
  // The held time is gone for everyone.
  const after = await api(`/api/tutors/${tutor.slug}/slots?minutes=60`);
  expect((after.data.slots as string[]).includes(trialStart)).toBe(false);

  await sp.goto("/student/lessons");
  const card = sp.locator("article", { hasText: "Trial lesson" });
  await expect(card.getByText("Awaiting tutor")).toBeVisible();

  // 3. Double booking: the same time is refused, and two students racing for one slot get one booking.
  const other = await account("student", "Tom", `Race${tag}`);
  const clash = await api("/api/bookings", { method: "POST", cookie: other.cookie, body: JSON.stringify({ tutorId: tutor.profileId, startsAt: trialStart, kind: "regular", minutes: 30 }) });
  expect(clash.res.status).toBe(409);
  const third = await account("student", "Ann", `Race${tag}`);
  const target = (after.data.slots as string[]).at(-5)!;
  const race = await Promise.all(
    [other, third].map((s) => api("/api/bookings", { method: "POST", cookie: s.cookie, body: JSON.stringify({ tutorId: tutor.profileId, startsAt: target, kind: "regular", minutes: 60 }) })),
  );
  expect(race.map((r) => r.res.status).sort()).toEqual([201, 409]);
  // Outside the tutor's hours is refused too.
  const night = new Date(Date.parse(trialStart));
  night.setUTCHours(1, 0, 0, 0);
  night.setUTCDate(night.getUTCDate() + 1);
  expect((await api("/api/bookings", { method: "POST", cookie: third.cookie, body: JSON.stringify({ tutorId: tutor.profileId, startsAt: night.toISOString(), kind: "regular", minutes: 60 }) })).res.status).toBe(409);
  // Tutors can't book, strangers can't act on someone else's booking.
  expect((await api("/api/bookings", { method: "POST", cookie: tutor.cookie, body: JSON.stringify({ tutorId: tutor.profileId, startsAt: target, kind: "regular", minutes: 60 }) })).res.status).toBe(403);

  // 4. Tutor accepts the request.
  await tp.goto("/tutor/lessons");
  await expect(tp.getByRole("tab", { name: /Requests/ })).toHaveAttribute("aria-selected", "true");
  const req = tp.locator("article", { hasText: `Neema W.` });
  await expect(req.getByText("Help with circular motion, please.")).toBeVisible();
  await req.getByRole("button", { name: "Accept" }).click();
  await tp.getByRole("tab", { name: /Upcoming/ }).click();
  await expect(tp.locator("article", { hasText: "Neema W." }).getByText("Confirmed")).toBeVisible();
  await tp.goto("/tutor/calendar");
  await expect(tp.getByText("Open hours", { exact: true })).toBeVisible();

  // 5. Student sees it confirmed, in the calendar and on the home page, then cancels.
  await sp.goto("/student");
  await expect(sp.getByRole("heading", { name: "Next lessons" })).toBeVisible();
  await sp.goto("/student/calendar");
  await expect(sp.getByText("Times in Europe/London")).toBeVisible();
  await sp.goto("/student/lessons");
  await expect(card.getByText("Confirmed")).toBeVisible();
  await card.getByRole("button", { name: "Cancel lesson" }).click();
  await card.getByLabel("Reason (optional)").fill("Exam moved");
  await card.getByRole("dialog").getByRole("button", { name: "Cancel lesson" }).click();
  await sp.getByRole("tab", { name: /Cancelled/ }).click();
  await expect(sp.locator("article", { hasText: "Trial lesson" }).getByText("Cancelled", { exact: true })).toBeVisible();
  // The time opens up again and a trial is offered again.
  const reopened = await api(`/api/tutors/${tutor.slug}/slots`, { cookie: student.cookie });
  expect((reopened.data.options as { kind: string }[]).some((o) => o.kind === "trial")).toBe(true);
  expect((reopened.data.slots as string[]).includes(trialStart)).toBe(true);

  // 6. Admin sees bookings.
  const actx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const ap = await actx.newPage();
  await ap.goto("/admin/login");
  await ap.fill('input[name="email"]', ADMIN.email);
  await ap.fill('input[name="password"]', ADMIN.password);
  await ap.click('button[type="submit"]');
  await ap.waitForURL("**/admin");
  await ap.goto("/admin/collections/bookings");
  await expect(ap.getByText(/SB-[A-Z0-9]{6}/).first()).toBeVisible();

  // 7. Phone layouts.
  for (const [page, paths] of [
    [sp, ["/student/lessons", "/student/calendar", `/tutors/${tutor.slug}/book`]],
    [tp, ["/tutor/lessons", "/tutor/calendar", "/tutor/availability"]],
  ] as const) {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const p of paths) {
      await page.goto(p);
      await page.waitForLoadState("networkidle");
      await fitsScreen(page, p);
    }
  }
});

test("booking needs a student account", async ({ page }) => {
  await page.goto("/tutors/does-not-matter/book");
  await page.waitForURL(/\/login\?redirect=/);
  const r = await api("/api/bookings", { method: "POST", body: JSON.stringify({ tutorId: 1, startsAt: new Date().toISOString(), kind: "regular", minutes: 60 }) });
  expect(r.res.status).toBe(401);
});
