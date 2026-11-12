import { Client } from "pg";

/** Read auth tokens straight from the database (stands in for opening the confirmation email). */
export async function tokenFor(email: string, column: "_verificationtoken" | "reset_password_token") {
  const db = new Client({ connectionString: process.env.DATABASE_URI });
  await db.connect();
  try {
    const r = await db.query(`select ${column} as t from payload.users where email = $1`, [email.toLowerCase()]);
    return r.rows[0]?.t as string | undefined;
  } finally {
    await db.end();
  }
}

export const uniqueEmail = (tag: string) => `e2e-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@example.com`;
