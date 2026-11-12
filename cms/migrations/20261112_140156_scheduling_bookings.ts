import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_schedules_weekly_day" AS ENUM('0', '1', '2', '3', '4', '5', '6');
  CREATE TYPE "payload"."enum_bookings_status" AS ENUM('requested', 'confirmed', 'completed', 'declined', 'cancelled', 'expired', 'no_show');
  CREATE TYPE "payload"."enum_bookings_payment_status" AS ENUM('unpaid', 'paid', 'refunded', 'partially_refunded', 'waived');
  CREATE TYPE "payload"."enum_bookings_kind" AS ENUM('trial', 'regular');
  CREATE TYPE "payload"."enum_bookings_cancelled_by" AS ENUM('student', 'tutor', 'staff', 'system');
  CREATE TABLE "payload"."schedules_weekly" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"day" "payload"."enum_schedules_weekly_day" NOT NULL,
  	"start" varchar NOT NULL,
  	"end" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."schedules_time_off" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"from" varchar NOT NULL,
  	"to" varchar NOT NULL,
  	"note" varchar
  );
  
  CREATE TABLE "payload"."schedules" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"user_id" integer NOT NULL,
  	"timezone" varchar DEFAULT 'UTC' NOT NULL,
  	"notice_hours" numeric DEFAULT 12,
  	"buffer_minutes" numeric DEFAULT 0,
  	"instant_booking" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."bookings_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"action" varchar,
  	"by_id" integer,
  	"at" timestamp(3) with time zone,
  	"note" varchar
  );
  
  CREATE TABLE "payload"."bookings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"reference" varchar,
  	"status" "payload"."enum_bookings_status" DEFAULT 'requested' NOT NULL,
  	"payment_status" "payload"."enum_bookings_payment_status" DEFAULT 'unpaid',
  	"starts_at" timestamp(3) with time zone NOT NULL,
  	"ends_at" timestamp(3) with time zone NOT NULL,
  	"student_id" integer NOT NULL,
  	"tutor_id" integer NOT NULL,
  	"tutor_user_id" integer NOT NULL,
  	"subject_id" integer,
  	"kind" "payload"."enum_bookings_kind" DEFAULT 'regular' NOT NULL,
  	"minutes" numeric NOT NULL,
  	"price" numeric NOT NULL,
  	"currency" varchar NOT NULL,
  	"platform_fee_percent" numeric,
  	"student_note" varchar,
  	"student_timezone" varchar,
  	"cancelled_by" "payload"."enum_bookings_cancelled_by",
  	"cancel_reason" varchar,
  	"cancelled_at" timestamp(3) with time zone,
  	"late_cancellation" boolean,
  	"responded_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "schedules_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "bookings_id" integer;
  ALTER TABLE "payload"."platform_settings" ADD COLUMN "booking_window_days" numeric DEFAULT 42;
  ALTER TABLE "payload"."schedules_weekly" ADD CONSTRAINT "schedules_weekly_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."schedules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."schedules_time_off" ADD CONSTRAINT "schedules_time_off_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."schedules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."schedules" ADD CONSTRAINT "schedules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."bookings_history" ADD CONSTRAINT "bookings_history_by_id_users_id_fk" FOREIGN KEY ("by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."bookings_history" ADD CONSTRAINT "bookings_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."bookings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."bookings" ADD CONSTRAINT "bookings_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."bookings" ADD CONSTRAINT "bookings_tutor_id_tutor_profiles_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "payload"."tutor_profiles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."bookings" ADD CONSTRAINT "bookings_tutor_user_id_users_id_fk" FOREIGN KEY ("tutor_user_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."bookings" ADD CONSTRAINT "bookings_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "payload"."subjects"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "schedules_weekly_order_idx" ON "payload"."schedules_weekly" USING btree ("_order");
  CREATE INDEX "schedules_weekly_parent_id_idx" ON "payload"."schedules_weekly" USING btree ("_parent_id");
  CREATE INDEX "schedules_time_off_order_idx" ON "payload"."schedules_time_off" USING btree ("_order");
  CREATE INDEX "schedules_time_off_parent_id_idx" ON "payload"."schedules_time_off" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "schedules_user_idx" ON "payload"."schedules" USING btree ("user_id");
  CREATE INDEX "schedules_updated_at_idx" ON "payload"."schedules" USING btree ("updated_at");
  CREATE INDEX "schedules_created_at_idx" ON "payload"."schedules" USING btree ("created_at");
  CREATE INDEX "bookings_history_order_idx" ON "payload"."bookings_history" USING btree ("_order");
  CREATE INDEX "bookings_history_parent_id_idx" ON "payload"."bookings_history" USING btree ("_parent_id");
  CREATE INDEX "bookings_history_by_idx" ON "payload"."bookings_history" USING btree ("by_id");
  CREATE UNIQUE INDEX "bookings_reference_idx" ON "payload"."bookings" USING btree ("reference");
  CREATE INDEX "bookings_status_idx" ON "payload"."bookings" USING btree ("status");
  CREATE INDEX "bookings_starts_at_idx" ON "payload"."bookings" USING btree ("starts_at");
  CREATE INDEX "bookings_ends_at_idx" ON "payload"."bookings" USING btree ("ends_at");
  CREATE INDEX "bookings_student_idx" ON "payload"."bookings" USING btree ("student_id");
  CREATE INDEX "bookings_tutor_idx" ON "payload"."bookings" USING btree ("tutor_id");
  CREATE INDEX "bookings_tutor_user_idx" ON "payload"."bookings" USING btree ("tutor_user_id");
  CREATE INDEX "bookings_subject_idx" ON "payload"."bookings" USING btree ("subject_id");
  CREATE INDEX "bookings_updated_at_idx" ON "payload"."bookings" USING btree ("updated_at");
  CREATE INDEX "bookings_created_at_idx" ON "payload"."bookings" USING btree ("created_at");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_schedules_fk" FOREIGN KEY ("schedules_id") REFERENCES "payload"."schedules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bookings_fk" FOREIGN KEY ("bookings_id") REFERENCES "payload"."bookings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_schedules_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("schedules_id");
  CREATE INDEX "payload_locked_documents_rels_bookings_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("bookings_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."schedules_weekly" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."schedules_time_off" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."schedules" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."bookings_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."bookings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."schedules_weekly" CASCADE;
  DROP TABLE "payload"."schedules_time_off" CASCADE;
  DROP TABLE "payload"."schedules" CASCADE;
  DROP TABLE "payload"."bookings_history" CASCADE;
  DROP TABLE "payload"."bookings" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_schedules_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_bookings_fk";
  
  DROP INDEX "payload"."payload_locked_documents_rels_schedules_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_bookings_id_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "schedules_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "bookings_id";
  ALTER TABLE "payload"."platform_settings" DROP COLUMN "booking_window_days";
  DROP TYPE "payload"."enum_schedules_weekly_day";
  DROP TYPE "payload"."enum_bookings_status";
  DROP TYPE "payload"."enum_bookings_payment_status";
  DROP TYPE "payload"."enum_bookings_kind";
  DROP TYPE "payload"."enum_bookings_cancelled_by";`)
}
