import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_reviews_highlights" AS ENUM('clear', 'patient', 'prepared', 'encouraging', 'feedback', 'on_time');
  ALTER TYPE "payload"."enum_email_templates_key" ADD VALUE 'rate_lesson' BEFORE 'homework_set';
  CREATE TABLE "payload"."reviews_highlights" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "payload"."enum_reviews_highlights",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  ALTER TABLE "payload"."bookings" ADD COLUMN "review_prompted_at" timestamp(3) with time zone;
  ALTER TABLE "payload"."reviews_highlights" ADD CONSTRAINT "reviews_highlights_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "reviews_highlights_order_idx" ON "payload"."reviews_highlights" USING btree ("order");
  CREATE INDEX "reviews_highlights_parent_idx" ON "payload"."reviews_highlights" USING btree ("parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."reviews_highlights" CASCADE;
  ALTER TABLE "payload"."email_templates" ALTER COLUMN "key" SET DATA TYPE text;
  DROP TYPE "payload"."enum_email_templates_key";
  CREATE TYPE "payload"."enum_email_templates_key" AS ENUM('booking_confirmed_student', 'booking_confirmed_tutor', 'booking_requested_student', 'booking_requested_tutor', 'request_accepted', 'request_declined', 'lesson_cancelled', 'lesson_reminder_day', 'lesson_reminder_hour', 'new_message', 'review_received', 'homework_set', 'homework_submitted', 'homework_reviewed', 'payment_receipt', 'package_receipt', 'refund_issued', 'payout_requested', 'payout_sent', 'application_received', 'application_approved', 'application_changes', 'application_rejected');
  ALTER TABLE "payload"."email_templates" ALTER COLUMN "key" SET DATA TYPE "payload"."enum_email_templates_key" USING "key"::"payload"."enum_email_templates_key";
  ALTER TABLE "payload"."bookings" DROP COLUMN "review_prompted_at";
  DROP TYPE "payload"."enum_reviews_highlights";`)
}
