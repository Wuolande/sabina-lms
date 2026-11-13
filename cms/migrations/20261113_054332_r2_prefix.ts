import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/** Storage columns the R2 plugin needs on the file tables (where in the bucket each file lives). */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."media" ADD COLUMN IF NOT EXISTS "prefix" varchar DEFAULT 'media';
  ALTER TABLE "payload"."media" ADD COLUMN IF NOT EXISTS "_objectkey" varchar;
  ALTER TABLE "payload"."private_files" ADD COLUMN IF NOT EXISTS "prefix" varchar DEFAULT 'private';
  ALTER TABLE "payload"."private_files" ADD COLUMN IF NOT EXISTS "_objectkey" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."media" DROP COLUMN IF EXISTS "prefix";
  ALTER TABLE "payload"."media" DROP COLUMN IF EXISTS "_objectkey";
  ALTER TABLE "payload"."private_files" DROP COLUMN IF EXISTS "prefix";
  ALTER TABLE "payload"."private_files" DROP COLUMN IF EXISTS "_objectkey";`)
}
