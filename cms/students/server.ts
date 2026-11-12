import "server-only";
import type { Payload } from "payload";
import type { StudentProfile, User } from "@/payload-types";

/** The student's own learning profile, created on first use. Filtered by their own id. */
export async function ownStudentProfile(payload: Payload, user: User): Promise<StudentProfile> {
  const found = await payload.find({ collection: "student-profiles", where: { user: { equals: user.id } }, limit: 1, depth: 0, overrideAccess: true });
  if (found.docs[0]) return found.docs[0];
  return payload.create({ collection: "student-profiles", data: { user: user.id } as never, overrideAccess: true, depth: 0 });
}

export const idList = (v: unknown[] | null | undefined) => (v ?? []).map((x) => (x && typeof x === "object" ? (x as { id: number }).id : (x as number)));
