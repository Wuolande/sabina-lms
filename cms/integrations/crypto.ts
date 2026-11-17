import crypto from "node:crypto";

/**
 * Secret keys saved in the admin are encrypted with AES-256-GCM, using a key derived from
 * PAYLOAD_SECRET, so a database copy alone doesn't reveal them. The admin only ever sees the
 * last four characters.
 */
const key = () => crypto.createHash("sha256").update(`sabina-integrations:${process.env.PAYLOAD_SECRET || "dev-only-secret-change-me"}`).digest();
const PREFIX = "enc:v1:";

export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return PREFIX + Buffer.concat([iv, c.getAuthTag(), body]).toString("base64");
}

/** The plain value, or "" if it can't be read (e.g. PAYLOAD_SECRET changed). */
export function decrypt(value: string): string {
  if (!value.startsWith(PREFIX)) return value;
  try {
    const b = Buffer.from(value.slice(PREFIX.length), "base64");
    const d = crypto.createDecipheriv("aes-256-gcm", key(), b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString("utf8");
  } catch {
    return "";
  }
}

export const MASK = "••••••••";
/** What the admin shows for a saved secret: dots and the last four characters. */
export const mask = (plain: string) => (plain ? `${MASK}${plain.length > 10 ? plain.slice(-4) : ""}` : "");
export const isMasked = (v: unknown) => typeof v === "string" && v.startsWith(MASK);
