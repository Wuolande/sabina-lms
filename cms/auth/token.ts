import { jwtVerify } from "jose";

/**
 * Fast, optimistic session check for proxy.ts: verifies the Payload JWT signature and expiry
 * and reads the role saved in the token. Pages and API routes still call payload.auth(),
 * which also checks the server-side session, so a revoked session never gets data.
 */
export const COOKIE = "payload-token";

let keyPromise: Promise<Uint8Array> | null = null;
async function key() {
  // Payload signs with sha256(PAYLOAD_SECRET) hex, first 32 characters.
  keyPromise ??= (async () => {
    const data = new TextEncoder().encode(process.env.PAYLOAD_SECRET || "dev-only-secret-change-me");
    const hash = await crypto.subtle.digest("SHA-256", data);
    const hex = Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
    return new TextEncoder().encode(hex);
  })();
  return keyPromise;
}

export type TokenClaims = { id: number | string; email?: string; role?: string; status?: string; collection?: string };

export async function readToken(token: string | undefined): Promise<TokenClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, await key(), { algorithms: ["HS256"] });
    return payload as unknown as TokenClaims;
  } catch {
    return null;
  }
}
