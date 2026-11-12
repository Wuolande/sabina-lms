import { expect, test } from "@playwright/test";
import { account, api } from "./accounts";

/** Admin → Scheduled jobs: create a key, external scheduler calls (header or ?key=), Run now, access rules. */
const ADMIN = { email: process.env.E2E_ADMIN_EMAIL || "admin@sabina.test", password: process.env.E2E_ADMIN_PASSWORD || "Admin12345!" };
const BASE = process.env.BASE_URL || "http://localhost:3000";

test("external scheduler setup and calls", async ({ browser }, info) => {
  test.skip(info.project.name !== "desktop", "Runs once");
  test.setTimeout(120_000);
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto("/admin/login");
  await page.getByLabel(/email/i).first().fill(ADMIN.email);
  await page.getByLabel(/password/i).first().fill(ADMIN.password);
  await page.getByRole("button", { name: /log in|sign in/i }).click();
  await page.waitForURL(/\/admin$/);
  const link = page.getByRole("link", { name: "Scheduled jobs" }).first();
  if (!(await link.isVisible())) await page.getByRole("button", { name: /^Settings/ }).first().click();
  await link.click();
  await page.waitForURL(/\/admin\/jobs/);
  await expect(page.getByRole("heading", { name: "Scheduled jobs", level: 1 })).toBeVisible();

  // Create (or replace) the key from the admin.
  page.on("dialog", (d) => d.accept());
  await Promise.all([page.waitForResponse((r) => r.url().endsWith("/api/jobs") && r.request().method() === "POST"), page.getByRole("button", { name: /Create a key|Make a new key/ }).click()]);
  await expect(page.getByRole("button", { name: "Copy Key", exact: true })).toBeVisible();
  const status = await page.evaluate(async () => (await fetch("/api/jobs", { credentials: "include" })).json());
  const key = status.secret as string;
  expect(key.length).toBeGreaterThan(20);

  // Without the key: refused. With the header or ?key=: runs.
  expect((await fetch(`${BASE}/api/cron/housekeeping`)).status).toBe(401);
  expect((await fetch(`${BASE}/api/cron/housekeeping?key=wrong`)).status).toBe(401);
  const viaHeader = await fetch(`${BASE}/api/cron/housekeeping`, { headers: { Authorization: `Bearer ${key}` } });
  expect(viaHeader.status).toBe(200);
  expect((await viaHeader.json()).source).toBe("cron");
  expect((await fetch(`${BASE}/api/cron/housekeeping?key=${encodeURIComponent(key)}`)).status).toBe(200);

  // The page reports the scheduler as connected; Run now works.
  await page.reload();
  await expect(page.getByText("Your scheduler is calling the job.")).toBeVisible();
  await page.getByRole("button", { name: "Run now" }).click();
  await expect(page.getByText(/just now · Run now/)).toBeVisible();

  // Students can't see or change it.
  const s = await account("student", "Jobs", "Student");
  expect((await api("/api/jobs", { cookie: s.cookie })).res.status).toBe(403);
  expect((await api("/api/jobs", { method: "POST", cookie: s.cookie, body: JSON.stringify({ action: "new-key" }) })).res.status).toBe(403);
});
