import "server-only";
import type { User, Media } from "@/payload-types";
import type { PortalUser } from "@/components/portal/types";
import { getPayloadClient } from "./session";

/** Shape the signed-in user for the student/tutor portals (only fields the browser needs). */
export async function toPortalUser(user: User): Promise<PortalUser> {
  let avatar: Media | null = null;
  if (user.avatar && typeof user.avatar === "object") avatar = user.avatar as Media;
  else if (user.avatar) {
    const payload = await getPayloadClient();
    avatar = (await payload.findByID({ collection: "media", id: user.avatar, depth: 0, overrideAccess: true }).catch(() => null)) as Media | null;
  }
  let tutorStatus: PortalUser["tutorStatus"] = null;
  let tutorSlug: string | null = null;
  if (user.role === "tutor") {
    const payload = await getPayloadClient();
    const t = await payload.find({ collection: "tutor-profiles", where: { user: { equals: user.id } }, limit: 1, depth: 0, overrideAccess: true, select: { status: true, slug: true } });
    tutorStatus = (t.docs[0]?.status as PortalUser["tutorStatus"]) ?? null;
    tutorSlug = t.docs[0]?.slug ?? null;
  }
  let goalsSet = false;
  if (user.role === "student") {
    const payload = await getPayloadClient();
    const sp = await payload.find({ collection: "student-profiles", where: { user: { equals: user.id } }, limit: 1, depth: 0, overrideAccess: true, select: { onboardedAt: true } });
    goalsSet = Boolean(sp.docs[0]?.onboardedAt);
  }
  return {
    goalsSet,
    tutorStatus,
    tutorSlug,
    id: user.id,
    email: user.email,
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    name: user.name ?? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
    role: user.role === "tutor" ? "tutor" : "student",
    timezone: user.timezone || "UTC",
    phone: user.phone ?? "",
    country: user.country ?? "",
    avatarUrl: avatar?.sizes?.thumb?.url ?? avatar?.url ?? null,
    avatarId: avatar?.id ?? null,
  };
}
