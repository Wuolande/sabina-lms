import { expect, test, type Page } from "@playwright/test";
import { account, api, approvedTutor, signIn } from "./accounts";

/**
 * Phase 7: editable homepage (with platform rules filled in), standard pages, blog (published,
 * draft, scheduled), RSS, sitemap, robots and SEO settings, and the tutor academy (lessons,
 * quiz, certificate).
 */
const ADMIN = { email: process.env.E2E_ADMIN_EMAIL || "admin@sabina.test", password: process.env.E2E_ADMIN_PASSWORD || "Admin12345!" };
const para = (text: string) => ({ root: { type: "root", format: "", indent: 0, version: 1, direction: "ltr", children: [{ type: "paragraph", format: "", indent: 0, version: 1, direction: "ltr", textFormat: 0, children: [{ type: "text", text, format: 0, style: "", mode: "normal", detail: 0, version: 1 }] }] } });
const noOverflow = async (page: Page, path: string) => {
  const [scroll, inner] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(scroll, `${path} is wider than the screen`).toBeLessThanOrEqual(inner);
};

test("homepage, pages, blog, SEO and academy", async ({ browser }, info) => {
  test.skip(info.project.name !== "desktop", "Runs once, on desktop");
  test.setTimeout(300_000);
  const tag = Math.random().toString(36).slice(2, 6);
  const login = await api("/api/auth/login", { method: "POST", body: JSON.stringify(ADMIN) });
  const admin = login.res.headers.get("set-cookie")!.split(";")[0]!;
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // 1. Homepage: default copy with the platform's real rules, no claims about unbuilt features.
  await api("/api/cms/globals/home-page", { method: "POST", cookie: admin, body: JSON.stringify({ hero: { pretitle: "" }, stats: { live: false } }) });
  await page.goto("/");
  await expect(page.getByText("LIVE 1-ON-1 TUTORING")).toBeVisible();
  await expect(page.getByText(/free cancellation up to 24 hours before/i).first()).toBeVisible();
  const html = await page.content();
  expect(html).not.toMatch(/Sabina Edge|whiteboard|\{cancelHours\}|\{tutorShare\}/i);
  // An edit in the admin shows up.
  await api("/api/cms/globals/home-page", { method: "POST", cookie: admin, body: JSON.stringify({ hero: { pretitle: `TUTORS FOR EVERY EXAM ${tag}` } }) });
  await page.goto("/");
  await expect(page.getByText(`TUTORS FOR EVERY EXAM ${tag}`)).toBeVisible();
  await api("/api/cms/globals/home-page", { method: "POST", cookie: admin, body: JSON.stringify({ hero: { pretitle: "" } }) });

  // 2. Standard pages exist with real rules; editing one changes it; extra pages; drafts are hidden.
  for (const [path, title] of [["/about", "About Sabina"], ["/pricing", "Pricing"], ["/terms", "Terms of service"], ["/privacy", "Privacy policy"], ["/cookies", "Cookie policy"], ["/refund-policy", "Refund policy"]]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  }
  await page.goto("/pricing");
  await expect(page.getByText("Cancel at least 24 hours before the start for a full refund.")).toBeVisible();
  const extra = await api("/api/cms/pages", { method: "POST", cookie: admin, body: JSON.stringify({ title: `Safeguarding ${tag}`, intro: "How we keep students safe.", body: para("Every tutor is checked."), status: "published" }) });
  expect(extra.res.status).toBe(201);
  const extraSlug = (extra.data.doc as { slug: string }).slug;
  await page.goto(`/pages/${extraSlug}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(`Safeguarding ${tag}`);
  await expect(page.getByText("Every tutor is checked.")).toBeVisible();
  await api(`/api/cms/pages/${(extra.data.doc as { id: number }).id}`, { method: "PATCH", cookie: admin, body: JSON.stringify({ status: "draft" }) });
  expect((await page.goto(`/pages/${extraSlug}`))?.status()).toBe(404);

  // 3. Blog: a published post (featured, with category), a draft and a scheduled one.
  const cat = await api("/api/cms/blog-categories", { method: "POST", cookie: admin, body: JSON.stringify({ name: `Exam tips ${tag}` }) });
  const catDoc = cat.data.doc as { id: number; slug: string };
  const mk = (title: string, extraData: object) => api("/api/cms/posts", { method: "POST", cookie: admin, body: JSON.stringify({ title, excerpt: `Summary of ${title}.`, body: para(`Body of ${title}.`), category: catDoc.id, ...extraData }) });
  const live = await mk(`How to revise for KCSE chemistry ${tag}`, { status: "published", featured: true });
  expect(live.res.status).toBe(201);
  const liveSlug = (live.data.doc as { slug: string }).slug;
  await mk(`Draft post ${tag}`, { status: "draft" });
  await mk(`Scheduled post ${tag}`, { status: "published", publishedAt: new Date(Date.now() + 7 * 86400_000).toISOString() });

  await page.goto("/blog");
  await expect(page.getByRole("heading", { name: `How to revise for KCSE chemistry ${tag}` })).toBeVisible();
  await expect(page.getByText(`Draft post ${tag}`)).toHaveCount(0);
  await expect(page.getByText(`Scheduled post ${tag}`)).toHaveCount(0);
  await page.getByRole("link", { name: `Exam tips ${tag}`, exact: true }).click();
  await page.waitForURL(`**/blog?category=${catDoc.slug}`);
  await page.getByRole("heading", { name: `How to revise for KCSE chemistry ${tag}` }).click();
  await page.waitForURL(`**/blog/${liveSlug}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(`How to revise for KCSE chemistry ${tag}`);
  await expect(page.getByText(`Body of How to revise for KCSE chemistry ${tag}.`)).toBeVisible();
  await expect(page).toHaveTitle(new RegExp(`How to revise for KCSE chemistry ${tag}`));
  expect((await page.goto(`/blog/draft-post-${tag}`))?.status()).toBe(404);
  // Anonymous API readers can't see drafts either.
  expect(((await api(`/api/cms/posts?where[title][equals]=Draft post ${tag}`)).data.docs as unknown[]).length).toBe(0);
  // Homepage shows the latest post; RSS and sitemap list it.
  await page.goto("/");
  await expect(page.getByRole("heading", { name: `How to revise for KCSE chemistry ${tag}` })).toBeVisible();
  const rss = await (await page.request.get("/rss.xml")).text();
  expect(rss).toContain(`/blog/${liveSlug}`);
  expect(rss).not.toContain(`Scheduled post ${tag}`);
  expect(await (await page.request.get("/sitemap.xml")).text()).toContain(`/blog/${liveSlug}`);

  // 4. SEO settings: homepage title, and robots follows "allow indexing".
  await api("/api/cms/globals/site-settings", { method: "POST", cookie: admin, body: JSON.stringify({ seo: { title: `Sabina tutors ${tag}`, allowIndexing: false } }) });
  await page.goto("/");
  await expect(page).toHaveTitle(`Sabina tutors ${tag}`);
  expect(await (await page.request.get("/robots.txt")).text()).toMatch(/Disallow: \/\s*$/m);
  await api("/api/cms/globals/site-settings", { method: "POST", cookie: admin, body: JSON.stringify({ seo: { title: "", allowIndexing: true } }) });
  expect(await (await page.request.get("/robots.txt")).text()).toContain("Sitemap:");

  // 5. Academy: a tutor works through the starter course, fails then passes the quiz, gets a certificate.
  const tutor = await approvedTutor("Achieng", `Odhiambo${tag}`, ADMIN);
  const tctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await signIn(tctx, tutor);
  const tp = await tctx.newPage();
  await tp.goto("/tutor/training");
  await expect(tp.getByRole("heading", { name: "Teaching on Sabina" })).toBeVisible();
  await tp.getByRole("link", { name: "Start course" }).click();
  await expect(tp.getByRole("heading", { name: "How bookings work" })).toBeVisible();
  for (const next of ["Your classroom", "Cancellations and refunds", "Getting paid", "Reviews and messages"]) {
    await tp.getByRole("button", { name: "Done, next lesson" }).click();
    await expect(tp.getByRole("heading", { name: next })).toBeVisible();
    if (next === "Getting paid") await expect(tp.getByText(/You keep 82% of each lesson's price/)).toBeVisible();
  }
  await tp.getByRole("button", { name: "Done, take the quiz" }).click();
  await expect(tp.getByRole("heading", { name: "Quiz" })).toBeVisible();
  const questions = tp.locator("fieldset");
  const n = await questions.count();
  for (let i = 0; i < n; i++) await questions.nth(i).locator("label").first().click();
  await tp.getByRole("button", { name: "Check answers" }).click();
  await expect(tp.getByText(/Not quite there/)).toBeVisible();
  await tp.getByRole("button", { name: "Try again" }).click();
  for (let i = 0; i < n; i++) await questions.nth(i).locator("label").nth(1).click();
  await tp.getByRole("button", { name: "Check answers" }).click();
  await expect(tp.getByText("You passed with 100%")).toBeVisible();
  await tp.getByRole("link", { name: "View certificate" }).first().click();
  await expect(tp.getByRole("heading", { level: 1 })).toHaveText(`Achieng Odhiambo${tag}`);
  await expect(tp.getByText(/SAB-[0-9A-F]{6}-[0-9A-F]{4}/)).toBeVisible();
  await tp.goto("/tutor/training");
  await expect(tp.getByText("Completed", { exact: true })).toBeVisible();
  await expect(tp.getByText(/Certificate SAB-/)).toBeVisible();
  // Students can't use the academy.
  const student = await account("student", "Neema", `S${tag}`);
  expect((await api("/api/academy/teaching-on-sabina", { method: "POST", cookie: student.cookie, body: JSON.stringify({ action: "complete", lesson: "x" }) })).res.status).toBe(403);

  // 6. Phone layouts.
  await page.setViewportSize({ width: 390, height: 844 });
  for (const p of ["/", "/blog", `/blog/${liveSlug}`, "/terms", "/pricing"]) {
    await page.goto(p);
    await page.waitForLoadState("networkidle");
    await noOverflow(page, p);
  }
  await tp.setViewportSize({ width: 390, height: 844 });
  for (const p of ["/tutor/training", "/tutor/training/teaching-on-sabina", "/tutor/training/teaching-on-sabina/certificate"]) {
    await tp.goto(p);
    await tp.waitForLoadState("networkidle");
    await noOverflow(tp, p);
  }
});
