import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."users" ADD COLUMN "_verified" boolean;
  ALTER TABLE "payload"."users" ADD COLUMN "_verificationtoken" varchar;`)
  // Accounts created before email confirmation existed count as confirmed; otherwise Payload
  // lets them sign in but rejects their session.
  await db.execute(sql`UPDATE "payload"."users" SET "_verified" = true WHERE "_verified" IS NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."users" DROP COLUMN "_verified";
  ALTER TABLE "payload"."users" DROP COLUMN "_verificationtoken";`)
}
