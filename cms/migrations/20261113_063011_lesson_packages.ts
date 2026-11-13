import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_tutor_profiles_packages_lessons" AS ENUM('5', '10', '20');
  CREATE TYPE "payload"."enum_lesson_packages_status" AS ENUM('pending_payment', 'active', 'used_up', 'expired', 'refunded', 'cancelled');
  ALTER TYPE "payload"."enum_email_templates_key" ADD VALUE 'package_receipt' BEFORE 'refund_issued';
  CREATE TABLE "payload"."tutor_profiles_packages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"lessons" "payload"."enum_tutor_profiles_packages_lessons" NOT NULL,
  	"discount_percent" numeric NOT NULL
  );
  
  CREATE TABLE "payload"."lesson_packages_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"action" varchar,
  	"by_id" integer,
  	"at" timestamp(3) with time zone,
  	"note" varchar
  );
  
  CREATE TABLE "payload"."lesson_packages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"reference" varchar NOT NULL,
  	"status" "payload"."enum_lesson_packages_status" DEFAULT 'pending_payment' NOT NULL,
  	"expires_at" timestamp(3) with time zone,
  	"paid_at" timestamp(3) with time zone,
  	"refunded_amount" numeric DEFAULT 0,
  	"student_id" integer NOT NULL,
  	"tutor_id" integer NOT NULL,
  	"tutor_user_id" integer NOT NULL,
  	"lessons" numeric NOT NULL,
  	"minutes" numeric NOT NULL,
  	"discount_percent" numeric DEFAULT 0,
  	"platform_fee_percent" numeric,
  	"price" numeric NOT NULL,
  	"per_lesson" numeric NOT NULL,
  	"currency" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload"."payments" ALTER COLUMN "booking_id" DROP NOT NULL;
  ALTER TABLE "payload"."bookings" ADD COLUMN "package_id" integer;
  ALTER TABLE "payload"."payments" ADD COLUMN "package_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "lesson_packages_id" integer;
  ALTER TABLE "payload"."platform_settings" ADD COLUMN "packages_enabled" boolean DEFAULT true;
  ALTER TABLE "payload"."platform_settings" ADD COLUMN "package_max_discount_percent" numeric DEFAULT 25;
  ALTER TABLE "payload"."platform_settings" ADD COLUMN "package_validity_days" numeric DEFAULT 180;
  ALTER TABLE "payload"."tutor_profiles_packages" ADD CONSTRAINT "tutor_profiles_packages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."tutor_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."lesson_packages_history" ADD CONSTRAINT "lesson_packages_history_by_id_users_id_fk" FOREIGN KEY ("by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."lesson_packages_history" ADD CONSTRAINT "lesson_packages_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."lesson_packages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."lesson_packages" ADD CONSTRAINT "lesson_packages_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."lesson_packages" ADD CONSTRAINT "lesson_packages_tutor_id_tutor_profiles_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "payload"."tutor_profiles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."lesson_packages" ADD CONSTRAINT "lesson_packages_tutor_user_id_users_id_fk" FOREIGN KEY ("tutor_user_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "tutor_profiles_packages_order_idx" ON "payload"."tutor_profiles_packages" USING btree ("_order");
  CREATE INDEX "tutor_profiles_packages_parent_id_idx" ON "payload"."tutor_profiles_packages" USING btree ("_parent_id");
  CREATE INDEX "lesson_packages_history_order_idx" ON "payload"."lesson_packages_history" USING btree ("_order");
  CREATE INDEX "lesson_packages_history_parent_id_idx" ON "payload"."lesson_packages_history" USING btree ("_parent_id");
  CREATE INDEX "lesson_packages_history_by_idx" ON "payload"."lesson_packages_history" USING btree ("by_id");
  CREATE UNIQUE INDEX "lesson_packages_reference_idx" ON "payload"."lesson_packages" USING btree ("reference");
  CREATE INDEX "lesson_packages_status_idx" ON "payload"."lesson_packages" USING btree ("status");
  CREATE INDEX "lesson_packages_expires_at_idx" ON "payload"."lesson_packages" USING btree ("expires_at");
  CREATE INDEX "lesson_packages_student_idx" ON "payload"."lesson_packages" USING btree ("student_id");
  CREATE INDEX "lesson_packages_tutor_idx" ON "payload"."lesson_packages" USING btree ("tutor_id");
  CREATE INDEX "lesson_packages_tutor_user_idx" ON "payload"."lesson_packages" USING btree ("tutor_user_id");
  CREATE INDEX "lesson_packages_updated_at_idx" ON "payload"."lesson_packages" USING btree ("updated_at");
  CREATE INDEX "lesson_packages_created_at_idx" ON "payload"."lesson_packages" USING btree ("created_at");
  ALTER TABLE "payload"."bookings" ADD CONSTRAINT "bookings_package_id_lesson_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "payload"."lesson_packages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."payments" ADD CONSTRAINT "payments_package_id_lesson_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "payload"."lesson_packages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lesson_packages_fk" FOREIGN KEY ("lesson_packages_id") REFERENCES "payload"."lesson_packages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "bookings_package_idx" ON "payload"."bookings" USING btree ("package_id");
  CREATE INDEX "payments_package_idx" ON "payload"."payments" USING btree ("package_id");
  CREATE INDEX "payload_locked_documents_rels_lesson_packages_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("lesson_packages_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."tutor_profiles_packages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."lesson_packages_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."lesson_packages" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."tutor_profiles_packages" CASCADE;
  DROP TABLE "payload"."lesson_packages_history" CASCADE;
  DROP TABLE "payload"."lesson_packages" CASCADE;
  ALTER TABLE "payload"."bookings" DROP CONSTRAINT "bookings_package_id_lesson_packages_id_fk";
  
  ALTER TABLE "payload"."payments" DROP CONSTRAINT "payments_package_id_lesson_packages_id_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_lesson_packages_fk";
  
  ALTER TABLE "payload"."email_templates" ALTER COLUMN "key" SET DATA TYPE text;
  DROP TYPE "payload"."enum_email_templates_key";
  CREATE TYPE "payload"."enum_email_templates_key" AS ENUM('booking_confirmed_student', 'booking_confirmed_tutor', 'booking_requested_student', 'booking_requested_tutor', 'request_accepted', 'request_declined', 'lesson_cancelled', 'lesson_reminder_day', 'lesson_reminder_hour', 'new_message', 'review_received', 'payment_receipt', 'refund_issued', 'payout_requested', 'payout_sent', 'application_received', 'application_approved', 'application_changes', 'application_rejected');
  ALTER TABLE "payload"."email_templates" ALTER COLUMN "key" SET DATA TYPE "payload"."enum_email_templates_key" USING "key"::"payload"."enum_email_templates_key";
  DROP INDEX "payload"."bookings_package_idx";
  DROP INDEX "payload"."payments_package_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_lesson_packages_id_idx";
  ALTER TABLE "payload"."payments" ALTER COLUMN "booking_id" SET NOT NULL;
  ALTER TABLE "payload"."bookings" DROP COLUMN "package_id";
  ALTER TABLE "payload"."payments" DROP COLUMN "package_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "lesson_packages_id";
  ALTER TABLE "payload"."platform_settings" DROP COLUMN "packages_enabled";
  ALTER TABLE "payload"."platform_settings" DROP COLUMN "package_max_discount_percent";
  ALTER TABLE "payload"."platform_settings" DROP COLUMN "package_validity_days";
  DROP TYPE "payload"."enum_tutor_profiles_packages_lessons";
  DROP TYPE "payload"."enum_lesson_packages_status";`)
}
