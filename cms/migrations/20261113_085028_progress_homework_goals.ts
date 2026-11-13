import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_assignments_questions_type" AS ENUM('choice', 'short');
  CREATE TYPE "payload"."enum_assignments_kind" AS ENUM('homework', 'quiz');
  CREATE TYPE "payload"."enum_assignments_status" AS ENUM('assigned', 'submitted', 'reviewed');
  CREATE TYPE "payload"."enum_goals_status" AS ENUM('active', 'achieved', 'archived');
  ALTER TYPE "payload"."enum_email_templates_key" ADD VALUE 'homework_set' BEFORE 'payment_receipt';
  ALTER TYPE "payload"."enum_email_templates_key" ADD VALUE 'homework_submitted' BEFORE 'payment_receipt';
  ALTER TYPE "payload"."enum_email_templates_key" ADD VALUE 'homework_reviewed' BEFORE 'payment_receipt';
  ALTER TYPE "payload"."enum_private_files_kind" ADD VALUE 'homework' BEFORE 'other';
  CREATE TABLE "payload"."assignments_questions_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "payload"."assignments_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"prompt" varchar,
  	"type" "payload"."enum_assignments_questions_type" DEFAULT 'choice',
  	"correct" numeric,
  	"accepted" varchar,
  	"explanation" varchar
  );
  
  CREATE TABLE "payload"."assignments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"kind" "payload"."enum_assignments_kind" DEFAULT 'homework' NOT NULL,
  	"status" "payload"."enum_assignments_status" DEFAULT 'assigned' NOT NULL,
  	"due_at" timestamp(3) with time zone,
  	"student_id" integer NOT NULL,
  	"tutor_user_id" integer NOT NULL,
  	"subject_id" integer,
  	"lesson_id" integer,
  	"instructions" jsonb,
  	"answer" jsonb,
  	"responses" jsonb,
  	"submitted_at" timestamp(3) with time zone,
  	"score" numeric,
  	"out_of" numeric,
  	"feedback" jsonb,
  	"reviewed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."assignments_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"private_files_id" integer
  );
  
  CREATE TABLE "payload"."goals_milestones" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"done" boolean DEFAULT false,
  	"done_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."goals" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"student_id" integer NOT NULL,
  	"status" "payload"."enum_goals_status" DEFAULT 'active' NOT NULL,
  	"target_date" timestamp(3) with time zone,
  	"subject_id" integer,
  	"created_by_id" integer,
  	"achieved_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload"."student_profiles" ADD COLUMN "share_token" varchar;
  ALTER TABLE "payload"."student_profiles" ADD COLUMN "share_created_at" timestamp(3) with time zone;
  ALTER TABLE "payload"."student_profiles" ADD COLUMN "parent_email" varchar;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "assignments_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "goals_id" integer;
  ALTER TABLE "payload"."assignments_questions_options" ADD CONSTRAINT "assignments_questions_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."assignments_questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."assignments_questions" ADD CONSTRAINT "assignments_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."assignments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."assignments" ADD CONSTRAINT "assignments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."assignments" ADD CONSTRAINT "assignments_tutor_user_id_users_id_fk" FOREIGN KEY ("tutor_user_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."assignments" ADD CONSTRAINT "assignments_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "payload"."subjects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."assignments" ADD CONSTRAINT "assignments_lesson_id_bookings_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "payload"."bookings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."assignments_rels" ADD CONSTRAINT "assignments_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."assignments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."assignments_rels" ADD CONSTRAINT "assignments_rels_private_files_fk" FOREIGN KEY ("private_files_id") REFERENCES "payload"."private_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."goals_milestones" ADD CONSTRAINT "goals_milestones_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."goals"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."goals" ADD CONSTRAINT "goals_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."goals" ADD CONSTRAINT "goals_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "payload"."subjects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."goals" ADD CONSTRAINT "goals_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "assignments_questions_options_order_idx" ON "payload"."assignments_questions_options" USING btree ("_order");
  CREATE INDEX "assignments_questions_options_parent_id_idx" ON "payload"."assignments_questions_options" USING btree ("_parent_id");
  CREATE INDEX "assignments_questions_order_idx" ON "payload"."assignments_questions" USING btree ("_order");
  CREATE INDEX "assignments_questions_parent_id_idx" ON "payload"."assignments_questions" USING btree ("_parent_id");
  CREATE INDEX "assignments_status_idx" ON "payload"."assignments" USING btree ("status");
  CREATE INDEX "assignments_due_at_idx" ON "payload"."assignments" USING btree ("due_at");
  CREATE INDEX "assignments_student_idx" ON "payload"."assignments" USING btree ("student_id");
  CREATE INDEX "assignments_tutor_user_idx" ON "payload"."assignments" USING btree ("tutor_user_id");
  CREATE INDEX "assignments_subject_idx" ON "payload"."assignments" USING btree ("subject_id");
  CREATE INDEX "assignments_lesson_idx" ON "payload"."assignments" USING btree ("lesson_id");
  CREATE INDEX "assignments_updated_at_idx" ON "payload"."assignments" USING btree ("updated_at");
  CREATE INDEX "assignments_created_at_idx" ON "payload"."assignments" USING btree ("created_at");
  CREATE INDEX "assignments_rels_order_idx" ON "payload"."assignments_rels" USING btree ("order");
  CREATE INDEX "assignments_rels_parent_idx" ON "payload"."assignments_rels" USING btree ("parent_id");
  CREATE INDEX "assignments_rels_path_idx" ON "payload"."assignments_rels" USING btree ("path");
  CREATE INDEX "assignments_rels_private_files_id_idx" ON "payload"."assignments_rels" USING btree ("private_files_id");
  CREATE INDEX "goals_milestones_order_idx" ON "payload"."goals_milestones" USING btree ("_order");
  CREATE INDEX "goals_milestones_parent_id_idx" ON "payload"."goals_milestones" USING btree ("_parent_id");
  CREATE INDEX "goals_student_idx" ON "payload"."goals" USING btree ("student_id");
  CREATE INDEX "goals_status_idx" ON "payload"."goals" USING btree ("status");
  CREATE INDEX "goals_subject_idx" ON "payload"."goals" USING btree ("subject_id");
  CREATE INDEX "goals_created_by_idx" ON "payload"."goals" USING btree ("created_by_id");
  CREATE INDEX "goals_updated_at_idx" ON "payload"."goals" USING btree ("updated_at");
  CREATE INDEX "goals_created_at_idx" ON "payload"."goals" USING btree ("created_at");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_assignments_fk" FOREIGN KEY ("assignments_id") REFERENCES "payload"."assignments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_goals_fk" FOREIGN KEY ("goals_id") REFERENCES "payload"."goals"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "student_profiles_share_token_idx" ON "payload"."student_profiles" USING btree ("share_token");
  CREATE INDEX "payload_locked_documents_rels_assignments_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("assignments_id");
  CREATE INDEX "payload_locked_documents_rels_goals_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("goals_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."assignments_questions_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."assignments_questions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."assignments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."assignments_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."goals_milestones" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."goals" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."assignments_questions_options" CASCADE;
  DROP TABLE "payload"."assignments_questions" CASCADE;
  DROP TABLE "payload"."assignments" CASCADE;
  DROP TABLE "payload"."assignments_rels" CASCADE;
  DROP TABLE "payload"."goals_milestones" CASCADE;
  DROP TABLE "payload"."goals" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_assignments_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_goals_fk";
  
  ALTER TABLE "payload"."email_templates" ALTER COLUMN "key" SET DATA TYPE text;
  DROP TYPE "payload"."enum_email_templates_key";
  CREATE TYPE "payload"."enum_email_templates_key" AS ENUM('booking_confirmed_student', 'booking_confirmed_tutor', 'booking_requested_student', 'booking_requested_tutor', 'request_accepted', 'request_declined', 'lesson_cancelled', 'lesson_reminder_day', 'lesson_reminder_hour', 'new_message', 'review_received', 'payment_receipt', 'package_receipt', 'refund_issued', 'payout_requested', 'payout_sent', 'application_received', 'application_approved', 'application_changes', 'application_rejected');
  ALTER TABLE "payload"."email_templates" ALTER COLUMN "key" SET DATA TYPE "payload"."enum_email_templates_key" USING "key"::"payload"."enum_email_templates_key";
  ALTER TABLE "payload"."private_files" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "payload"."private_files" ALTER COLUMN "kind" SET DEFAULT 'other'::text;
  DROP TYPE "payload"."enum_private_files_kind";
  CREATE TYPE "payload"."enum_private_files_kind" AS ENUM('identity', 'degree', 'certificate', 'other');
  ALTER TABLE "payload"."private_files" ALTER COLUMN "kind" SET DEFAULT 'other'::"payload"."enum_private_files_kind";
  ALTER TABLE "payload"."private_files" ALTER COLUMN "kind" SET DATA TYPE "payload"."enum_private_files_kind" USING "kind"::"payload"."enum_private_files_kind";
  DROP INDEX "payload"."student_profiles_share_token_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_assignments_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_goals_id_idx";
  ALTER TABLE "payload"."student_profiles" DROP COLUMN "share_token";
  ALTER TABLE "payload"."student_profiles" DROP COLUMN "share_created_at";
  ALTER TABLE "payload"."student_profiles" DROP COLUMN "parent_email";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "assignments_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "goals_id";
  DROP TYPE "payload"."enum_assignments_questions_type";
  DROP TYPE "payload"."enum_assignments_kind";
  DROP TYPE "payload"."enum_assignments_status";
  DROP TYPE "payload"."enum_goals_status";`)
}
