import type { CollectionBeforeOperationHook } from "payload";

/**
 * Accounts imported from the old Supabase platform keep their bcrypt password hash in
 * `legacyPasswordHash`. On their first sign-in we check the password against it, save it as a
 * normal Payload password, and forget the old hash. Works for the site and /admin sign-in.
 */
export const upgradeLegacyPassword: CollectionBeforeOperationHook = async ({ args, operation, req }) => {
  if (operation !== "login") return args;
  const email = typeof args.data?.email === "string" ? args.data.email.toLowerCase().trim() : "";
  const password = typeof args.data?.password === "string" ? args.data.password : "";
  if (!email || !password) return args;
  const found = await req.payload.find({ collection: "users", where: { email: { equals: email } }, limit: 1, depth: 0, overrideAccess: true, showHiddenFields: true, req });
  const user = found.docs[0] as { id: number; legacyPasswordHash?: string | null } | undefined;
  if (!user?.legacyPasswordHash) return args;
  const { compare } = await import("bcryptjs");
  if (!(await compare(password, user.legacyPasswordHash).catch(() => false))) return args;
  await req.payload.update({
    collection: "users",
    id: user.id,
    data: { password, legacyPasswordHash: null, loginAttempts: 0, lockUntil: null } as never,
    overrideAccess: true,
    req,
    context: { skipAudit: true },
  });
  return args;
};
