import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."site_settings" ALTER COLUMN "brand_colours_primary" SET DEFAULT '#0000FE';
  ALTER TABLE "payload"."site_settings" ALTER COLUMN "brand_colours_primary_light" SET DEFAULT '#009EFF';
  ALTER TABLE "payload"."site_settings" ALTER COLUMN "brand_colours_primary_dark" SET DEFAULT '#00007A';
  ALTER TABLE "payload"."site_settings" ALTER COLUMN "brand_colours_accent" SET DEFAULT '#009EFF';
  ALTER TABLE "payload"."site_settings" ALTER COLUMN "brand_colours_accent_dark" SET DEFAULT '#0077C2';
  -- Move saved colours from the old brand to the new one. Colours an admin changed are left alone.
  UPDATE "payload"."site_settings" SET "brand_colours_primary" = '#0000FE' WHERE upper("brand_colours_primary") = '#14209C' OR "brand_colours_primary" IS NULL;
  UPDATE "payload"."site_settings" SET "brand_colours_primary_light" = '#009EFF' WHERE upper("brand_colours_primary_light") = '#2A4ED6' OR "brand_colours_primary_light" IS NULL;
  UPDATE "payload"."site_settings" SET "brand_colours_primary_dark" = '#00007A' WHERE upper("brand_colours_primary_dark") = '#0B123E' OR "brand_colours_primary_dark" IS NULL;
  UPDATE "payload"."site_settings" SET "brand_colours_accent" = '#009EFF' WHERE upper("brand_colours_accent") = '#F9C31C' OR "brand_colours_accent" IS NULL;
  UPDATE "payload"."site_settings" SET "brand_colours_accent_dark" = '#0077C2' WHERE upper("brand_colours_accent_dark") = '#C77F02' OR "brand_colours_accent_dark" IS NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."site_settings" ALTER COLUMN "brand_colours_primary" SET DEFAULT '#14209C';
  ALTER TABLE "payload"."site_settings" ALTER COLUMN "brand_colours_primary_light" SET DEFAULT '#2A4ED6';
  ALTER TABLE "payload"."site_settings" ALTER COLUMN "brand_colours_primary_dark" SET DEFAULT '#0B123E';
  ALTER TABLE "payload"."site_settings" ALTER COLUMN "brand_colours_accent" SET DEFAULT '#F9C31C';
  ALTER TABLE "payload"."site_settings" ALTER COLUMN "brand_colours_accent_dark" SET DEFAULT '#C77F02';`)
}
