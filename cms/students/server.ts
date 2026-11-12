import "server-only";
import type { Payload } from "payload";
import type { StudentProfile, User } from "@/payload-types";

/** The student's own learning profile, created on first use. Filtered by their own id. */
export async function ownStudentProfile(payload: Payload, user: User): Promise<StudentProfile> {
  const found = await payload.find({ collection: "student-profiles", where: { user: { equals: user.id } }, limit: 1, depth: 0, overrideAccess: true });
  if (found.docs[0]) return found.docs[0];
  // Created as the student (so relationship validation and hooks see who they are).
  try {
    return await payload.create({ collection: "student-profiles", data: { user: user.id } as never, user, overrideAccess: true, depth: 0 });
  } catch (err) {
    // Two requests can race to create it (e.g. two tabs): use the one that won.
    const again = await payload.find({ collection: "student-profiles", where: { user: { equals: user.id } }, limit: 1, depth: 0, overrideAccess: true });
    if (again.docs[0]) return again.docs[0];
    throw err;
  }
}

export const idList = (v: unknown[] | null | undefined) => (v ?? []).map((x) => (x && typeof x === "object" ? (x as { id: number }).id : (x as number)));
