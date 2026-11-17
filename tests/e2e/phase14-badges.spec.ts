import { Client } from "pg";
import { expect, test } from "@playwright/test";
import { account, api, approvedTutor, signIn } from "./accounts";

/**
 * Tutor badges are worked out by the scheduled jobs from reviews, reply times and lessons, use the
 * thresholds in Fees & policies, and show on tutor cards, profiles and the tutor's own home page.
 */
const ADMIN = { email: process.env.E2E_ADMIN_EMAIL || "admin@sabina.test", password: process.env.E2E_ADMIN_PASSWORD || "Admin12345!" };

async function sql<T = Record<string, unknown>>(q: string, args: unknown[] = []) {
  const db = new Client({ connectionString: process.env.DATABASE_URI });
  await db.connect();
  try {
    return (await db.query(q, args)).rows as T[];
  } finally {
    await db.end();
  }
}

test("badges are earned automatically and shown everywhere", async ({ browser }, info) => {
  test.skip(info.project.name !== "desktop", "Runs once, on desktop");
  test.setTimeout(240_000);
  const tag = Math.random().toString(36).slice(2, 6);
  const tutor = await approvedTutor("Baraka", `Badge${tag}`, ADMIN);
  const student = await account("student", "Asha", `Asker${tag}`);
  const admin = (await api("/api/auth/login", { method: "POST", body: JSON.stringify(ADMIN) })).cookie!;

  // Strong reviews and lessons (set directly; reviews and lessons have their own tests).
  await sql(`update payload.tutor_profiles set headline = $2, stats_rating = 4.9, stats_review_count = 7, stats_lessons_taught = 12, approved_at = now() - interval '90 days' where id = $1`, [tutor.profileId, `Physics with badges ${tag}`]);
  // Three questions from a student, each answered within about 20 minutes.
  const [conv] = await sql<{ id: number }>(`insert into payload.conversations (student_id, tutor_user_id, tutor_id) values ($1, $2, $3) returning id`, [student.id, tutor.id, tutor.profileId]);
  for (const ago of [600, 400, 200]) {
    await sql(`insert into payload.messages (conversation_id, sender_id, body, created_at) values ($1, $2, 'Question', now() - ($3 || ' minutes')::interval)`, [conv!.id, student.id, String(ago)]);
    await sql(`insert into payload.messages (conversation_id, sender_id, body, created_at) values ($1, $2, 'Answer', now() - ($3 || ' minutes')::interval)`, [conv!.id, tutor.id, String(ago - 20)]);
  }

  await api("/api/jobs", { method: "POST", cookie: admin, body: JSON.stringify({ action: "run" }) });
  const badges = async () => (await sql<{ value: string }>(`select value::text from payload.tutor_profiles_badges where parent_id = $1 order by "order"`, [tutor.profileId])).map((r) => r.value);
  expect(await badges()).toEqual(["top_rated", "fast_responder", "lessons_10"]);
  expect(Number((await sql<{ m: string }>(`select stats_response_minutes as m from payload.tutor_profiles where id = $1`, [tutor.profileId]))[0]!.m)).toBe(20);

  // Shown on the public profile, with the reply time, and on the marketplace card.
  const page = await browser.newPage();
  await page.goto(`/tutors/${tutor.slug}`);
  const list = page.getByRole("list", { name: "Badges" }).first();
  await expect(list).toContainText("Top rated");
  await expect(list).toContainText("Fast responder");
  await expect(list).toContainText("10+ lessons");
  await expect(page.getByText("Usually replies within an hour")).toBeVisible();
  await page.goto(`/find-tutors?q=${encodeURIComponent(`badges ${tag}`)}`);
  await expect(page.locator("article", { hasText: `badges ${tag}` }).getByRole("list", { name: "Badges" })).toContainText("Top rated");
  await page.close();

  // The tutor sees their badges and how to earn the rest.
  const ctx = await browser.newContext();
  await signIn(ctx, tutor);
  const home = await ctx.newPage();
  await home.goto("/tutor");
  const panel = home.getByRole("region", { name: "Your badges" });
  await expect(panel).toContainText("Top rated");
  await expect(panel).toContainText("In demand");
  await expect(panel).toContainText(/8 or more lessons booked in the last 30 days/);
  await expect(home.getByText("From 7 reviews")).toBeVisible();
  await ctx.close();

  // Thresholds come from Fees & policies: raise the bar and the badge goes.
  const before = (await api("/api/cms/globals/platform-settings", { cookie: admin })).data as { badgeTopRatedRating?: number };
  try {
    await api("/api/cms/globals/platform-settings", { method: "POST", cookie: admin, body: JSON.stringify({ badgeTopRatedRating: 4.95 }) });
    await api("/api/jobs", { method: "POST", cookie: admin, body: JSON.stringify({ action: "run" }) });
    expect(await badges()).toEqual(["fast_responder", "lessons_10"]);
  } finally {
    await api("/api/cms/globals/platform-settings", { method: "POST", cookie: admin, body: JSON.stringify({ badgeTopRatedRating: before.badgeTopRatedRating ?? 4.8 }) });
  }
});
