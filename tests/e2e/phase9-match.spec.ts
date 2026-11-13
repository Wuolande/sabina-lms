import { expect, test } from "@playwright/test";
import { Client } from "pg";
import { account, api, approvedTutor, choose, signIn } from "./accounts";

/**
 * Smart matching: three tutors teach the same subject. The one who fits the student's level,
 * budget and free time comes first; one too expensive and one with no open hours rank below.
 * Signed-in students get their answers saved to their learning goals.
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

test("quiz → best three tutors with reasons → answers saved to learning goals", async ({ browser }, info) => {
  test.skip(info.project.name !== "desktop", "Runs once, on desktop");
  test.setTimeout(240_000);
  const tag = Math.random().toString(36).slice(2, 6);
  // A subject only these tutors teach, so the ranking is predictable.
  const [subj] = await sql<{ id: number }>(
    "insert into payload.subjects (name, slug, category, is_active, sort_order, updated_at, created_at) values ($1, $2, 'sciences', true, 999, now(), now()) returning id",
    [`Astronomy ${tag}`, `astronomy-${tag}`],
  );
  const evenings = { timezone: "Africa/Nairobi", weekly: [1, 2, 3, 4, 5].map((day) => ({ day, start: "16:00", end: "21:00" })), timeOff: [], noticeHours: 0, bufferMinutes: 0, instantBooking: true };
  const mornings = { ...evenings, weekly: [1, 2, 3, 4, 5].map((day) => ({ day, start: "07:00", end: "11:00" })) };

  const fit = await approvedTutor("Zawadi", `Fit${tag}`, ADMIN);
  const pricey = await approvedTutor("Otieno", `Pricey${tag}`, ADMIN);
  const closed = await approvedTutor("Wanjiku", `Closed${tag}`, ADMIN);
  for (const [t, rate, levels, hours] of [
    [fit, 20, ["secondary", "exam"], evenings],
    [pricey, 90, ["secondary", "exam"], evenings],
    [closed, 20, ["secondary", "exam"], null],
  ] as const) {
    await sql("update payload.tutor_profiles set hourly_rate = $1 where id = $2", [rate, t.profileId]);
    await sql("delete from payload.tutor_profiles_levels_taught where parent_id = $1", [t.profileId]);
    for (const l of levels) await sql("insert into payload.tutor_profiles_levels_taught (parent_id, value, \"order\") values ($1, $2, 1)", [t.profileId, l]).catch(() => undefined);
    await sql("insert into payload.tutor_profiles_rels (parent_id, path, subjects_id, \"order\") values ($1, 'subjects', $2, 9)", [t.profileId, subj!.id]);
    if (hours) await api("/api/tutor/schedule", { method: "PUT", cookie: t.cookie, body: JSON.stringify(hours) });
  }
  // The pricey tutor is free in the mornings only too, so evenings + budget both count against them.
  await api("/api/tutor/schedule", { method: "PUT", cookie: pricey.cookie, body: JSON.stringify(mornings) });

  const student = await account("student", "Baraka", `Quiz${tag}`, "Africa/Nairobi");
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await signIn(ctx, student);
  const page = await ctx.newPage();
  await page.goto("/find-tutors");
  await page.getByRole("link", { name: /Not sure who to pick/ }).click();
  await expect(page.getByRole("heading", { name: "What do you want to learn?" })).toBeVisible();
  await choose(page, "Subject", `Astronomy ${tag}`);
  await page.getByRole("button", { name: /^Next/ }).click();
  await page.getByRole("button", { name: /Secondary \/ high school/ }).click();
  await page.getByRole("button", { name: /^Next/ }).click();
  await page.getByRole("button", { name: /Pass an exam/ }).click();
  await page.getByRole("button", { name: /^Next/ }).click();
  await page.getByRole("button", { name: /^Up to/ }).nth(1).click(); // a modest budget
  await page.getByRole("button", { name: /^Next/ }).click();
  await page.getByRole("button", { name: /Weekday evenings/ }).click();
  await page.getByRole("button", { name: "Show my matches" }).click();

  await expect(page.getByRole("heading", { name: new RegExp(`3 tutors we'd pick for Astronomy ${tag}`) })).toBeVisible();
  const cards = page.getByRole("listitem").filter({ has: page.getByRole("link", { name: "View profile" }) });
  await expect(cards).toHaveCount(3);
  await expect(cards.first()).toContainText(`Zawadi F.`);
  await expect(cards.first()).toContainText("Best match");
  await expect(cards.first()).toContainText("within your budget");
  await expect(cards.first()).toContainText("Free on weekday evenings");
  await expect(cards.first()).toContainText("Prepares students for exams");
  await expect(cards.nth(0).getByRole("link", { name: /Book a trial/ })).toHaveAttribute("href", `/tutors/${fit.slug}/book?type=trial`);

  // Answers were saved to the student's learning goals.
  const [goals] = await sql<{ goal: string; budget_max: string }>("select goal, budget_max from payload.student_profiles where user_id = $1", [student.id]);
  expect(goals!.goal).toBe("exam");
  expect(Number(goals!.budget_max)).toBeGreaterThan(0);
  const subs = await sql("select 1 from payload.student_profiles_rels r join payload.student_profiles p on p.id = r.parent_id where p.user_id = $1 and r.subjects_id = $2", [student.id, subj!.id]);
  expect(subs.length).toBe(1);

  // Phone layout.
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await ctx.close();
});
