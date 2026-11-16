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
    const social = (before.social ?? {}) as Record<string, string | null>;
    const keys = ["x", "facebook", "instagram", "linkedin", "youtube", "tiktok"];
    await api("/api/cms/globals/site-settings", { method: "POST", cookie: admin, body: JSON.stringify({ supportEmail: before.supportEmail ?? null, social: Object.fromEntries(keys.map((k) => [k, social[k] ?? null])) }) });
  }
});

test("page wording and brand colours are managed in the admin", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Runs once, on desktop");
  test.setTimeout(240_000);
  const tag = Math.random().toString(36).slice(2, 7);
  const admin = (await api("/api/auth/login", { method: "POST", body: JSON.stringify(ADMIN) })).cookie!;
  const saved = (await api("/api/cms/globals/site-settings", { cookie: admin })).data as { brand?: { colours?: Record<string, string> } };
  try {
    // Defaults: the brand colours drive buttons, and every shade comes from them.
    await page.goto("/how-it-works");
    const vars = await page.evaluate(() => {
      const css = getComputedStyle(document.documentElement);
      return { primary: css.getPropertyValue("--brand-primary").trim(), accent: css.getPropertyValue("--brand-accent").trim(), b700: css.getPropertyValue("--brand-700").trim(), a400: css.getPropertyValue("--accent-400").trim() };
    });
    expect(vars).toEqual({ primary: (saved.brand?.colours?.primary ?? "#0000FE"), accent: (saved.brand?.colours?.accent ?? "#009EFF"), b700: expect.any(String), a400: expect.any(String) });
    // Wording: change it in the admin and it shows on the site, with rule tags filled in.
    const edit = await api("/api/cms/globals/site-text", {
      method: "POST",
      cookie: admin,
      body: JSON.stringify({
        menu: { links: [{ label: `Tutors ${tag}`, href: "/find-tutors" }] },
        footer: { trust: [{ text: `Promise ${tag}` }] },
        howItWorks: { title: `Learning ${tag} works`, payTitle: "Cancel up to {cancelHours} hours before." },
        becomeTutor: { reasonsTitle: `Reasons ${tag}` },
        contact: { title: `Talk to us ${tag}` },
        signIn: { student: { title: `Welcome ${tag}` } },
      }),
    });
    expect(edit.res.ok, JSON.stringify(edit.data)).toBe(true);
    await page.goto("/how-it-works");
    await expect(page.getByRole("heading", { level: 1, name: `Learning ${tag} works` })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Cancel up to \d+ hours before\./ })).toBeVisible();
    await expect(page.getByRole("link", { name: `Tutors ${tag}` }).first()).toBeVisible();
    await expect(page.locator("footer").getByText(`Promise ${tag}`)).toBeVisible();
    await page.goto("/become-a-tutor");
    await expect(page.getByRole("heading", { name: `Reasons ${tag}` })).toBeVisible();
    await page.goto("/contact");
    await expect(page.getByRole("heading", { level: 1, name: `Talk to us ${tag}` })).toBeVisible();
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: `Welcome ${tag}` })).toBeVisible();

    // Colours: a new primary colour reaches the page's buttons and every shade.
    await api("/api/cms/globals/site-settings", { method: "POST", cookie: admin, body: JSON.stringify({ brand: { colours: { primary: "#112233", accent: "#00AA55" } } }) });
    await page.goto("/login");
    const after = await page.evaluate(() => {
      const css = getComputedStyle(document.documentElement);
      return { b700: css.getPropertyValue("--brand-700").trim(), a400: css.getPropertyValue("--accent-400").trim(), button: getComputedStyle(document.querySelector('button[type="submit"]')!).backgroundColor };
    });
    expect(after).toEqual({ b700: "17 34 51", a400: "0 170 85", button: "rgb(17, 34, 51)" });
  } finally {
    await api("/api/cms/globals/site-text", { method: "POST", cookie: admin, body: JSON.stringify({ menu: { links: [] }, footer: { trust: [] }, howItWorks: { title: null, payTitle: null }, becomeTutor: { reasonsTitle: null }, contact: { title: null }, signIn: { student: { title: null } } }) });
    await api("/api/cms/globals/site-settings", { method: "POST", cookie: admin, body: JSON.stringify({ brand: { colours: { primary: saved.brand?.colours?.primary ?? "#0000FE", accent: saved.brand?.colours?.accent ?? "#009EFF" } } }) });
  }
});
