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
  const box = (await page.getByTestId("whiteboard").boundingBox())!;
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
  const strokes = (p: Page) => p.getByTestId("whiteboard");

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
  await a.getByRole("button", { name: "Clear board" }).click();
  await expect(strokes(b)).toHaveAttribute("data-strokes", "0");

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
