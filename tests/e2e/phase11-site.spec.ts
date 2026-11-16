import { expect, test } from "@playwright/test";
import { Client } from "pg";
import { api } from "./accounts";

/**
 * Site-wide checks: the footer and marketing pages show real settings (no invented numbers or
 * people), the contact form really saves a message, and every link in the menus leads somewhere.
 */
const ADMIN = { email: process.env.E2E_ADMIN_EMAIL || "admin@sabina.test", password: process.env.E2E_ADMIN_PASSWORD || "Admin12345!" };

test("footer, marketing pages and contact form use real data", async ({ page }) => {
  test.setTimeout(240_000);
  const tag = Math.random().toString(36).slice(2, 7);
  const admin = (await api("/api/auth/login", { method: "POST", body: JSON.stringify(ADMIN) })).cookie!;
  const before = (await api("/api/cms/globals/site-settings", { cookie: admin })).data as Record<string, unknown>;
  const policies = (await api("/api/cms/globals/platform-settings", { cookie: admin })).data as Record<string, number>;

  try {
    // Social links and support email come from the admin's site settings.
    await api("/api/cms/globals/site-settings", { method: "POST", cookie: admin, body: JSON.stringify({ supportEmail: `help-${tag}@example.com`, social: { instagram: `https://instagram.com/sabina-${tag}`, x: "", facebook: "", linkedin: "", youtube: "", tiktok: "" } }) });
    await page.goto("/contact");
    const footer = page.locator("footer").last();
    await expect(footer.getByRole("link", { name: "Instagram" })).toHaveAttribute("href", `https://instagram.com/sabina-${tag}`);
    await expect(footer.getByRole("link", { name: "LinkedIn" })).toHaveCount(0);
    await expect(footer.getByRole("link", { name: `help-${tag}@example.com` })).toBeVisible();
    await expect(page.getByRole("link", { name: `help-${tag}@example.com` }).first()).toBeVisible();
    // No link in the footer is a dead "#".
    expect(await footer.locator('a[href="#"], a:not([href])').count()).toBe(0);
    // Footer subjects are real subject pages.
    for (const href of await footer.locator('a[href^="/subjects/"]').evaluateAll((as) => as.map((a) => a.getAttribute("href")!))) {
      expect((await page.request.get(href)).status(), href).toBe(200);
    }

    // The contact form saves the message for staff.
    await page.getByLabel("Your name").fill("Test Sender");
    await page.getByLabel("Email").fill(`sender-${tag}@example.com`);
    await page.getByLabel("Subject").fill(`Question ${tag}`);
    await page.getByLabel("Message").fill("Can I book lessons for two children on one account?");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByRole("heading", { name: "Message sent" })).toBeVisible();
    const db = new Client({ connectionString: process.env.DATABASE_URI });
    await db.connect();
    const saved = await db.query("select name, status from payload.contact_messages where subject = $1", [`Question ${tag}`]);
    expect(saved.rows).toEqual([{ name: "Test Sender", status: "new" }]);
    await db.query("delete from payload.contact_messages where subject = $1", [`Question ${tag}`]);
    await db.end();
    const bad = await api("/api/contact", { method: "POST", body: JSON.stringify({ name: "A", email: "nope", subject: "x", message: "hello there" }) });
    expect(bad.res.status).toBe(400);

    // Marketing pages use the platform's real fee and rules, not invented numbers.
    await page.goto("/become-a-tutor");
    await expect(page.getByText(`Keep ${100 - policies.platformFeePercent}% of every lesson`)).toBeVisible();
    await expect(page.getByText(`after the ${policies.platformFeePercent}% platform fee`)).toBeVisible();
    await expect(page.getByText(/250\+|Stripe Connect|bi-weekly/i)).toHaveCount(0);
    await page.goto("/how-it-works");
    await expect(page.getByRole("heading", { name: `Pay per lesson. Cancel up to ${policies.cancellationRefundHours} hours before for a full refund.` })).toBeVisible();
    await expect(page.getByText(/Satisfaction Guarantee|25-minute|50-minute/i)).toHaveCount(0);
    await page.goto("/");
    await expect(page.getByText(/15,000|4\.98|98\.9%|Dr\. Elena|REC 24/)).toHaveCount(0);

    // Signed-out visitors don't trigger errors when the header checks who's signed in.
    const session = await page.request.get("/api/auth/session");
    expect(session.status()).toBe(200);
    expect((await session.json()).authenticated).toBe(false);
  } finally {
    await api("/api/cms/globals/site-settings", { method: "POST", cookie: admin, body: JSON.stringify({ supportEmail: before.supportEmail ?? null, social: before.social ?? {} }) });
  }
});
