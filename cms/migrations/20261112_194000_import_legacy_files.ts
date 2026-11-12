import type { MigrateDownArgs, MigrateUpArgs } from "@payloadcms/db-postgres";

/**
 * Copies profile photos imported from the old platform (Cloudinary URLs kept in
 * `users.legacyAvatarUrl`) into the media library (Cloudflare R2 in production), then links them
 * to the account and, for tutors, the public profile. A photo that can't be downloaded is left in
 * place and logged, so the account still works without it.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const users = await payload.find({ collection: "users", where: { legacyAvatarUrl: { exists: true } }, limit: 1000, pagination: false, depth: 0, overrideAccess: true, showHiddenFields: true, req });
  for (const u of users.docs as { id: number; email: string; firstName?: string; legacyAvatarUrl?: string | null; avatar?: unknown }[]) {
    const url = u.legacyAvatarUrl;
    if (!url) continue;
    try {
      if (u.avatar) {
        await payload.update({ collection: "users", id: u.id, data: { legacyAvatarUrl: null } as never, overrideAccess: true, req, context: { skipAudit: true } });
        continue;
      }
      const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = Buffer.from(await res.arrayBuffer());
      const mimetype = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
      const name = `avatar-${u.id}.${mimetype.split("/")[1]?.replace("jpeg", "jpg") || "jpg"}`;
      const media = await payload.create({
        collection: "media",
        data: { alt: `${u.firstName ?? "Profile"} photo` } as never,
        file: { data, mimetype, name, size: data.length },
        overrideAccess: true,
        req,
      });
      await payload.update({ collection: "users", id: u.id, data: { avatar: media.id, legacyAvatarUrl: null } as never, overrideAccess: true, req, context: { skipAudit: true } });
      payload.logger.info(`[legacy files] photo moved for user ${u.id}`);
    } catch (err) {
      payload.logger.error({ err, user: u.id }, "[legacy files] photo not moved; it stays on the old URL record");
    }
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Nothing to undo: the photos stay in the media library.
}
