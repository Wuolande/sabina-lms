import "server-only";
import { randomUUID } from "node:crypto";
import { getFieldsToSign, jwtSign, type Payload } from "payload";
import type { User } from "@/payload-types";
import { readToken } from "./token";

/**
 * "Log in as this user" for admins, to see exactly what a student or tutor sees.
 * The admin's own session is kept in an httpOnly cookie and put back when they return.
 * The borrowed session lasts an hour, is marked with the admin's id, and is logged.
 */
export const ADMIN_COOKIE = "sb_admin_token";
/** Readable by the page (no secrets): who is being viewed, for the banner. */
export const BANNER_COOKIE = "sb_imp";
export const IMPERSONATION_SECONDS = 60 * 60;

export class ImpersonationError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

/** True when the current session is an admin viewing as someone else. */
export async function isImpersonating(token: string | undefined) {
  const claims = (await readToken(token)) as { impersonatedBy?: number } | null;
  return Boolean(claims?.impersonatedBy);
}

export async function startImpersonation(payload: Payload, admin: User, targetId: number) {
  if (admin.role !== "admin") throw new ImpersonationError("Only admins can log in as another user.", 403);
  const target = await payload.findByID({ collection: "users", id: targetId, depth: 0, overrideAccess: true, showHiddenFields: true }).catch(() => null);
  if (!target) throw new ImpersonationError("User not found.", 404);
  if (target.id === admin.id) throw new ImpersonationError("That's you.");
  if (target.role !== "student" && target.role !== "tutor") throw new ImpersonationError("You can only log in as a student or tutor.", 403);

  const collectionConfig = payload.collections.users.config;
  // A short session of its own, so it can be ended without touching the user's real sessions.
  const sid = randomUUID();
  const now = new Date();
  const sessions = ((target as { sessions?: { id: string; createdAt: string; expiresAt: string }[] }).sessions ?? []).filter((s) => Date.parse(s.expiresAt) > now.getTime());
  sessions.push({ id: sid, createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + IMPERSONATION_SECONDS * 1000).toISOString() });
  await payload.db.updateOne({ collection: "users", id: target.id, data: { sessions, updatedAt: target.updatedAt } as never, returning: false });

  const fields = getFieldsToSign({ collectionConfig, email: target.email, user: { ...target, collection: "users" } as never, sid });
  const { token } = await jwtSign({ fieldsToSign: { ...fields, impersonatedBy: admin.id }, secret: payload.secret, tokenExpiration: IMPERSONATION_SECONDS });

  payload.logger.info({ admin: admin.id, target: target.id }, "[impersonate] admin logged in as user");
  const { track } = await import("../analytics/store");
  await track(payload, "impersonation", { userId: admin.id, meta: { target: target.id, role: target.role } });
  return { token, target };
}

/** End the borrowed session and work out the admin token to put back (only if it's still a valid admin). */
export async function stopImpersonation(payload: Payload, currentToken: string | undefined, adminToken: string | undefined) {
  const claims = (await readToken(currentToken)) as { id?: number; sid?: string; impersonatedBy?: number } | null;
  if (claims?.impersonatedBy && claims.id && claims.sid) {
    const u = await payload.findByID({ collection: "users", id: claims.id, depth: 0, overrideAccess: true, showHiddenFields: true }).catch(() => null);
    const sessions = ((u as { sessions?: { id: string }[] } | null)?.sessions ?? []).filter((s) => s.id !== claims.sid);
    if (u) await payload.db.updateOne({ collection: "users", id: u.id, data: { sessions, updatedAt: u.updatedAt } as never, returning: false });
  }
  if (!adminToken) return null;
  const { user } = (await payload.auth({ headers: new Headers({ Authorization: `JWT ${adminToken}` }) })) as { user: User | null };
  return user && user.role === "admin" ? { token: adminToken, admin: user, viewed: claims?.id ?? null } : null;
}
