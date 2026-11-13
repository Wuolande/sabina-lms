import { Client } from "pg";
import sharp from "sharp";
import type { BrowserContext } from "@playwright/test";
import { tokenFor, uniqueEmail } from "./db";

/** Fast account set-up through the real APIs (no UI), for tests whose subject is something else. */
const BASE = process.env.BASE_URL || "http://localhost:3000";
export const PASSWORD = "Teach2026x";
const H = { "Content-Type": "application/json", "Sec-Fetch-Site": "same-origin" };

export async function api(path: string, init: RequestInit & { cookie?: string } = {}) {
  const { cookie, ...rest } = init;
  const res = await fetch(BASE + path, { ...rest, headers: { ...(rest.body instanceof FormData ? { "Sec-Fetch-Site": "same-origin" } : H), ...(cookie ? { cookie } : {}) } });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { res, data, cookie: res.headers.get("set-cookie")?.split(";")[0] };
}

export type Account = { id: number; email: string; cookie: string; token: string };

export async function account(role: "student" | "tutor", first: string, last: string, timezone = "Africa/Nairobi"): Promise<Account> {
  const email = uniqueEmail(`p3${role}`);
  const reg = await api("/api/auth/register", { method: "POST", body: JSON.stringify({ email, password: PASSWORD, firstName: first, lastName: last, role, acceptTerms: true, timezone }) });
  if (!reg.res.ok) throw new Error(`register ${reg.res.status} ${JSON.stringify(reg.data)}`);
  await api("/api/auth/verify-email", { method: "POST", body: JSON.stringify({ token: await tokenFor(email, "_verificationtoken") }) });
  const login = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password: PASSWORD }) });
  if (!login.res.ok || !login.cookie) throw new Error(`login ${login.res.status}`);
  return { id: Number((login.data.user as { id: number }).id), email, cookie: login.cookie, token: login.cookie.split("=")[1]! };
}

/** A tutor who has applied and been approved by the admin, ready to set hours. */
export async function approvedTutor(first: string, last: string, admin: { email: string; password: string }): Promise<Account & { profileId: number; slug: string }> {
  const t = await account("tutor", first, last);
  await api("/api/account/profile", { method: "PATCH", cookie: t.cookie, body: JSON.stringify({ country: "Kenya", phone: "+254 700 000 000" }) });
  const fd = new FormData();
  fd.append("file", new Blob([new Uint8Array(await sharp({ create: { width: 300, height: 300, channels: 3, background: "#0F766E" } }).png().toBuffer())], { type: "image/png" }), "me.png");
  await api("/api/account/avatar", { method: "POST", body: fd, cookie: t.cookie });
  const id = new FormData();
  id.append("kind", "identity");
  id.append("file", new Blob([new Uint8Array(await sharp({ create: { width: 600, height: 380, channels: 3, background: "#e2e8f0" } }).jpeg().toBuffer())], { type: "image/jpeg" }), "id.jpg");
  const doc = await api("/api/tutor/documents", { method: "POST", body: id, cookie: t.cookie });
  const db = new Client({ connectionString: process.env.DATABASE_URI });
  await db.connect();
  const subjects = Object.fromEntries((await db.query("select id, slug from payload.subjects")).rows.map((r) => [r.slug, r.id]));
  const en = (await db.query("select id from payload.languages where code='en'")).rows[0].id;
  await db.end();
  const app = await api("/api/tutor/application", {
    method: "PATCH",
    cookie: t.cookie,
    body: JSON.stringify({
      headline: `Physics made simple by ${first}`,
      about: "I teach physics with everyday examples, worked problems and regular practice so that ideas stick and exam questions feel familiar. ".repeat(2),
      languages: [{ language: en, level: "c2" }],
      primarySubject: subjects.physics,
      subjects: [subjects.physics, subjects.mathematics],
      levelsTaught: ["secondary"],
      hourlyRate: 30,
      offersTrial: true,
      education: [{ degree: "BSc Physics", institution: "Kenyatta University" }],
      identity: { documentType: "national_id", document: doc.data.id },
    }),
  });
  if (!app.res.ok) throw new Error(`application ${JSON.stringify(app.data)}`);
  const submit = await api("/api/tutor/application/submit", { method: "POST", cookie: t.cookie });
  if (!submit.res.ok) throw new Error(`submit ${JSON.stringify(submit.data)}`);
  const a = await api("/api/auth/login", { method: "POST", body: JSON.stringify(admin) });
  const profileId = Number(((app.data.application ?? app.data) as { id: number }).id);
  const review = await api(`/api/cms/tutor-profiles/${profileId}/review`, { method: "POST", cookie: a.cookie, body: JSON.stringify({ action: "approve" }) });
  if (!review.res.ok) throw new Error(`approve ${JSON.stringify(review.data)}`);
  const pub = await api(`/api/cms/tutor-profiles/${profileId}`, { cookie: t.cookie });
  return { ...t, profileId, slug: String(pub.data.slug) };
}

/** Sign a browser context in as an account created through the API. */
export async function signIn(context: BrowserContext, a: Account) {
  await context.addCookies([{ name: "payload-token", value: a.token, url: BASE, httpOnly: true, sameSite: "Lax" }]);
}

/** Pick an option from one of the site's <Combobox> dropdowns (types into its search box when it has one). */
export async function choose(page: import("@playwright/test").Page, label: string | RegExp, option: string | RegExp) {
  await page.getByRole("combobox", { name: label }).click();
  const list = page.getByRole("listbox");
  await list.waitFor();
  const search = list.locator("xpath=..").getByRole("textbox");
  if (typeof option === "string" && (await search.count())) await search.fill(option);
  await list.getByRole("option", { name: option }).first().click();
}
