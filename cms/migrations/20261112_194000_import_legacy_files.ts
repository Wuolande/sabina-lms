import type { MigrateDownArgs, MigrateUpArgs } from "@payloadcms/db-postgres";

/** Copies the old platform's profile photos into the media library. See cms/media/legacy-photos.ts. */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  // Without R2 (e.g. local or before storage is set up) the photos wait; housekeeping retries them later.
  const { moveLegacyPhotos } = await import("../media/legacy-photos");
  await moveLegacyPhotos(payload, req);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Nothing to undo: the photos stay in the media library.
}
