import http from "node:http";
import { expect, test } from "@playwright/test";
import { Client } from "pg";
import { account, api, approvedTutor, signIn } from "./accounts";

/**
 * SMS reminders (Africa's Talking). Needs the dev server started with
 * AFRICASTALKING_USERNAME / AFRICASTALKING_API_KEY and AFRICASTALKING_SMS_URL=http://127.0.0.1:4599/sms;
 * skipped otherwise. A stand-in provider on that port records what we send.
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

test("opt in → one SMS an hour before, in the person's own time; nothing for people who didn't ask", async ({ browser }, info) => {
  test.skip(info.project.name !== "desktop", "Runs once, on desktop");
  test.setTimeout(240_000);
  const tag = Math.random().toString(36).slice(2, 6);
  const student = await account("student", "Kendi", `Sms${tag}`, "Africa/Nairobi");
  const sctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await signIn(sctx, student);
  const sp = await sctx.newPage();
  await sp.goto("/student/notifications");
  test.skip((await sp.getByRole("heading", { name: "SMS", exact: true }).count()) === 0, "Text reminders aren't configured on this server");

  const sent: { to: string; message: string; key: string | undefined }[] = [];
  const provider = http
    .createServer((req, res) => {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        const f = new URLSearchParams(body);
        sent.push({ to: f.get("to") ?? "", message: f.get("message") ?? "", key: req.headers.apikey as string | undefined });
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ SMSMessageData: { Message: "Sent to 1/1", Recipients: [{ statusCode: 101, status: "Success", number: f.get("to") }] } }));
      });
    })
    .listen(4599, "127.0.0.1");
  try {
    // Without a usable phone number the switch explains what to do.
    await sp.getByRole("switch", { name: "Lesson reminders on my phone" }).click();
    await expect(sp.locator("p[role=alert]")).toContainText("Add your phone number with its country code");
    // A local Kenyan number is understood from the country.
    await api("/api/account/profile", { method: "PATCH", cookie: student.cookie, body: JSON.stringify({ country: "Kenya", phone: "0712 345 678" }) });
    await sp.reload();
    await sp.getByRole("switch", { name: "Lesson reminders on my phone" }).click();
    await expect(sp.getByRole("switch", { name: "Lesson reminders on my phone" })).toHaveAttribute("aria-checked", "true");
    await expect.poll(async () => (await sql<{ v: boolean }>("select text_reminders as v from payload.users where id = $1", [student.id]))[0]!.v).toBe(true);

    // A confirmed lesson 50 minutes away; the tutor hasn't opted in.
    const tutor = await approvedTutor("Otis", `Sms${tag}`, ADMIN);
    const [lesson] = await sql<{ id: number }>(
      `insert into payload.bookings (reference, status, payment_status, starts_at, ends_at, student_id, tutor_id, tutor_user_id, kind, minutes, price, currency, updated_at, created_at)
       values ($1, 'confirmed', 'paid', now() + interval '50 minutes', now() + interval '110 minutes', $2, $3, $4, 'regular', 60, 30, 'USD', now(), now() - interval '1 day') returning id`,
      [`SB-S${tag}`, student.id, tutor.profileId, tutor.id],
    );
    await sp.goto("/student/lessons");
    await sp.goto("/student/lessons");
    await expect.poll(() => sent.length, { timeout: 30_000 }).toBe(1);
    expect(sent[0]!.to).toBe("+254712345678");
    expect(sent[0]!.key).toBe("testkey");
    expect(sent[0]!.message).toMatch(/^Sabina: your .*lesson with Otis S\. is today at \d{1,2}:\d{2}/);
    expect(sent[0]!.message).toContain(`/student/lessons/${lesson!.id}`);
    expect(sent[0]!.message.length).toBeLessThanOrEqual(160);
    const log = await sql<{ channel: string; status: string; kind: string }>("select channel, status, kind from payload.text_log where user_id = $1", [student.id]);
    expect(log).toEqual([{ channel: "sms", status: "sent", kind: "lesson_reminder_hour" }]);

    // Loading again doesn't send it twice.
    await sp.goto("/student/lessons");
    await sp.waitForTimeout(2500);
    expect(sent.length).toBe(1);
  } finally {
    provider.close();
    await sctx.close();
  }
});
