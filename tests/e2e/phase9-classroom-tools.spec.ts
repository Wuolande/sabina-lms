import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";
import { account, api, approvedTutor, signIn } from "./accounts";

/**
 * Classroom tools. The whiteboard is tested in two tabs over the development harness (same
 * component and sync messages as the classroom, carried by BroadcastChannel instead of LiveKit).
 * Lesson files are shared from the lesson page and only the two people in the lesson can open
 * them. Recording stays off until the admin turns it on and LiveKit is set up.
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

async function drawLine(page: Page, from: [number, number], to: [number, number]) {
  const box = (await page.getByTestId("whiteboard").first().boundingBox())!;
  await page.mouse.move(box.x + box.width * from[0], box.y + box.height * from[1]);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(box.x + box.width * (from[0] + ((to[0] - from[0]) * i) / 8), box.y + box.height * (from[1] + ((to[1] - from[1]) * i) / 8));
  await page.mouse.up();
}

test("whiteboard syncs between two people, late joiners get the board", async ({ browser }, info) => {
  test.skip(info.project.name !== "desktop", "Runs once, on desktop");
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const room = `r${Math.random().toString(36).slice(2, 7)}`;
  const a = await ctx.newPage();
  const b = await ctx.newPage();
  await a.goto(`/dev/whiteboard?room=${room}&me=tutor`);
  await b.goto(`/dev/whiteboard?room=${room}&me=student`);
  const strokes = (p: Page) => p.getByTestId("whiteboard").first();

  await drawLine(a, [0.1, 0.2], [0.5, 0.6]);
  await expect(strokes(a)).toHaveAttribute("data-strokes", "1");
  await expect(strokes(b)).toHaveAttribute("data-strokes", "1");

  await b.getByRole("button", { name: "Rectangle" }).click();
  await b.getByRole("button", { name: "Colour #dc2626" }).click();
  await drawLine(b, [0.6, 0.2], [0.9, 0.5]);
  await expect(strokes(a)).toHaveAttribute("data-strokes", "2");

  // Someone joining late gets everything drawn so far.
  const c = await ctx.newPage();
  await c.goto(`/dev/whiteboard?room=${room}&me=late`);
  await expect(strokes(c)).toHaveAttribute("data-strokes", "2");

  // Undo removes only your own last line, for everyone.
  await a.getByRole("button", { name: "Undo my last line" }).click();
  await expect(strokes(b)).toHaveAttribute("data-strokes", "1");
  await expect(strokes(c)).toHaveAttribute("data-strokes", "1");

  // The eraser removes what it touches.
  await a.getByRole("button", { name: "Eraser" }).click();
  await drawLine(a, [0.6, 0.3], [0.9, 0.3]);
  await expect(strokes(b)).toHaveAttribute("data-strokes", "0");

  // Clear, after confirming.
  await drawLine(b, [0.2, 0.7], [0.4, 0.8]);
  await expect(strokes(a)).toHaveAttribute("data-strokes", "1");
  a.once("dialog", (d) => d.accept());
  await a.getByRole("button", { name: "Clear page" }).click();
  await expect(strokes(b)).toHaveAttribute("data-strokes", "0");

  // Text: click, type, Enter.
  await a.getByRole("button", { name: "Text", exact: true }).click();
  const box = (await strokes(a).boundingBox())!;
  await a.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.3);
  await a.getByRole("textbox", { name: "Text to add" }).fill("F = ma");
  await a.keyboard.press("Enter");
  await expect(strokes(b)).toHaveAttribute("data-strokes", "1");

  // Pages follow the tutor; each page keeps its own drawings.
  await a.getByRole("button", { name: "Add a page" }).click();
  await expect(strokes(b)).toHaveAttribute("data-page", "2");
  await expect(strokes(b)).toHaveAttribute("data-pages", "2");
  await expect(strokes(b)).toHaveAttribute("data-strokes", "0");
  await a.getByRole("button", { name: "Pen", exact: true }).click();
  await drawLine(a, [0.2, 0.2], [0.6, 0.4]);
  await expect(strokes(b)).toHaveAttribute("data-strokes", "1");
  await a.getByRole("button", { name: "Previous page" }).click();
  await expect(strokes(b)).toHaveAttribute("data-page", "1");
  await expect(strokes(b)).toHaveAttribute("data-strokes", "1");
  await expect(b.getByRole("button", { name: "Add a page" })).toHaveCount(0); // students don't add pages

  // The tutor locks the board: the student can't draw until it's unlocked.
  await a.getByRole("button", { name: "Lock the board" }).click();
  await expect(b.getByText("Your tutor is using the board")).toBeVisible();
  await expect(b.getByRole("button", { name: "Pen", exact: true })).toBeDisabled();
  await drawLine(b, [0.5, 0.5], [0.8, 0.8]);
  await expect(strokes(a)).toHaveAttribute("data-strokes", "1");
  await a.getByRole("button", { name: "Let the student draw" }).click();
  await expect(b.getByRole("button", { name: "Pen", exact: true })).toBeEnabled();
  await b.getByRole("button", { name: "Pen", exact: true }).click();
  await drawLine(b, [0.5, 0.5], [0.8, 0.8]);
  await expect(strokes(a)).toHaveAttribute("data-strokes", "2");

  // A picture goes onto the board.
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNkYPhfz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC", "base64");
  await a.locator('input[type="file"][aria-label="Add a picture"]').setInputFiles({ name: "diagram.png", mimeType: "image/png", buffer: png });
  await expect(strokes(a)).toHaveAttribute("data-strokes", "3");

  // Someone joining now gets the pages, the lock state and the current page.
  const d = await ctx.newPage();
  await d.goto(`/dev/whiteboard?room=${room}&me=late`);
  await expect(strokes(d)).toHaveAttribute("data-pages", "2");
  await expect(strokes(d)).toHaveAttribute("data-strokes", "3");

  // Class tools: timer and stars from the tutor, raised hand and reactions from the student.
  await a.getByRole("button", { name: "Start a 2 minute timer" }).click();
  await expect(b.getByTestId("class-timer")).toContainText(/^\s*(2:00|1:5\d)/);
  await expect(b.getByRole("button", { name: /Start a \d+ minute timer/ })).toHaveCount(0);
  await a.getByRole("button", { name: /Give Amani a star/ }).click();
  await a.getByRole("button", { name: /Give Amani a star/ }).click();
  await expect(b.getByTestId("class-stars")).toHaveText(/2/);
  await expect(b.getByRole("status").filter({ hasText: "You earned a star!" })).toBeVisible();
  await b.getByRole("button", { name: "Raise hand" }).click();
  await expect(a.getByTestId("class-hand")).toContainText("Amani L. has a question");
  await a.getByRole("button", { name: "Lower hand" }).click();
  await expect(b.getByTestId("class-hand")).toHaveCount(0);
  await b.getByRole("button", { name: "React 👏" }).click();
  await expect(a.locator(".sb-float", { hasText: "👏" })).toBeVisible();
  await a.getByRole("button", { name: "Stop timer" }).click();
  await expect(b.getByTestId("class-timer")).toHaveCount(0);
  // A late joiner sees the stars so far.
  const e = await ctx.newPage();
  await e.goto(`/dev/whiteboard?room=${room}&me=student`);
  await expect(e.getByTestId("class-stars")).toHaveText(/2/);

  // Squared paper is shared too, and the board saves as an image.
  await a.getByRole("button", { name: "Squared paper" }).click();
  await expect(b.getByRole("button", { name: "Squared paper" })).toHaveAttribute("aria-pressed", "true");
  const dl = a.waitForEvent("download");
  await a.getByRole("button", { name: "Save as image" }).click();
  expect((await dl).suggestedFilename()).toMatch(/^whiteboard-.*\.png$/);
  await ctx.close();
});

test("lesson files: shared on the lesson page, private to the two people", async ({ browser }, info) => {
  test.skip(info.project.name !== "desktop", "Runs once, on desktop");
  test.setTimeout(240_000);
  const tag = Math.random().toString(36).slice(2, 6);
  const tutor = await approvedTutor("Njeri", `Files${tag}`, ADMIN);
  const student = await account("student", "Juma", `Files${tag}`, "Africa/Nairobi");
  const outsider = await account("student", "Peter", `Out${tag}`, "Africa/Nairobi");
  const [lesson] = await sql<{ id: number }>(
    `insert into payload.bookings (reference, status, payment_status, starts_at, ends_at, student_id, tutor_id, tutor_user_id, kind, minutes, price, currency, updated_at, created_at)
     values ($1, 'confirmed', 'paid', now() + interval '3 days', now() + interval '3 days' + interval '60 minutes', $2, $3, $4, 'regular', 60, 30, 'USD', now(), now()) returning id`,
    [`SB-F${tag}`, student.id, tutor.profileId, tutor.id],
  );

  // Tutor shares a worksheet before the lesson.
  const tctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await signIn(tctx, tutor);
  const tp = await tctx.newPage();
  await tp.goto(`/tutor/lessons/${lesson!.id}`);
  await expect(tp.getByRole("heading", { name: "Lesson files" })).toBeVisible();
  const maker = await tctx.newPage();
  await maker.setContent("<h1>Worksheet: projectile motion</h1>");
  const pdf = await maker.pdf();
  await maker.close();
  await tp.getByLabel("Share files").setInputFiles({ name: "worksheet.pdf", mimeType: "application/pdf", buffer: pdf });
  await expect(tp.getByText("worksheet.pdf")).toBeVisible();
  await expect(tp.getByText("shared by you")).toBeVisible();
  // A damaged file gets a clear message; other file types aren't allowed at all.
  await tp.getByLabel("Share files").setInputFiles({ name: "broken.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 not really") });
  await expect(tp.locator("p[role=alert]")).toContainText("We couldn't read broken.pdf.");
  await tp.getByLabel("Share files").setInputFiles({ name: "run.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") });
  await expect(tp.locator("p[role=alert]")).toContainText("Share a PDF, photo, Word, PowerPoint, Excel or text file.");

  // The student sees and opens it; an outsider can't.
  const sctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await signIn(sctx, student);
  const sp = await sctx.newPage();
  await sp.goto(`/student/lessons/${lesson!.id}`);
  const link = sp.getByRole("link", { name: /worksheet\.pdf/ });
  await expect(link).toBeVisible();
  await expect(sp.getByRole("button", { name: /Remove worksheet/ })).toHaveCount(0);
  const href = (await link.getAttribute("href"))!;
  const ok = await sctx.request.get(href, { headers: { "Sec-Fetch-Site": "same-origin" } });
  expect(ok.status()).toBe(200);
  const path = new URL(href, "http://x").pathname;
  expect((await api(path, { cookie: outsider.cookie })).res.status).not.toBe(200);
  expect((await api(`/api/lessons/${lesson!.id}/files`, { cookie: outsider.cookie })).res.status).toBe(404);

  // Only the person who shared it can remove it.
  const [file] = await sql<{ id: number }>("select private_files_id as id from payload.bookings_rels where parent_id = $1 and path = 'materials'", [lesson!.id]);
  expect((await api(`/api/lessons/${lesson!.id}/files?file=${file!.id}`, { method: "DELETE", cookie: student.cookie })).res.status).toBe(403);
  tp.once("dialog", (d) => d.accept());
  await tp.getByRole("button", { name: "Remove worksheet.pdf" }).click();
  await expect(tp.getByText("No files yet.")).toBeVisible();

  // Recording: off by default, so asking is refused politely.
  const rec = await api(`/api/lessons/${lesson!.id}/recording`, { method: "POST", cookie: student.cookie, body: JSON.stringify({ action: "consent" }) });
  expect(rec.res.status).toBe(409);
  expect(String(rec.data.error)).toContain("isn't available");
  await tctx.close();
  await sctx.close();
});

test("PDF pages on the board, mini blackboard, and the board on a phone", async ({ browser }, info) => {
  test.skip(info.project.name !== "desktop", "Runs once, on desktop");
  test.setTimeout(180_000);
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const room = `p${Math.random().toString(36).slice(2, 7)}`;
  const a = await ctx.newPage();
  const b = await ctx.newPage();
  await a.goto(`/dev/whiteboard?room=${room}&me=tutor`);
  await b.goto(`/dev/whiteboard?room=${room}&me=student`);
  const main = (p: Page) => p.getByTestId("whiteboard").first();

  // A 3-page PDF becomes 3 board pages for both people; the tutor lands on its first page.
  const maker = await ctx.newPage();
  await maker.setContent(`<h1>Page one</h1><div style="page-break-after:always"></div><h1>Page two</h1><div style="page-break-after:always"></div><h1>Page three</h1>`);
  const pdf = await maker.pdf({ format: "A4" });
  await maker.close();
  await a.locator('input[type="file"][aria-label="Add a PDF"]').setInputFiles({ name: "Past paper.pdf", mimeType: "application/pdf", buffer: pdf });
  await expect(main(a)).toHaveAttribute("data-pages", "3", { timeout: 30_000 });
  await expect(main(a)).toHaveAttribute("data-page", "1");
  await expect(main(a)).toHaveAttribute("data-strokes", "1");
  await expect(main(b)).toHaveAttribute("data-pages", "3");
  await expect(main(b)).toHaveAttribute("data-page", "1");
  await expect(b.getByRole("button", { name: "Add a PDF" })).toHaveCount(0); // tutors add slides
  // Draw on page 2 of the PDF; the student follows and sees it.
  await a.getByRole("button", { name: "Next page" }).click();
  await drawLine(a, [0.2, 0.3], [0.7, 0.3]);
  await expect(main(b)).toHaveAttribute("data-page", "2");
  await expect(main(b)).toHaveAttribute("data-strokes", "2");
  // A broken PDF gets a clear message.
  await a.locator('input[type="file"][aria-label="Add a PDF"]').setInputFiles({ name: "broken.pdf", mimeType: "application/pdf", buffer: Buffer.from("not a pdf") });
  await expect(a.getByText("We couldn't open that PDF.")).toBeVisible();

  // Mini blackboard: handed out with a question, the student answers, the tutor copies it over.
  await expect(b.getByTestId("mini-board")).toHaveAttribute("data-open", "false");
  await a.getByLabel("Question for the mini blackboard").fill("Solve 3x + 2 = 11");
  await a.getByRole("button", { name: "Hand out" }).click();
  const miniB = b.getByTestId("mini-board");
  await expect(miniB).toHaveAttribute("data-open", "true");
  await expect(miniB).toContainText("Solve 3x + 2 = 11");
  const miniCanvas = (p: Page) => p.getByTestId("mini-board").getByTestId("whiteboard");
  const box = (await miniCanvas(b).boundingBox())!;
  await b.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.4);
  await b.mouse.down();
  await b.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.6, { steps: 6 });
  await b.mouse.up();
  await expect(miniCanvas(a)).toHaveAttribute("data-strokes", "1"); // the tutor watches live
  await b.getByRole("button", { name: "Hand in" }).click();
  await expect(a.getByTestId("mini-board")).toContainText("Handed in");
  const before = Number(await main(a).getAttribute("data-strokes"));
  await a.getByRole("button", { name: "Copy to the board" }).click();
  await expect(main(a)).toHaveAttribute("data-strokes", String(before + 1));
  await expect(main(b)).toHaveAttribute("data-strokes", String(before + 1));
  await a.getByRole("button", { name: "Close mini blackboard" }).click();
  await expect(miniB).toHaveAttribute("data-open", "false");
  // A new mini board starts clean.
  await a.getByRole("button", { name: "Hand out" }).click();
  await expect(miniCanvas(b)).toHaveAttribute("data-strokes", "0");
  await ctx.close();

  // Phone, upright and sideways: the board fits, nothing spills sideways, and touch draws.
  for (const vp of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    const phone = await browser.newContext({ viewport: vp, hasTouch: true, isMobile: true });
    const p = await phone.newPage();
    await p.goto(`/dev/whiteboard?room=${room}m${vp.width}&me=tutor`);
    const c = p.getByTestId("whiteboard").first();
    await expect(c).toBeVisible();
    expect(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `no sideways scroll at ${vp.width}`).toBe(true);
    const r = (await c.boundingBox())!;
    expect(r.width, `board width at ${vp.width}`).toBeGreaterThan(vp.width > vp.height ? 300 : 340);
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.x + r.width).toBeLessThanOrEqual(vp.width + 1);
    // A finger stroke (touch pointer events) draws a line.
    await c.dispatchEvent("pointerdown", { pointerType: "touch", pointerId: 7, isPrimary: true, buttons: 1, clientX: r.x + r.width * 0.2, clientY: r.y + r.height * 0.3, bubbles: true });
    for (let i = 1; i <= 6; i++) await c.dispatchEvent("pointermove", { pointerType: "touch", pointerId: 7, isPrimary: true, buttons: 1, clientX: r.x + r.width * (0.2 + 0.1 * i), clientY: r.y + r.height * 0.5, bubbles: true });
    await c.dispatchEvent("pointerup", { pointerType: "touch", pointerId: 7, isPrimary: true, clientX: r.x + r.width * 0.8, clientY: r.y + r.height * 0.5, bubbles: true });
    await expect(c).toHaveAttribute("data-strokes", "1");
    // Every tool can be reached (the toolbar scrolls).
    await p.getByRole("button", { name: "Eraser" }).scrollIntoViewIfNeeded();
    await p.getByRole("button", { name: "Eraser" }).tap();
    await expect(p.getByRole("button", { name: "Eraser" })).toHaveAttribute("aria-pressed", "true");
    await phone.close();
  }
});
