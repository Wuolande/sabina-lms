import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_bookings_no_show_by" AS ENUM('tutor', 'student');
  CREATE TYPE "payload"."enum_reviews_status" AS ENUM('published', 'hidden');
  CREATE TABLE "payload"."reviews" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"rating" numeric NOT NULL,
  	"status" "payload"."enum_reviews_status" DEFAULT 'published' NOT NULL,
  	"comment" varchar,
  	"tutor_reply" varchar,
  	"booking_id" integer NOT NULL,
  	"tutor_id" integer NOT NULL,
  	"student_id" integer NOT NULL,
  	"student_name" varchar,
  	"subject" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload"."bookings" ADD COLUMN "student_joined_at" timestamp(3) with time zone;
  ALTER TABLE "payload"."bookings" ADD COLUMN "tutor_joined_at" timestamp(3) with time zone;
  ALTER TABLE "payload"."bookings" ADD COLUMN "completed_at" timestamp(3) with time zone;
  ALTER TABLE "payload"."bookings" ADD COLUMN "no_show_by" "payload"."enum_bookings_no_show_by";
  ALTER TABLE "payload"."bookings" ADD COLUMN "tutor_notes" varchar;
  ALTER TABLE "payload"."bookings" ADD COLUMN "issue_text" varchar;
  ALTER TABLE "payload"."bookings" ADD COLUMN "issue_reported_at" timestamp(3) with time zone;
  ALTER TABLE "payload"."bookings" ADD COLUMN "issue_resolved" boolean;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "reviews_id" integer;
  ALTER TABLE "payload"."reviews" ADD CONSTRAINT "reviews_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "payload"."bookings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."reviews" ADD CONSTRAINT "reviews_tutor_id_tutor_profiles_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "payload"."tutor_profiles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."reviews" ADD CONSTRAINT "reviews_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "reviews_status_idx" ON "payload"."reviews" USING btree ("status");
  CREATE UNIQUE INDEX "reviews_booking_idx" ON "payload"."reviews" USING btree ("booking_id");
  CREATE INDEX "reviews_tutor_idx" ON "payload"."reviews" USING btree ("tutor_id");
  CREATE INDEX "reviews_student_idx" ON "payload"."reviews" USING btree ("student_id");
  CREATE INDEX "reviews_updated_at_idx" ON "payload"."reviews" USING btree ("updated_at");
  CREATE INDEX "reviews_created_at_idx" ON "payload"."reviews" USING btree ("created_at");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "payload"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_reviews_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("reviews_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."reviews" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."reviews" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_reviews_fk";
  
  DROP INDEX "payload"."payload_locked_documents_rels_reviews_id_idx";
  ALTER TABLE "payload"."bookings" DROP COLUMN "student_joined_at";
  ALTER TABLE "payload"."bookings" DROP COLUMN "tutor_joined_at";
  ALTER TABLE "payload"."bookings" DROP COLUMN "completed_at";
  ALTER TABLE "payload"."bookings" DROP COLUMN "no_show_by";
  ALTER TABLE "payload"."bookings" DROP COLUMN "tutor_notes";
  ALTER TABLE "payload"."bookings" DROP COLUMN "issue_text";
  ALTER TABLE "payload"."bookings" DROP COLUMN "issue_reported_at";
  ALTER TABLE "payload"."bookings" DROP COLUMN "issue_resolved";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "reviews_id";
  DROP TYPE "payload"."enum_bookings_no_show_by";
  DROP TYPE "payload"."enum_reviews_status";`)
}
