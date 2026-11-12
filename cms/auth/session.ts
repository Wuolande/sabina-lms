import "server-only";
import { headers as nextHeaders } from "next/headers";
import { redirect } from "next/navigation";
import { getPayload } from "payload";
import config from "@payload-config";
import type { User } from "@/payload-types";
import type { Role } from "../access";
import { STAFF_ROLES } from "../access";

export const getPayloadClient = () => getPayload({ config });

/** The signed-in user for this request (verified by Payload: signature, expiry, session), or null. */
export async function getSessionUser(): Promise<User | null> {
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: await nextHeaders() });
  return (user as User | null) ?? null;
}

/** Home page for a role. */
export const homeFor = (role?: string | null) =>
  role === "tutor" ? "/tutor" : role === "student" ? "/student" : STAFF_ROLES.includes(role as never) ? "/admin" : "/login";

/**
 * Use in server layouts/pages: returns the user, or redirects to sign-in (or to the user's own
 * home when they don't have one of the allowed roles).
 */
export async function requireUser(roles?: Role[], from?: string): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect(`/login${from ? `?redirect=${encodeURIComponent(from)}` : ""}`);
  if (user.status !== "active") redirect("/login?error=inactive");
  if (roles && !roles.includes(user.role as Role)) redirect(homeFor(user.role));
  return user;
}
