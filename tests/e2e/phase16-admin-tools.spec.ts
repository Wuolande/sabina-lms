import { expect, test } from "@playwright/test";
import { account, api, signIn, type Account } from "./accounts";

/**
 * Admin tools: the sidebar highlights filtered lists (Tutor applications) separately from the plain
 * list (Tutors), and an admin can log in as a student or tutor and come back.
 */
const ADMIN = { email: process.env.E2E_ADMIN_EMAIL || "admin@sabina.test", password: process.env.E2E_ADMIN_PASSWORD || "Admin12345!" };

test("sidebar highlight and logging in as a user", async ({ browser }, info) => {
  test.skip(info.project.name !== "desktop", "Runs once, on desktop");
  test.setTimeout(240_000);
  const tag = Math.random().toString(36).slice(2, 6);
  const login = await api("/api/auth/login", { method: "POST", body: JSON.stringify(ADMIN) });
  const admin = { id: Number((login.data.user as { id: number }).id), email: ADMIN.email, cookie: login.cookie!, token: login.cookie!.split("=")[1]! } as Account;
  const student = await account("student", "Neema", `Viewed${tag}`);
  const tutor = await account("tutor", "Otieno", `Other${tag}`);

  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  await signIn(ctx, admin);
  const page = await ctx.newPage();

  // Tutor applications and Tutors each light up on their own page.
  const nav = page.locator(".ep-nav__link[aria-current=page]");
  await page.goto("/admin/collections/tutor-profiles?where[or][0][and][0][status][equals]=submitted");
  await expect(nav).toHaveCount(1);
  await expect(nav).toContainText("Tutor applications");
  await page.goto("/admin/collections/tutor-profiles");
  await expect(nav).toHaveCount(1);
  await expect(nav).toContainText("Tutors");

  // Rules: only students and tutors, never yourself or staff; nobody but admins can do it.
  expect((await api("/api/admin/impersonate", { method: "POST", cookie: admin.cookie, body: JSON.stringify({ userId: admin.id }) })).res.status).toBe(400);
  expect((await api("/api/admin/impersonate", { method: "POST", cookie: tutor.cookie, body: JSON.stringify({ userId: student.id }) })).res.status).toBe(403);

  // From the student's admin page, log in as them.
  await page.goto(`/admin/collections/users/${student.id}`);
  await page.getByRole("button", { name: "Log in as this student" }).click();
  await page.waitForURL(/\/student$/);
  const banner = page.getByRole("status").filter({ hasText: "You're logged in as" });
  await expect(banner).toContainText(`Neema Viewed${tag}`);
  const me = await page.evaluate(() => fetch("/api/auth/session").then((r) => r.json()));
  expect(me.user.id).toBe(student.id);
  // Their password can't be changed from here.
  const pw = await page.evaluate(() => fetch("/api/account/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: "x", newPassword: "Another2026x" }) }).then((r) => r.status));
  expect(pw).toBe(403);
  // The admin panel isn't open to them.
  await page.goto("/admin");
  await expect(page).not.toHaveURL(/\/admin\/?$/);

  // Back to admin: the admin's own session again, on the student's page.
  await page.goto("/student");
  await banner.getByRole("button", { name: "Back to admin" }).click();
  await page.waitForURL(new RegExp(`/admin/collections/users/${student.id}`));
  const again = await page.evaluate(() => fetch("/api/auth/session").then((r) => r.json()));
  expect(again.user.id).toBe(admin.id);
  await expect(page.getByText("You're logged in as")).toHaveCount(0);
  // The borrowed session is gone.
  expect((await ctx.cookies()).find((c) => c.name === "sb_admin_token")).toBeUndefined();
  await ctx.close();
});
