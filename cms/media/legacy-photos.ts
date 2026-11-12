import type { Payload, PayloadRequest } from "payload";
import { r2Ready } from "../storage/r2";

/**
 * Copies profile photos imported from the old platform (Cloudinary URLs kept in
 * `users.legacyAvatarUrl`) into the media library, then links them to the account (and, for
 * tutors, the public profile). Runs in production only once R2 storage is configured, so files
 * never land on a read-only server disk. Safe to repeat: a moved photo's URL is cleared, and a
 * photo that fails is retried next time.
 */
export async function moveLegacyPhotos(payload: Payload, req?: Partial<PayloadRequest>) {
  if (process.env.NODE_ENV === "production" && !r2Ready()) return { moved: 0, waiting: -1 };
  const users = await payload.find({ collection: "users", where: { legacyAvatarUrl: { exists: true } }, limit: 50, depth: 0, overrideAccess: true, showHiddenFields: true, req });
  let moved = 0;
  for (const u of users.docs as { id: number; firstName?: string; legacyAvatarUrl?: string | null; avatar?: unknown }[]) {
    const url = u.legacyAvatarUrl;
    if (!url) continue;
    try {
      if (!u.avatar) {
        const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = Buffer.from(await res.arrayBuffer());
        const mimetype = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
        const name = `avatar-${u.id}.${mimetype.split("/")[1]?.replace("jpeg", "jpg") || "jpg"}`;
        const media = await payload.create({ collection: "media", data: { alt: `${u.firstName ?? "Profile"} photo` } as never, file: { data, mimetype, name, size: data.length }, overrideAccess: true, req });
        await payload.update({ collection: "users", id: u.id, data: { avatar: media.id, legacyAvatarUrl: null } as never, overrideAccess: true, req, context: { skipAudit: true } });
      } else {
        await payload.update({ collection: "users", id: u.id, data: { legacyAvatarUrl: null } as never, overrideAccess: true, req, context: { skipAudit: true } });
      }
      moved++;
    } catch (err) {
      payload.logger.error({ err, user: u.id }, "[legacy photos] not moved yet; will retry");
    }
  }
  return { moved, waiting: users.totalDocs - moved };
}
