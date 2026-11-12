import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."users" ADD COLUMN "legacy_id" varchar;
  ALTER TABLE "payload"."users" ADD COLUMN "legacy_password_hash" varchar;
  ALTER TABLE "payload"."users" ADD COLUMN "legacy_avatar_url" varchar;
  CREATE INDEX "users_legacy_id_idx" ON "payload"."users" USING btree ("legacy_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "payload"."users_legacy_id_idx";
  ALTER TABLE "payload"."users" DROP COLUMN "legacy_id";
  ALTER TABLE "payload"."users" DROP COLUMN "legacy_password_hash";
  ALTER TABLE "payload"."users" DROP COLUMN "legacy_avatar_url";`)
}
