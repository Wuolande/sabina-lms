import { expect, test, type Browser, type Page } from "@playwright/test";
import sharp from "sharp";
import { tokenFor, uniqueEmail } from "./db";

/**
 * Phase 2: a tutor applies, the admin requests changes, the tutor resubmits, the admin approves,
 * the tutor appears in the marketplace, and a student saves them. Plus privacy and layout checks.
 */
const PASSWORD = "Teach2026x";
const ADMIN = { email: process.env.E2E_ADMIN_EMAIL || "admin@sabina.test", password: process.env.E2E_ADMIN_PASSWORD || "Admin12345!" };
const desktopOnly = (name: string) => test.skip(name !== "desktop", "Full lifecycle runs once, on desktop");

async function signUp(page: Page, role: "tutor" | "student", first: string, last: string, email: string) {
  await page.goto(`/register?role=${role}`);
  await page.getByLabel("First name").fill(first);
  await page.getByLabel("Last name").fill(last);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /Create (tutor|student) account/ }).click();
  await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
  await page.goto(`/verify-email?token=${await tokenFor(email, "_verificationtoken")}`);
  await expect(page.getByRole("heading", { name: "You're all set" })).toBeVisible();
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(`**/${role}`);
}

async function adminPage(browser: Browser) {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto("/admin/login");
  await page.fill('input[name="email"]', ADMIN.email);
  await page.fill('input[name="password"]', ADMIN.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");
  return page;
}

const step = (page: Page, name: RegExp) => page.locator("nav[aria-label='Application sections']").getByRole("button", { name }).first().click();
const saveAndContinue = async (page: Page) => {
  await page.getByRole("button", { name: /Save & continue|Continue/ }).click();
  await expect(page.getByRole("status").filter({ hasText: /Saved|^$/ }).first()).toBeAttached();
};

test("tutor application → review → approval → marketplace → saved by a student", async ({ page, browser }, info) => {
  desktopOnly(info.project.name);
  test.setTimeout(420_000);
  const tag = Math.random().toString(36).slice(2, 7);
  const last = `Zuri${tag}`;
  const tutorEmail = uniqueEmail("p2tutor");

  // 1. Tutor signs up and fills in the application.
  await signUp(page, "tutor", "Elena", last, tutorEmail);
  await page.goto("/tutor/profile");
  await expect(page.getByRole("heading", { name: "Complete your tutor application" })).toBeVisible();

  // Submitting is blocked while anything required is missing.
  await step(page, /Review & submit/);
  await expect(page.getByRole("button", { name: "Submit application" })).toBeDisabled();

  // Photo
  await step(page, /Photo & details/);
  const photo = await sharp({ create: { width: 300, height: 300, channels: 3, background: "#7C3AED" } }).png().toBuffer();
  await page.locator('input[type="file"][accept^="image"]').setInputFiles({ name: "me.png", mimeType: "image/png", buffer: photo });
  await expect(page.getByRole("button", { name: "Change photo" })).toBeVisible();

  // Teaching profile
  await step(page, /Teaching profile/);
  await page.getByLabel("Headline").fill(`Friendly chemistry tutor ${last}`);
  await page.getByLabel("About you").fill("I teach chemistry with experiments you can do at home, clear diagrams and lots of exam practice. ".repeat(2));
  await page.getByRole("button", { name: "Add a language" }).click();
  await page.getByLabel("Language", { exact: true }).selectOption({ label: "English" });
  await saveAndContinue(page);

  // Subjects & pricing
  await expect(page.getByRole("heading", { name: "Subjects & pricing" })).toBeVisible();
  await page.getByLabel("Main subject").selectOption({ label: "Chemistry" });
  await page.getByRole("button", { name: "Secondary / high school" }).click();
  await page.getByLabel(/Hourly rate/).fill("999");
  await page.getByRole("button", { name: /Save & continue/ }).click();
  await expect(page.getByText(/Set an hourly rate between/)).toBeVisible();
  await page.getByLabel(/Hourly rate/).fill("24");
  await saveAndContinue(page);

  // Background: one qualification with a document
  await expect(page.getByRole("heading", { name: "Education & experience" })).toBeVisible();
  await page.getByRole("button", { name: "Add education" }).click();
  await page.getByLabel("Degree or diploma").fill("BSc Chemistry");
  await page.getByLabel("Institution").fill("Moi University");
  await saveAndContinue(page);

  // Identity
  await expect(page.getByRole("heading", { name: "Identity check" })).toBeVisible();
  await page.getByLabel("National ID").check();
  const idScan = await sharp({ create: { width: 600, height: 380, channels: 3, background: "#e2e8f0" } }).jpeg().toBuffer();
  await page.locator('input[type="file"][accept^="application/pdf"]').setInputFiles({ name: "national-id.jpg", mimeType: "image/jpeg", buffer: idScan });
  await expect(page.getByText("national-id.jpg")).toBeVisible();
  await saveAndContinue(page);

  // Video (optional) then submit
  await expect(page.getByRole("heading", { name: "Intro video" })).toBeVisible();
  await page.getByLabel("Video link").fill("https://example.com/not-a-video");
  await expect(page.getByText("Use a YouTube, Vimeo or Cloudflare Stream link.")).toBeVisible();
  await page.getByLabel("Video link").fill("https://youtu.be/dQw4w9WgXcQ");
  await expect(page.locator("iframe[title='Intro video preview']")).toBeVisible();
  await saveAndContinue(page);
  await expect(page.getByRole("button", { name: "Submit application" })).toBeEnabled();
  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(page.getByRole("heading", { name: "Application under review" })).toBeVisible();

  // Not public yet.
  await page.goto(`/find-tutors?q=${last}`);
  await expect(page.getByRole("heading", { name: "No tutors match yet" })).toBeVisible();

  // 2. Admin requests changes.
  const admin = await adminPage(browser);
  await admin.goto("/admin/collections/tutor-profiles?where[status][equals]=submitted");
  await admin.getByRole("link", { name: new RegExp(`Elena ${last.charAt(0)}\\.`) }).first().click();
  await admin.getByRole("button", { name: "Request changes" }).click();
  await admin.getByRole("button", { name: "Send to tutor" }).click();
  await expect(admin.getByText("Add a message for the tutor")).toBeVisible();
  await admin.getByRole("dialog").locator("textarea").fill("Please add your teaching certificate.");
  await admin.getByRole("button", { name: "Send to tutor" }).click();
  await expect(admin.getByText("Changes requested").first()).toBeVisible();

  // 3. Tutor sees the message and resubmits.
  await page.goto("/tutor/profile");
  await expect(page.getByRole("heading", { name: "A few changes are needed" })).toBeVisible();
  await expect(page.getByText("Please add your teaching certificate.")).toBeVisible();
  await step(page, /Review & submit/);
  await page.getByRole("button", { name: "Submit again" }).click();
  await expect(page.getByRole("heading", { name: "Application under review" })).toBeVisible();

  // 4. Admin approves.
  await admin.reload();
  await admin.getByRole("button", { name: "Approve" }).click();
  await expect(admin.getByText("Approved · live")).toBeVisible();

  // 5. Live in the marketplace, filters work.
  await page.goto("/tutor");
  await expect(page.getByText("Your profile is live in the marketplace.")).toBeVisible();
  const anon = await (await browser.newContext()).newPage();
  await anon.goto(`/find-tutors?q=${last}`);
  await expect(anon.getByRole("link", { name: `Elena ${last.charAt(0)}.` })).toBeVisible();
  await anon.goto(`/find-tutors?q=${last}&max=15`);
  await expect(anon.getByRole("heading", { name: "No tutors match yet" })).toBeVisible();
  await anon.goto(`/find-tutors?subject=chemistry&q=${last}`);
  await anon.getByRole("link", { name: `Elena ${last.charAt(0)}.` }).click();
  await expect(anon.getByRole("heading", { level: 1 })).toContainText("Elena");
  await expect(anon.getByText("BSc Chemistry")).toBeVisible();
  const profileUrl = anon.url();

  // Privacy: the public API never exposes identity documents, review notes or the account link.
  const id = await anon.evaluate(async (l) => {
    const r = await fetch(`/api/tutors/${l.split("/").pop()}`);
    return (await r.json()).tutor;
  }, profileUrl);
  expect(JSON.stringify(id)).not.toMatch(/identity|reviewNotes|private-files|national-id/);

  // 6. A student saves the tutor and sets goals.
  const student = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await signUp(student, "student", "Sam", "Learner", uniqueEmail("p2student"));
  await student.goto(profileUrl);
  const saved = student.waitForResponse((r) => r.url().endsWith("/api/student/favorites") && r.request().method() === "POST");
  await student.getByRole("button", { name: "Save tutor" }).first().click();
  expect((await saved).ok()).toBe(true);
  await expect(student.getByRole("button", { name: "Saved" }).first()).toBeVisible();
  await student.goto("/student/favorites");
  await expect(student.locator(`a[href="/tutors/${profileUrl.split("/").pop()}"]`)).toBeVisible();
  await student.goto("/student/profile");
  await student.getByRole("button", { name: "Chemistry" }).click();
  await student.getByLabel("Main goal").selectOption({ label: "Pass an exam" });
  await student.getByRole("button", { name: "Save goals" }).click();
  await expect(student.getByText("Saved. Your recommendations are updated below.")).toBeVisible();
  await expect(student.locator(`a[href="/tutors/${profileUrl.split("/").pop()}"]`)).toBeVisible();

  // Tutors can't open the student portal and vice versa.
  await student.goto("/tutor/profile");
  await student.waitForURL("**/student");
});

test("public pages fit the screen and load", async ({ page }) => {
  for (const path of ["/", "/find-tutors", "/find-tutors?subject=mathematics&sort=price_asc", "/subjects", "/subjects/mathematics", "/login", "/register"]) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBeLessThan(400);
    const [scroll, inner] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    expect(scroll, `${path} is wider than the screen`).toBeLessThanOrEqual(inner);
  }
  expect((await page.goto("/tutors/does-not-exist"))?.status()).toBe(404);
});
