import "server-only";
import type { Payload } from "payload";
import { getSessionUser } from "../auth/session";

/** Who's browsing the marketplace, and which tutors they've saved (students only). */
export async function marketplaceViewer(payload: Payload) {
  const user = await getSessionUser().catch(() => null);
  let saved = new Set<number>();
  if (user?.role === "student") {
    const sp = await payload.find({ collection: "student-profiles", where: { user: { equals: user.id } }, limit: 1, depth: 0, overrideAccess: true, select: { savedTutors: true } });
    saved = new Set((sp.docs[0]?.savedTutors ?? []).map((t) => (typeof t === "object" ? t.id : t)));
  }
  return { user, signedIn: Boolean(user), isStudent: user?.role === "student", saved };
}
