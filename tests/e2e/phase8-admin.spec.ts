import { expect, test } from "@playwright/test";
import { account, api } from "./accounts";

/** Phase 8: dashboard "Needs attention", Reports with CSV exports, staff-only access, legacy admin gone. */
const ADMIN = { email: process.env.E2E_ADMIN_EMAIL || "admin@sabina.test", password: process.env.E2E_ADMIN_PASSWORD || "Admin12345!" };

test("dashboard, reports, exports, and no legacy admin", async ({ browser }, info) => {
  test.skip(info.project.name !== "desktop", "Runs once, on desktop");
  test.setTimeout(180_000);
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto("/admin/login");
  await page.getByLabel(/email/i).first().fill(ADMIN.email);
  await page.getByLabel(/password/i).first().fill(ADMIN.password);
  await page.getByRole("button", { name: /log in|sign in/i }).click();
  await page.waitForURL(/\/admin$/);

  // Dashboard: the migration roadmap is gone; "Needs attention" is there.
  await expect(page.getByRole("heading", { name: "Needs attention" })).toBeVisible();
  await expect(page.getByText("Migration roadmap")).toHaveCount(0);
  await expect(page.getByText(/legacy admin/i)).toHaveCount(0);

  // Reports.
  await page.getByRole("link", { name: "Reports", exact: true }).first().click();
  await page.waitForURL(/\/admin\/reports/);
  await expect(page.getByRole("heading", { name: "Reports", level: 1 })).toBeVisible();
  for (const label of ["Lesson sales", "Refunded", "Sabina's fee", "Tutor earnings", "Lessons completed", "Cancellation rate"]) await expect(page.locator(".ep-kpi__label", { hasText: label })).toBeVisible();
  await page.getByRole("link", { name: "12 months" }).click();
  await page.waitForURL(/range=365/);
  await expect(page.getByRole("heading", { name: "By month" })).toBeVisible();

  // CSV exports download for admins, with a header row.
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "Lessons (CSV)" }).click()]);
  expect(dl.suggestedFilename()).toMatch(/^sabina-bookings-\d{4}-\d{2}-\d{2}\.csv$/);
  const login = await api("/api/auth/login", { method: "POST", body: JSON.stringify(ADMIN) });
  const adminCookie = login.res.headers.get("set-cookie")!.split(";")[0]!;
  const res = await fetch(`${process.env.E2E_BASE_URL || "http://localhost:3000"}/api/reports/export?type=payments&range=365`, { headers: { cookie: adminCookie, "Sec-Fetch-Site": "same-origin" } });
  expect(res.headers.get("content-type")).toContain("text/csv");
  const csv = (await res.text()).replace(/^\uFEFF/, "");
  expect(csv.split("\r\n")[0]).toContain('"Reference","Status","Provider","Amount"');

  // Students can't export or open admin reports.
  const student = await account("student", "Rehema", "Report");
  expect((await api("/api/reports/export?type=payments", { cookie: student.cookie })).res.status).toBe(403);
  expect((await api("/api/reports/export?type=payments")).res.status).toBe(401);

  // The old admin and its API are gone.
  expect((await page.goto("/admin-legacy"))?.status()).toBe(404);
  expect((await api("/api/admin/stats", { cookie: student.cookie })).res.status).toBe(404);
});
