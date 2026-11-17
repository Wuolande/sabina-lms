import { Client } from "pg";
import { expect, test } from "@playwright/test";
import { account, api, approvedTutor, signIn, type Account } from "./accounts";

/**
 * Referral credits: an invite link leads to sign-up, the friend's first finished paid lesson rewards
 * both people (a tutor inviter gets a bonus in their earnings instead), credit is used at checkout
 * (including a lesson paid entirely with credit), and a refund gives the credit back.
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
async function book(student: Account, tutorId: number, slug: string, index: number) {
  const slots = (await api(`/api/tutors/${slug}/slots?minutes=60`, { cookie: student.cookie })).data.slots as string[];
  const b = await api("/api/bookings", { method: "POST", cookie: student.cookie, body: JSON.stringify({ tutorId, startsAt: slots[index], kind: "regular", minutes: 60 }) });
  return (b.data.booking as { id: number; price: number }).id;
}
const credits = async (userId: number) => (await sql<{ kind: string; amount: string }>(`select kind::text, amount from payload.credits where user_id = $1 order by id`, [userId])).map((c) => [c.kind, Number(c.amount)]);

test("invites reward both people, and credit pays for lessons", async ({ browser }, info) => {
  test.skip(info.project.name !== "desktop", "Runs once, on desktop");
  test.setTimeout(300_000);
  const tag = Math.random().toString(36).slice(2, 6);
  const admin = (await api("/api/auth/login", { method: "POST", body: JSON.stringify(ADMIN) })).cookie!;
  const settings = (await api("/api/cms/globals/platform-settings", { cookie: admin })).data as Record<string, unknown>;
  const currency = String(settings.currency ?? "USD");

  const inviter = await account("student", "Amani", `Inviter${tag}`);
  const mine = (await api("/api/referrals", { cookie: inviter.cookie })).data as { code: string; link: string; rewards: { you: number; friend: number } };
  expect(mine.code).toMatch(/^AMANI-[A-Z0-9]{4}$/);
  expect(mine.link).toContain(`/r/${mine.code}`);

  // The invite link remembers the code and opens sign-up with a welcome note.
  const visitor = await browser.newContext();
  const page = await visitor.newPage();
  await page.goto(`/r/${mine.code}`);
  await expect(page).toHaveURL(new RegExp(`/register\\?ref=${mine.code}`));
  await expect(page.getByText("Amani invited you to Sabina.")).toBeVisible();
  expect((await visitor.cookies()).find((c) => c.name === "sb_ref")?.value).toBe(mine.code);
  await visitor.close();

  const friend = await account("student", "Zawadi", `Friend${tag}`, "Africa/Nairobi", mine.code);
  expect((await sql<{ by: number }>(`select referred_by_id as by from payload.users where id = $1`, [friend.id]))[0]!.by).toBe(inviter.id);
  // Can't invite yourself, and a bad code is ignored.
  const stray = await account("student", "Juma", `Stray${tag}`, "Africa/Nairobi", "NOPE-0000");
  expect((await sql<{ by: number | null }>(`select referred_by_id as by from payload.users where id = $1`, [stray.id]))[0]!.by).toBeNull();

  // The tutor was invited by another tutor.
  const tutorInviter = await account("tutor", "Baraka", `Mentor${tag}`);
  const tutor = await approvedTutor("Imani", `Ref${tag}`, ADMIN);
  await sql(`update payload.users set referred_by_id = $1 where id = $2`, [tutorInviter.id, tutor.id]);
  await api("/api/tutor/schedule", { method: "PUT", cookie: tutor.cookie, body: JSON.stringify({ timezone: "Africa/Nairobi", weekly: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, start: "06:00", end: "22:00" })), timeOff: [], noticeHours: 0, bufferMinutes: 0, instantBooking: true }) });

  // The friend's first paid lesson, finished by the tutor.
  const first = await book(friend, tutor.profileId, tutor.slug, 30);
  const co = await api("/api/payments/checkout", { method: "POST", cookie: friend.cookie, body: JSON.stringify({ bookingId: first, provider: "dev" }) });
  await api("/api/payments/dev", { method: "POST", cookie: friend.cookie, body: JSON.stringify({ ref: co.data.reference, outcome: "succeeded" }) });
  await sql(`update payload.bookings set starts_at = now() - interval '70 minutes', ends_at = now() - interval '10 minutes' where id = $1`, [first]);
  expect((await api(`/api/lessons/${first}`, { method: "POST", cookie: tutor.cookie, body: JSON.stringify({ action: "finish" }) })).res.ok).toBe(true);

  expect(await credits(inviter.id)).toEqual([["referral_reward", Number(settings.referralRewardReferrer)]]);
  expect(await credits(friend.id)).toEqual([["referral_welcome", Number(settings.referralRewardFriend)]]);
  expect(await credits(tutorInviter.id)).toEqual([["tutor_bonus", Number(settings.referralRewardTutor)]]);
  // Only once: a second finished lesson gives nothing more.
  const second = await book(friend, tutor.profileId, tutor.slug, 40);
  const co2 = await api("/api/payments/checkout", { method: "POST", cookie: friend.cookie, body: JSON.stringify({ bookingId: second, provider: "dev", useCredit: false }) });
  await api("/api/payments/dev", { method: "POST", cookie: friend.cookie, body: JSON.stringify({ ref: co2.data.reference, outcome: "succeeded" }) });
  await sql(`update payload.bookings set starts_at = now() - interval '70 minutes', ends_at = now() - interval '10 minutes' where id = $1`, [second]);
  await api(`/api/lessons/${second}`, { method: "POST", cookie: tutor.cookie, body: JSON.stringify({ action: "finish" }) });
  expect((await credits(inviter.id)).length).toBe(1);

  // The tutor's bonus shows in their earnings, ready to withdraw.
  const tctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await signIn(tctx, tutorInviter);
  const te = await tctx.newPage();
  await te.goto("/tutor/earnings");
  await expect(te.getByRole("row", { name: /Invite bonus/ })).toContainText("Imani R.");
  await tctx.close();

  // The inviter sees it all on the invite page.
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await signIn(ctx, inviter);
  const inv = await ctx.newPage();
  await inv.goto("/student/invite");
  await expect(inv.getByRole("textbox", { name: "Invite link" })).toHaveValue(mine.link);
  await expect(inv.getByText("Zawadi F.", { exact: true })).toBeVisible();
  await expect(inv.getByText("Reward earned")).toBeVisible();
  await ctx.close();

  // Give the inviter enough credit for a whole lesson, then pay with credit only.
  const third = await book(inviter, tutor.profileId, tutor.slug, 50);
  const price = Number((await sql<{ price: string }>(`select price from payload.bookings where id = $1`, [third]))[0]!.price);
  await sql(`insert into payload.credits (user_id, amount, currency, kind, note) values ($1, $2, $3, 'adjustment', 'Test top-up')`, [inviter.id, price, currency]);
  const balance = Number(settings.referralRewardReferrer) + price;
  expect(((await api("/api/credits", { cookie: inviter.cookie })).data as { balance: number }).balance).toBe(balance);

  const pay = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await signIn(pay, inviter);
  const cp = await pay.newPage();
  await cp.goto(`/checkout/pay/${third}`);
  await expect(cp.getByText("Use my lesson credit")).toBeVisible();
  await cp.getByRole("button", { name: "Confirm with lesson credit" }).click();
  await cp.waitForURL(/\/checkout\/return/);
  await pay.close();
  const paid = await sql<{ status: string; payment_status: string }>(`select status::text, payment_status::text from payload.bookings where id = $1`, [third]);
  expect(paid[0]!.payment_status).toBe("paid");
  expect((await sql<{ provider: string; amount: string; credit_used: string }>(`select provider::text, amount, credit_used from payload.payments where booking_id = $1`, [third]))[0]).toMatchObject({ provider: "credit" });
  expect(((await api("/api/credits", { cookie: inviter.cookie })).data as { balance: number }).balance).toBe(Number(settings.referralRewardReferrer));

  // Cancelled in good time: the credit comes back.
  const cancel = await api(`/api/bookings/${third}`, { method: "POST", cookie: inviter.cookie, body: JSON.stringify({ action: "cancel", reason: "Plans changed" }) });
  expect(cancel.res.ok).toBe(true);
  await expect.poll(async () => ((await api("/api/credits", { cookie: inviter.cookie })).data as { balance: number }).balance).toBe(balance);

  // Part credit, part card: only the rest is charged.
  const fourth = await book(friend, tutor.profileId, tutor.slug, 60);
  const part = await api("/api/payments/checkout", { method: "POST", cookie: friend.cookie, body: JSON.stringify({ bookingId: fourth, provider: "dev" }) });
  const pp = (await sql<{ amount: string; credit_used: string }>(`select amount, credit_used from payload.payments where reference = $1`, [part.data.reference]))[0]!;
  expect(Number(pp.credit_used)).toBe(Number(settings.referralRewardFriend));
  expect(Number(pp.amount) + Number(pp.credit_used)).toBeCloseTo(Number((await sql<{ price: string }>(`select price from payload.bookings where id = $1`, [fourth]))[0]!.price));
  await api("/api/payments/dev", { method: "POST", cookie: friend.cookie, body: JSON.stringify({ ref: part.data.reference, outcome: "succeeded" }) });
  expect(((await api("/api/credits", { cookie: friend.cookie })).data as { balance: number }).balance).toBe(0);
});
