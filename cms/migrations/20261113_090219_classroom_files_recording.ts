import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_bookings_recording_status" AS ENUM('none', 'requested', 'recording', 'ready', 'failed');
  ALTER TYPE "payload"."enum_private_files_kind" ADD VALUE 'lesson' BEFORE 'other';
  CREATE TABLE "payload"."bookings_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"private_files_id" integer
  );
  
  ALTER TABLE "payload"."bookings" ADD COLUMN "recording_status" "payload"."enum_bookings_recording_status" DEFAULT 'none';
  ALTER TABLE "payload"."bookings" ADD COLUMN "recording_started_at" timestamp(3) with time zone;
  ALTER TABLE "payload"."bookings" ADD COLUMN "recording_ended_at" timestamp(3) with time zone;
  ALTER TABLE "payload"."bookings" ADD COLUMN "recording_consent_student_at" timestamp(3) with time zone;
  ALTER TABLE "payload"."bookings" ADD COLUMN "recording_consent_tutor_at" timestamp(3) with time zone;
  ALTER TABLE "payload"."bookings" ADD COLUMN "recording_egress_id" varchar;
  ALTER TABLE "payload"."bookings" ADD COLUMN "recording_file_key" varchar;
  ALTER TABLE "payload"."platform_settings" ADD COLUMN "recording_enabled" boolean DEFAULT false;
  ALTER TABLE "payload"."bookings_rels" ADD CONSTRAINT "bookings_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."bookings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."bookings_rels" ADD CONSTRAINT "bookings_rels_private_files_fk" FOREIGN KEY ("private_files_id") REFERENCES "payload"."private_files"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "bookings_rels_order_idx" ON "payload"."bookings_rels" USING btree ("order");
  CREATE INDEX "bookings_rels_parent_idx" ON "payload"."bookings_rels" USING btree ("parent_id");
  CREATE INDEX "bookings_rels_path_idx" ON "payload"."bookings_rels" USING btree ("path");
  CREATE INDEX "bookings_rels_private_files_id_idx" ON "payload"."bookings_rels" USING btree ("private_files_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."bookings_rels" CASCADE;
  ALTER TABLE "payload"."private_files" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "payload"."private_files" ALTER COLUMN "kind" SET DEFAULT 'other'::text;
  DROP TYPE "payload"."enum_private_files_kind";
  CREATE TYPE "payload"."enum_private_files_kind" AS ENUM('identity', 'degree', 'certificate', 'homework', 'other');
  ALTER TABLE "payload"."private_files" ALTER COLUMN "kind" SET DEFAULT 'other'::"payload"."enum_private_files_kind";
  ALTER TABLE "payload"."private_files" ALTER COLUMN "kind" SET DATA TYPE "payload"."enum_private_files_kind" USING "kind"::"payload"."enum_private_files_kind";
  ALTER TABLE "payload"."bookings" DROP COLUMN "recording_status";
  ALTER TABLE "payload"."bookings" DROP COLUMN "recording_started_at";
  ALTER TABLE "payload"."bookings" DROP COLUMN "recording_ended_at";
  ALTER TABLE "payload"."bookings" DROP COLUMN "recording_consent_student_at";
  ALTER TABLE "payload"."bookings" DROP COLUMN "recording_consent_tutor_at";
  ALTER TABLE "payload"."bookings" DROP COLUMN "recording_egress_id";
  ALTER TABLE "payload"."bookings" DROP COLUMN "recording_file_key";
  ALTER TABLE "payload"."platform_settings" DROP COLUMN "recording_enabled";
  DROP TYPE "payload"."enum_bookings_recording_status";`)
}
