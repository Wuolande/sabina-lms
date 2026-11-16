import { expect, test } from "@playwright/test";
import { Client } from "pg";
import { account, api, signIn } from "./accounts";

/**
 * Installable app: a valid manifest and icons, a service worker that keeps opened portal pages
 * available offline (and falls back to the offline page), and push sign-up per device.
 */
async function sql<T = Record<string, unknown>>(q: string, params: unknown[] = []) {
  const db = new Client({ connectionString: process.env.DATABASE_URI });
  await db.connect();
  try {
    return (await db.query(q, params)).rows as T[];
  } finally {
    await db.end();
  }
}

test("manifest and icons are installable", async ({ request }) => {
  const m = await (await request.get("/manifest.webmanifest")).json();
  expect(m.display).toBe("standalone");
  expect(m.start_url).toContain("/student");
  const sizes = (m.icons as { sizes: string; purpose?: string; src: string }[]).map((i) => `${i.sizes}:${i.purpose}`);
  expect(sizes).toEqual(expect.arrayContaining(["192x192:any", "512x512:any", "512x512:maskable"]));
  for (const i of m.icons as { src: string }[]) expect((await request.get(i.src)).status()).toBe(200);
  const sw = await request.get("/sw.js");
  expect(sw.status()).toBe(200);
  expect(sw.headers()["content-type"]).toContain("javascript");
});

test("offline: saved pages still open, others show the offline page; push sign-up is stored per device", async ({ browser }, info) => {
  test.skip(info.project.name !== "desktop", "Runs once, on desktop");
  test.setTimeout(180_000);
  const tag = Math.random().toString(36).slice(2, 6);
  const student = await account("student", "Wambui", `App${tag}`, "Africa/Nairobi");
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await signIn(ctx, student);
  await ctx.addInitScript(() => localStorage.setItem("sabina.sw", "1")); // the worker is production-only otherwise
  const page = await ctx.newPage();
  await page.goto("/student");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));

  // Visit a page online so it's kept, then go offline.
  await page.goto("/student/lessons");
  await expect(page.getByRole("heading", { name: "My lessons" }).first()).toBeVisible();
  await page.waitForFunction(async () => Boolean(await (await caches.open("sabina-v2-pages")).match("/student/lessons", { ignoreVary: true })));
  await ctx.setOffline(true);
  await page.goto("/student/lessons");
  await expect(page.getByRole("heading", { name: "My lessons" }).first()).toBeVisible();
  // A page never opened falls back to the offline page.
  await page.goto("/student/payments");
  await expect(page.getByRole("heading", { name: "You're offline" })).toBeVisible();
  await ctx.setOffline(false);

  // The classroom, API and checkout are never served from the cache.
  const cached = await page.evaluate(async () => {
    const out: string[] = [];
    for (const k of await caches.keys()) for (const r of await (await caches.open(k)).keys()) out.push(new URL(r.url).pathname);
    return out;
  });
  expect(cached.some((p) => /^\/(api|admin|checkout|lessons)\b/.test(p))).toBe(false);

  // Push: the public key is stable, and a device's subscription is saved once (and replaced, not duplicated).
  const k1 = (await api("/api/push")).data.publicKey as string;
  const k2 = (await api("/api/push")).data.publicKey as string;
  expect(k1).toBe(k2);
  expect(k1.length).toBeGreaterThan(80);
  const sub = { endpoint: `https://push.example.test/${tag}`, keys: { p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM", auth: "tBHItJI5svbpez7KI4CCXg" } };
  expect((await api("/api/push", { method: "POST", cookie: student.cookie, body: JSON.stringify({ subscription: sub }) })).res.ok).toBe(true);
  expect((await api("/api/push", { method: "POST", cookie: student.cookie, body: JSON.stringify({ subscription: sub }) })).res.ok).toBe(true);
  expect((await sql("select 1 from payload.push_subscriptions where user_id = $1", [student.id])).length).toBe(1);
  expect((await api("/api/push", { method: "POST", body: JSON.stringify({ subscription: sub }) })).res.status).toBe(401);
  expect((await api("/api/push", { method: "POST", cookie: student.cookie, body: JSON.stringify({ subscription: { endpoint: "http://insecure", keys: {} } }) })).res.status).toBe(400);
  await api("/api/push", { method: "DELETE", cookie: student.cookie, body: JSON.stringify({ endpoint: sub.endpoint }) });
  expect((await sql("select 1 from payload.push_subscriptions where user_id = $1", [student.id])).length).toBe(0);

  // The switch is offered on the notifications page.
  await page.goto("/student/notifications");
  await expect(page.getByRole("heading", { name: "On this device" })).toBeVisible();

  // Signing out forgets the saved pages on this device.
  await page.evaluate(() => fetch("/api/auth/logout", { method: "POST", credentials: "include" }));
  await page.waitForFunction(async () => !(await (await caches.open("sabina-v2-pages")).match("/student/lessons", { ignoreVary: true })));
  await ctx.close();
});
