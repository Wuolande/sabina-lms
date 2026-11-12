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
  return {
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
