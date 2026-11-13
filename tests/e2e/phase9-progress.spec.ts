import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { Client } from "pg";
import { account, api, approvedTutor, signIn } from "./accounts";

/**
 * Progress between lessons: a tutor sets homework and a quiz; the student hands in homework with
 * a photo and takes the quiz (marked automatically); the tutor gives feedback and can open the
 * photo; goals are shared both ways; a parent opens the private link, which can be turned off.
 * Strangers can't set homework or see someone else's.
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

test("homework, quiz, feedback, goals and the parent link", async ({ browser }, info) => {
  test.skip(info.project.name !== "desktop", "Runs once, on desktop");
  test.setTimeout(300_000);
  const tag = Math.random().toString(36).slice(2, 6);
  const tutor = await approvedTutor("Mwangi", `Teach${tag}`, ADMIN);
  const student = await account("student", "Amani", `Learn${tag}`, "Africa/Nairobi");
  const stranger = await approvedTutor("Kamau", `Other${tag}`, ADMIN);
  // A lesson they've had together.
  await sql(
    `insert into payload.bookings (reference, status, payment_status, starts_at, ends_at, student_id, tutor_id, tutor_user_id, kind, minutes, price, currency, updated_at, created_at)
     values ($1, 'completed', 'paid', now() - interval '2 days', now() - interval '2 days' + interval '60 minutes', $2, $3, $4, 'regular', 60, 30, 'USD', now(), now())`,
    [`SB-T${tag}`, student.id, tutor.profileId, tutor.id],
  );

  // Strangers can't set homework for someone they don't teach.
  const nope = await api("/api/homework", { method: "POST", cookie: stranger.cookie, body: JSON.stringify({ studentId: student.id, kind: "homework", title: "x", instructions: "y" }) });
  expect(nope.res.status).toBe(403);

  // 1. Tutor sets homework and a quiz from the student's page.
  const tctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await signIn(tctx, tutor);
  const tp = await tctx.newPage();
  await tp.goto("/tutor/students");
  await tp.getByRole("link", { name: "Homework, quizzes & goals" }).click();
  await expect(tp.getByRole("heading", { name: /Amani L\./ })).toBeVisible();
  await tp.getByRole("button", { name: "Set homework" }).click();
  await tp.getByLabel("Title").fill("Balancing equations");
  await tp.getByRole("textbox", { name: "Instructions" }).fill("Balance the five equations on page 42 and show your working.");
  await tp.getByRole("button", { name: /^Send to Amani/ }).click();
  await expect(tp.getByText("Homework sent to Amani L.")).toBeVisible();

  await tp.getByRole("button", { name: "Create a quiz" }).click();
  await tp.getByLabel("Title").fill("Moles check");
  await tp.getByRole("textbox", { name: "Question 1", exact: true }).fill("What is the unit of amount of substance?");
  await tp.getByRole("textbox", { name: "Question 1 choice 1" }).fill("mole");
  await tp.getByRole("textbox", { name: "Question 1 choice 2" }).fill("gram");
  await tp.getByRole("radio", { name: "Choice 1 is right" }).check();
  await tp.getByRole("button", { name: "Add a question" }).click();
  await tp.getByRole("radio", { name: "Short answer" }).nth(1).click();
  await tp.getByRole("textbox", { name: "Question 2", exact: true }).fill("Avogadro's number, to 3 significant figures (×10²³)?");
  await tp.getByLabel("Accepted answers").fill("6.02 | 6.02 x 10^23");
  await tp.getByLabel("Explanation (optional)").nth(1).fill("It's 6.022 × 10²³ per mole.");
  await tp.getByRole("button", { name: /^Send to Amani/ }).click();
  await expect(tp.getByText("Quiz sent to Amani L.")).toBeVisible();
  await expect(tp.getByRole("link", { name: /Balancing equations/ })).toBeVisible();
  await expect(tp.getByRole("link", { name: /Moles check/ })).toBeVisible();

  // The tutor adds a goal for the student.
  await tp.getByRole("button", { name: "Add a goal" }).click();
  await tp.getByRole("textbox", { name: "Goal" }).fill("B+ in KCSE Chemistry");
  await tp.getByRole("textbox", { name: "Step 1" }).fill("Finish stoichiometry");
  await tp.getByRole("button", { name: "Add a step" }).click();
  await tp.getByRole("textbox", { name: "Step 2" }).fill("Two past papers a week");
  await tp.getByRole("button", { name: "Save goal" }).click();
  await expect(tp.getByText("B+ in KCSE Chemistry")).toBeVisible();
  await expect(tp.getByText("0% done")).toBeVisible();

  // 2. Student: quiz answers are hidden until finished; then marked straight away.
  const sctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await signIn(sctx, student);
  const sp = await sctx.newPage();
  const [quiz] = await sql<{ id: number }>("select id from payload.assignments where student_id = $1 and kind = 'quiz'", [student.id]);
  const peek = await api(`/api/homework/${quiz!.id}`, { cookie: student.cookie });
  expect((peek.data.questions as { correct: unknown; accepted: unknown[] }[]).every((q) => q.correct === null && q.accepted.length === 0)).toBe(true);
  const other = await api(`/api/homework/${quiz!.id}`, { cookie: stranger.cookie });
  expect(other.res.status).toBe(404);

  await sp.goto("/student/homework");
  await expect(sp.getByRole("link", { name: /Moles check/ })).toContainText("To do");
  await sp.getByRole("link", { name: /Moles check/ }).click();
  await sp.getByRole("radio", { name: "mole" }).check();
  await sp.getByLabel("Answer to question 2").fill("6.02 ");
  await sp.getByRole("button", { name: "Finish quiz" }).click();
  await expect(sp.getByText("2/2", { exact: true }).first()).toBeVisible();
  await expect(sp.getByText("It's 6.022 × 10²³ per mole.")).toBeVisible();

  // Homework with a photo.
  await sp.goto("/student/homework");
  await sp.getByRole("link", { name: /Balancing equations/ }).click();
  await expect(sp.getByText("Balance the five equations on page 42")).toBeVisible();
  await sp.getByRole("textbox", { name: "Your answer" }).fill("Done, my working is in the photo.");
  const photo = await sharp({ create: { width: 400, height: 300, channels: 3, background: "#f8fafc" } }).jpeg().toBuffer();
  await sp.getByLabel("Add files").setInputFiles({ name: "working.jpg", mimeType: "image/jpeg", buffer: photo });
  await expect(sp.getByText("working.jpg")).toBeVisible();
  await sp.getByRole("button", { name: "Hand in" }).click();
  await expect(sp.getByRole("heading", { name: "What you handed in" })).toBeVisible();

  // The student ticks a step on the tutor's goal.
  await sp.goto("/student/progress");
  await sp.getByRole("checkbox", { name: "Finish stoichiometry" }).check();
  await expect(sp.getByText("50% done")).toBeVisible();

  // 3. Tutor sees the work, opens the photo, leaves feedback.
  await tp.goto("/tutor/homework/" + (await sql<{ id: number }>("select id from payload.assignments where student_id = $1 and kind = 'homework'", [student.id]))[0]!.id);
  await expect(tp.getByText("Done, my working is in the photo.")).toBeVisible();
  const file = tp.getByRole("link", { name: "working.jpg" });
  const href = await file.getAttribute("href");
  // Browsers send Sec-Fetch-Site; Payload only accepts the session cookie with it (CSRF guard).
  const opened = await tctx.request.get(href!, { headers: { "Sec-Fetch-Site": "same-origin" } });
  expect(opened.status()).toBe(200);
  expect(opened.headers()["content-type"]).toContain("image/jpeg");
  // …but another tutor can't.
  expect((await api(new URL(href!, "http://x").pathname, { cookie: stranger.cookie })).res.status).not.toBe(200);
  await tp.getByRole("textbox", { name: "Feedback" }).fill("Great work. Watch the oxygen count in question 4.");
  await tp.getByRole("button", { name: "Send feedback" }).click();
  await expect(tp.getByRole("button", { name: "Update feedback" })).toBeVisible();
  await expect(tp.getByText("Watch the oxygen count in question 4.")).toBeVisible();
  await sp.goto("/student/homework");
  await expect(sp.getByRole("link", { name: /Balancing equations/ })).toContainText("Marked");

  // 4. Parent link: read-only, no sign-in, and it can be turned off.
  await sp.goto("/student/progress");
  await sp.getByRole("button", { name: "Create a parent link" }).click();
  const link = await sp.getByRole("textbox", { name: "Parent link" }).inputValue();
  expect(link).toMatch(/\/progress\/[A-Za-z0-9_-]{24,}$/);
  const pctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const pp = await pctx.newPage();
  await pp.goto(link);
  await expect(pp.getByRole("heading", { name: "How Amani is getting on" })).toBeVisible();
  await expect(pp.getByText("Scored 2/2")).toBeVisible();
  await expect(pp.getByText("B+ in KCSE Chemistry")).toBeVisible();
  await expect(pp.getByText("Lessons taken")).toBeVisible();
  expect(await pp.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(await pp.content()).not.toContain(student.email);
  sp.once("dialog", (d) => d.accept());
  await sp.getByRole("button", { name: "Turn off" }).click();
  await expect(sp.getByRole("button", { name: "Create a parent link" })).toBeVisible();
  const gone = await pp.goto(link);
  expect(gone?.status()).toBe(404);

  await tctx.close();
  await sctx.close();
  await pctx.close();
});
