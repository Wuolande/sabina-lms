import { Client } from "pg";
import bcrypt from "bcryptjs";
import { expect, test } from "@playwright/test";
import { account, api } from "./accounts";

/**
 * Accounts imported from the old Supabase platform keep their bcrypt hash until first sign-in.
 * Signing in with the old password works (site and admin endpoints), upgrades the password, and
 * clears the old hash. A wrong password is still refused.
 */
async function sql<T = Record<string, unknown>>(q: string, args: unknown[] = []) {
  const db = new Client({ connectionString: process.env.DATABASE_URI });
  await db.connect();
  try {
    return (await db.query(q, args)).rows as T[];
  } finally {
    await db.end();
  }
}

test("old Supabase passwords keep working and are upgraded on first sign-in", async ({}, info) => {
  test.skip(info.project.name !== "desktop", "Runs once");
  const a = await account("student", "Legacy", "Learner");
  const old = "OldSupabasePass9";
  // Simulate an imported account: a bcrypt hash from Supabase, and an unknown Payload password.
  await sql("update payload.users set legacy_password_hash = $2, hash = 'x', salt = 'x' where id = $1", [a.id, bcrypt.hashSync(old, 10)]);

  expect((await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: a.email, password: "WrongPass123" }) })).res.status).toBe(401);
  expect((await sql<{ h: string | null }>("select legacy_password_hash h from payload.users where id = $1", [a.id]))[0]!.h).not.toBeNull();

  const ok = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: a.email, password: old }) });
  expect(ok.res.status).toBe(200);
  expect((await sql<{ h: string | null }>("select legacy_password_hash h from payload.users where id = $1", [a.id]))[0]!.h).toBeNull();
  // From now on it's a normal Payload password, on both sign-in endpoints.
  expect((await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: a.email, password: old }) })).res.status).toBe(200);
  expect((await api("/api/users/login", { method: "POST", body: JSON.stringify({ email: a.email, password: old }) })).res.status).toBe(200);

  // The hidden fields never reach the API.
  const me = await api("/api/users/me", { cookie: ok.cookie });
  expect(JSON.stringify(me.data)).not.toMatch(/legacyPasswordHash|legacyAvatarUrl|legacyId/);
});
