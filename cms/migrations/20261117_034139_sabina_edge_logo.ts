import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."site_settings" ALTER COLUMN "platform_name" SET DEFAULT 'Sabina Edge';
  ALTER TABLE "payload"."site_settings" ALTER COLUMN "tagline" SET DEFAULT 'Building minds. Impacting lives.';
  ALTER TABLE "payload"."site_settings" ADD COLUMN "brand_colours_gold" varchar DEFAULT '#FCC10D';
  ALTER TABLE "payload"."site_settings" ALTER COLUMN "brand_colours_primary" SET DEFAULT '#1800AB';
  ALTER TABLE "payload"."site_settings" ALTER COLUMN "brand_colours_primary_light" SET DEFAULT '#2D419B';
  ALTER TABLE "payload"."site_settings" ALTER COLUMN "brand_colours_primary_dark" SET DEFAULT '#06368F';
  ALTER TABLE "payload"."site_settings" ALTER COLUMN "brand_colours_accent" SET DEFAULT '#FCC10D';
  ALTER TABLE "payload"."site_settings" ALTER COLUMN "brand_colours_accent_dark" SET DEFAULT '#C99400';
  -- Move the saved name and tagline to the Sabina Edge brand if they were never changed.
  UPDATE "payload"."site_settings" SET "platform_name" = 'Sabina Edge' WHERE "platform_name" = 'Sabina Education' OR "platform_name" IS NULL;
  UPDATE "payload"."site_settings" SET "tagline" = 'Building minds. Impacting lives.' WHERE "tagline" = 'Learn from verified tutors, live.' OR "tagline" IS NULL;
  -- Brand colours from the Sabina Edge logo, where the saved colours are still an earlier default.
  UPDATE "payload"."site_settings" SET "brand_colours_primary" = '#1800AB' WHERE upper("brand_colours_primary") IN ('#0000FE', '#14209C') OR "brand_colours_primary" IS NULL;
  UPDATE "payload"."site_settings" SET "brand_colours_primary_light" = '#2D419B' WHERE upper("brand_colours_primary_light") IN ('#009EFF', '#2A4ED6') OR "brand_colours_primary_light" IS NULL;
  UPDATE "payload"."site_settings" SET "brand_colours_primary_dark" = '#06368F' WHERE upper("brand_colours_primary_dark") IN ('#00007A', '#0B123E') OR "brand_colours_primary_dark" IS NULL;
  UPDATE "payload"."site_settings" SET "brand_colours_accent" = '#FCC10D' WHERE upper("brand_colours_accent") IN ('#009EFF', '#F9C31C') OR "brand_colours_accent" IS NULL;
  UPDATE "payload"."site_settings" SET "brand_colours_accent_dark" = '#C99400' WHERE upper("brand_colours_accent_dark") IN ('#0077C2', '#C77F02') OR "brand_colours_accent_dark" IS NULL;
  UPDATE "payload"."site_settings" SET "brand_colours_gold" = '#FCC10D' WHERE upper("brand_colours_gold") = '#FDC005' OR "brand_colours_gold" IS NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."site_settings" ALTER COLUMN "platform_name" SET DEFAULT 'Sabina Education';
  ALTER TABLE "payload"."site_settings" ALTER COLUMN "tagline" SET DEFAULT 'Learn from verified tutors, live.';
  ALTER TABLE "payload"."site_settings" DROP COLUMN "brand_colours_gold";`)
}
