import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_tutor_profiles_languages_level" AS ENUM('native', 'c2', 'c1', 'b2', 'b1', 'a2');
  CREATE TYPE "payload"."enum_tutor_profiles_levels_taught" AS ENUM('primary', 'secondary', 'university', 'adult', 'exam');
  CREATE TYPE "payload"."enum_tutor_profiles_review_history_action" AS ENUM('draft', 'submitted', 'changes_requested', 'approved', 'rejected', 'suspended');
  CREATE TYPE "payload"."enum_tutor_profiles_identity_document_type" AS ENUM('passport', 'national_id', 'drivers_license');
  CREATE TYPE "payload"."enum_tutor_profiles_status" AS ENUM('draft', 'submitted', 'changes_requested', 'approved', 'rejected', 'suspended');
  CREATE TYPE "payload"."enum_student_profiles_goal" AS ENUM('exam', 'school', 'career', 'conversation', 'hobby', 'child');
  CREATE TYPE "payload"."enum_student_profiles_level" AS ENUM('beginner', 'elementary', 'intermediate', 'advanced');
  CREATE TYPE "payload"."enum_student_profiles_pace" AS ENUM('1', '2-3', '4+', 'unsure');
  CREATE TYPE "payload"."enum_subjects_category" AS ENUM('languages', 'mathematics', 'sciences', 'exam-prep', 'coding', 'humanities', 'business', 'arts');
  CREATE TYPE "payload"."enum_private_files_kind" AS ENUM('identity', 'degree', 'certificate', 'other');
  CREATE TYPE "payload"."enum_platform_settings_currency" AS ENUM('USD', 'KES', 'EUR', 'GBP');
  CREATE TABLE "payload"."tutor_profiles_languages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"language_id" integer NOT NULL,
  	"level" "payload"."enum_tutor_profiles_languages_level" NOT NULL
  );
  
  CREATE TABLE "payload"."tutor_profiles_levels_taught" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "payload"."enum_tutor_profiles_levels_taught",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "payload"."tutor_profiles_education" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"degree" varchar NOT NULL,
  	"institution" varchar NOT NULL,
  	"field" varchar,
  	"start_year" numeric,
  	"end_year" numeric,
  	"document_id" integer,
  	"verified" boolean DEFAULT false
  );
  
  CREATE TABLE "payload"."tutor_profiles_certifications" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"issuer" varchar NOT NULL,
  	"year" numeric,
  	"credential_id" varchar,
  	"document_id" integer,
  	"verified" boolean DEFAULT false
  );
  
  CREATE TABLE "payload"."tutor_profiles_experience" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"role" varchar NOT NULL,
  	"organization" varchar NOT NULL,
  	"start_year" numeric,
  	"end_year" numeric,
  	"description" varchar
  );
  
  CREATE TABLE "payload"."tutor_profiles_review_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"action" "payload"."enum_tutor_profiles_review_history_action",
  	"notes" varchar,
  	"at" timestamp(3) with time zone,
  	"by_id" integer
  );
  
  CREATE TABLE "payload"."tutor_profiles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"headline" varchar,
  	"about" varchar,
  	"teaching_style" varchar,
  	"intro_video_url" varchar,
  	"primary_subject_id" integer,
  	"hourly_rate" numeric,
  	"offers_trial" boolean DEFAULT true,
  	"instant_booking" boolean DEFAULT true,
  	"notice_hours" numeric DEFAULT 12,
  	"identity_document_type" "payload"."enum_tutor_profiles_identity_document_type",
  	"identity_document_id" integer,
  	"identity_verified" boolean DEFAULT false,
  	"review_notes" varchar,
  	"internal_notes" varchar,
  	"status" "payload"."enum_tutor_profiles_status" DEFAULT 'draft' NOT NULL,
  	"user_id" integer NOT NULL,
  	"display_name" varchar,
  	"photo_id" integer,
  	"slug" varchar,
  	"country" varchar,
  	"timezone" varchar,
  	"submitted_at" timestamp(3) with time zone,
  	"approved_at" timestamp(3) with time zone,
  	"is_featured" boolean DEFAULT false,
  	"is_super_tutor" boolean DEFAULT false,
  	"stats_rating" numeric DEFAULT 0,
  	"stats_review_count" numeric DEFAULT 0,
  	"stats_lessons_taught" numeric DEFAULT 0,
  	"stats_students_taught" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."tutor_profiles_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"subjects_id" integer
  );
  
  CREATE TABLE "payload"."student_profiles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"display_name" varchar,
  	"goal" "payload"."enum_student_profiles_goal",
  	"level" "payload"."enum_student_profiles_level",
  	"pace" "payload"."enum_student_profiles_pace",
  	"budget_min" numeric,
  	"budget_max" numeric,
  	"goal_details" varchar,
  	"onboarded_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."student_profiles_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"subjects_id" integer,
  	"languages_id" integer,
  	"tutor_profiles_id" integer
  );
  
  CREATE TABLE "payload"."subjects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"category" "payload"."enum_subjects_category" NOT NULL,
  	"description" varchar,
  	"icon" varchar,
  	"is_active" boolean DEFAULT true,
  	"is_featured" boolean DEFAULT false,
  	"sort_order" numeric DEFAULT 100,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."languages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"code" varchar NOT NULL,
  	"native_name" varchar,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."private_files" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"owner_id" integer NOT NULL,
  	"kind" "payload"."enum_private_files_kind" DEFAULT 'other' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "payload"."platform_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"currency" "payload"."enum_platform_settings_currency" DEFAULT 'USD',
  	"platform_fee_percent" numeric DEFAULT 18,
  	"max_subjects_per_tutor" numeric DEFAULT 5,
  	"tutor_min_hourly_rate" numeric DEFAULT 10,
  	"tutor_max_hourly_rate" numeric DEFAULT 250,
  	"trial_lesson_minutes" numeric DEFAULT 30,
  	"trial_lesson_discount_percent" numeric DEFAULT 30,
  	"cancellation_refund_hours" numeric DEFAULT 24,
  	"classroom_early_join_minutes" numeric DEFAULT 15,
  	"instant_booking_enabled" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "tutor_profiles_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "student_profiles_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "subjects_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "languages_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "private_files_id" integer;
  ALTER TABLE "payload"."tutor_profiles_languages" ADD CONSTRAINT "tutor_profiles_languages_language_id_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "payload"."languages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."tutor_profiles_languages" ADD CONSTRAINT "tutor_profiles_languages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."tutor_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."tutor_profiles_levels_taught" ADD CONSTRAINT "tutor_profiles_levels_taught_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."tutor_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."tutor_profiles_education" ADD CONSTRAINT "tutor_profiles_education_document_id_private_files_id_fk" FOREIGN KEY ("document_id") REFERENCES "payload"."private_files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."tutor_profiles_education" ADD CONSTRAINT "tutor_profiles_education_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."tutor_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."tutor_profiles_certifications" ADD CONSTRAINT "tutor_profiles_certifications_document_id_private_files_id_fk" FOREIGN KEY ("document_id") REFERENCES "payload"."private_files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."tutor_profiles_certifications" ADD CONSTRAINT "tutor_profiles_certifications_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."tutor_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."tutor_profiles_experience" ADD CONSTRAINT "tutor_profiles_experience_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."tutor_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."tutor_profiles_review_history" ADD CONSTRAINT "tutor_profiles_review_history_by_id_users_id_fk" FOREIGN KEY ("by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."tutor_profiles_review_history" ADD CONSTRAINT "tutor_profiles_review_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."tutor_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."tutor_profiles" ADD CONSTRAINT "tutor_profiles_primary_subject_id_subjects_id_fk" FOREIGN KEY ("primary_subject_id") REFERENCES "payload"."subjects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."tutor_profiles" ADD CONSTRAINT "tutor_profiles_identity_document_id_private_files_id_fk" FOREIGN KEY ("identity_document_id") REFERENCES "payload"."private_files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."tutor_profiles" ADD CONSTRAINT "tutor_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."tutor_profiles" ADD CONSTRAINT "tutor_profiles_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."tutor_profiles_rels" ADD CONSTRAINT "tutor_profiles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."tutor_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."tutor_profiles_rels" ADD CONSTRAINT "tutor_profiles_rels_subjects_fk" FOREIGN KEY ("subjects_id") REFERENCES "payload"."subjects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."student_profiles" ADD CONSTRAINT "student_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."student_profiles_rels" ADD CONSTRAINT "student_profiles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."student_profiles_rels" ADD CONSTRAINT "student_profiles_rels_subjects_fk" FOREIGN KEY ("subjects_id") REFERENCES "payload"."subjects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."student_profiles_rels" ADD CONSTRAINT "student_profiles_rels_languages_fk" FOREIGN KEY ("languages_id") REFERENCES "payload"."languages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."student_profiles_rels" ADD CONSTRAINT "student_profiles_rels_tutor_profiles_fk" FOREIGN KEY ("tutor_profiles_id") REFERENCES "payload"."tutor_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."private_files" ADD CONSTRAINT "private_files_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "tutor_profiles_languages_order_idx" ON "payload"."tutor_profiles_languages" USING btree ("_order");
  CREATE INDEX "tutor_profiles_languages_parent_id_idx" ON "payload"."tutor_profiles_languages" USING btree ("_parent_id");
  CREATE INDEX "tutor_profiles_languages_language_idx" ON "payload"."tutor_profiles_languages" USING btree ("language_id");
  CREATE INDEX "tutor_profiles_levels_taught_order_idx" ON "payload"."tutor_profiles_levels_taught" USING btree ("order");
  CREATE INDEX "tutor_profiles_levels_taught_parent_idx" ON "payload"."tutor_profiles_levels_taught" USING btree ("parent_id");
  CREATE INDEX "tutor_profiles_education_order_idx" ON "payload"."tutor_profiles_education" USING btree ("_order");
  CREATE INDEX "tutor_profiles_education_parent_id_idx" ON "payload"."tutor_profiles_education" USING btree ("_parent_id");
  CREATE INDEX "tutor_profiles_education_document_idx" ON "payload"."tutor_profiles_education" USING btree ("document_id");
  CREATE INDEX "tutor_profiles_certifications_order_idx" ON "payload"."tutor_profiles_certifications" USING btree ("_order");
  CREATE INDEX "tutor_profiles_certifications_parent_id_idx" ON "payload"."tutor_profiles_certifications" USING btree ("_parent_id");
  CREATE INDEX "tutor_profiles_certifications_document_idx" ON "payload"."tutor_profiles_certifications" USING btree ("document_id");
  CREATE INDEX "tutor_profiles_experience_order_idx" ON "payload"."tutor_profiles_experience" USING btree ("_order");
  CREATE INDEX "tutor_profiles_experience_parent_id_idx" ON "payload"."tutor_profiles_experience" USING btree ("_parent_id");
  CREATE INDEX "tutor_profiles_review_history_order_idx" ON "payload"."tutor_profiles_review_history" USING btree ("_order");
  CREATE INDEX "tutor_profiles_review_history_parent_id_idx" ON "payload"."tutor_profiles_review_history" USING btree ("_parent_id");
  CREATE INDEX "tutor_profiles_review_history_by_idx" ON "payload"."tutor_profiles_review_history" USING btree ("by_id");
  CREATE INDEX "tutor_profiles_primary_subject_idx" ON "payload"."tutor_profiles" USING btree ("primary_subject_id");
  CREATE INDEX "tutor_profiles_hourly_rate_idx" ON "payload"."tutor_profiles" USING btree ("hourly_rate");
  CREATE INDEX "tutor_profiles_identity_identity_document_idx" ON "payload"."tutor_profiles" USING btree ("identity_document_id");
  CREATE INDEX "tutor_profiles_status_idx" ON "payload"."tutor_profiles" USING btree ("status");
  CREATE UNIQUE INDEX "tutor_profiles_user_idx" ON "payload"."tutor_profiles" USING btree ("user_id");
  CREATE INDEX "tutor_profiles_display_name_idx" ON "payload"."tutor_profiles" USING btree ("display_name");
  CREATE INDEX "tutor_profiles_photo_idx" ON "payload"."tutor_profiles" USING btree ("photo_id");
  CREATE UNIQUE INDEX "tutor_profiles_slug_idx" ON "payload"."tutor_profiles" USING btree ("slug");
  CREATE INDEX "tutor_profiles_country_idx" ON "payload"."tutor_profiles" USING btree ("country");
  CREATE INDEX "tutor_profiles_updated_at_idx" ON "payload"."tutor_profiles" USING btree ("updated_at");
  CREATE INDEX "tutor_profiles_created_at_idx" ON "payload"."tutor_profiles" USING btree ("created_at");
  CREATE INDEX "tutor_profiles_rels_order_idx" ON "payload"."tutor_profiles_rels" USING btree ("order");
  CREATE INDEX "tutor_profiles_rels_parent_idx" ON "payload"."tutor_profiles_rels" USING btree ("parent_id");
  CREATE INDEX "tutor_profiles_rels_path_idx" ON "payload"."tutor_profiles_rels" USING btree ("path");
  CREATE INDEX "tutor_profiles_rels_subjects_id_idx" ON "payload"."tutor_profiles_rels" USING btree ("subjects_id");
  CREATE UNIQUE INDEX "student_profiles_user_idx" ON "payload"."student_profiles" USING btree ("user_id");
  CREATE INDEX "student_profiles_updated_at_idx" ON "payload"."student_profiles" USING btree ("updated_at");
  CREATE INDEX "student_profiles_created_at_idx" ON "payload"."student_profiles" USING btree ("created_at");
  CREATE INDEX "student_profiles_rels_order_idx" ON "payload"."student_profiles_rels" USING btree ("order");
  CREATE INDEX "student_profiles_rels_parent_idx" ON "payload"."student_profiles_rels" USING btree ("parent_id");
  CREATE INDEX "student_profiles_rels_path_idx" ON "payload"."student_profiles_rels" USING btree ("path");
  CREATE INDEX "student_profiles_rels_subjects_id_idx" ON "payload"."student_profiles_rels" USING btree ("subjects_id");
  CREATE INDEX "student_profiles_rels_languages_id_idx" ON "payload"."student_profiles_rels" USING btree ("languages_id");
  CREATE INDEX "student_profiles_rels_tutor_profiles_id_idx" ON "payload"."student_profiles_rels" USING btree ("tutor_profiles_id");
  CREATE UNIQUE INDEX "subjects_name_idx" ON "payload"."subjects" USING btree ("name");
  CREATE UNIQUE INDEX "subjects_slug_idx" ON "payload"."subjects" USING btree ("slug");
  CREATE INDEX "subjects_category_idx" ON "payload"."subjects" USING btree ("category");
  CREATE INDEX "subjects_updated_at_idx" ON "payload"."subjects" USING btree ("updated_at");
  CREATE INDEX "subjects_created_at_idx" ON "payload"."subjects" USING btree ("created_at");
  CREATE UNIQUE INDEX "languages_name_idx" ON "payload"."languages" USING btree ("name");
  CREATE UNIQUE INDEX "languages_code_idx" ON "payload"."languages" USING btree ("code");
  CREATE INDEX "languages_updated_at_idx" ON "payload"."languages" USING btree ("updated_at");
  CREATE INDEX "languages_created_at_idx" ON "payload"."languages" USING btree ("created_at");
  CREATE INDEX "private_files_owner_idx" ON "payload"."private_files" USING btree ("owner_id");
  CREATE INDEX "private_files_updated_at_idx" ON "payload"."private_files" USING btree ("updated_at");
  CREATE INDEX "private_files_created_at_idx" ON "payload"."private_files" USING btree ("created_at");
  CREATE UNIQUE INDEX "private_files_filename_idx" ON "payload"."private_files" USING btree ("filename");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tutor_profiles_fk" FOREIGN KEY ("tutor_profiles_id") REFERENCES "payload"."tutor_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_student_profiles_fk" FOREIGN KEY ("student_profiles_id") REFERENCES "payload"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subjects_fk" FOREIGN KEY ("subjects_id") REFERENCES "payload"."subjects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_languages_fk" FOREIGN KEY ("languages_id") REFERENCES "payload"."languages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_private_files_fk" FOREIGN KEY ("private_files_id") REFERENCES "payload"."private_files"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_tutor_profiles_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("tutor_profiles_id");
  CREATE INDEX "payload_locked_documents_rels_student_profiles_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("student_profiles_id");
  CREATE INDEX "payload_locked_documents_rels_subjects_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("subjects_id");
  CREATE INDEX "payload_locked_documents_rels_languages_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("languages_id");
  CREATE INDEX "payload_locked_documents_rels_private_files_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("private_files_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."tutor_profiles_languages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."tutor_profiles_levels_taught" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."tutor_profiles_education" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."tutor_profiles_certifications" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."tutor_profiles_experience" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."tutor_profiles_review_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."tutor_profiles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."tutor_profiles_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."student_profiles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."student_profiles_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."subjects" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."languages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."private_files" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."platform_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."tutor_profiles_languages" CASCADE;
  DROP TABLE "payload"."tutor_profiles_levels_taught" CASCADE;
  DROP TABLE "payload"."tutor_profiles_education" CASCADE;
  DROP TABLE "payload"."tutor_profiles_certifications" CASCADE;
  DROP TABLE "payload"."tutor_profiles_experience" CASCADE;
  DROP TABLE "payload"."tutor_profiles_review_history" CASCADE;
  DROP TABLE "payload"."tutor_profiles" CASCADE;
  DROP TABLE "payload"."tutor_profiles_rels" CASCADE;
  DROP TABLE "payload"."student_profiles" CASCADE;
  DROP TABLE "payload"."student_profiles_rels" CASCADE;
  DROP TABLE "payload"."subjects" CASCADE;
  DROP TABLE "payload"."languages" CASCADE;
  DROP TABLE "payload"."private_files" CASCADE;
  DROP TABLE "payload"."platform_settings" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tutor_profiles_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_student_profiles_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_subjects_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_languages_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_private_files_fk";
  
  DROP INDEX "payload"."payload_locked_documents_rels_tutor_profiles_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_student_profiles_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_subjects_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_languages_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_private_files_id_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "tutor_profiles_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "student_profiles_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "subjects_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "languages_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "private_files_id";
  DROP TYPE "payload"."enum_tutor_profiles_languages_level";
  DROP TYPE "payload"."enum_tutor_profiles_levels_taught";
  DROP TYPE "payload"."enum_tutor_profiles_review_history_action";
  DROP TYPE "payload"."enum_tutor_profiles_identity_document_type";
  DROP TYPE "payload"."enum_tutor_profiles_status";
  DROP TYPE "payload"."enum_student_profiles_goal";
  DROP TYPE "payload"."enum_student_profiles_level";
  DROP TYPE "payload"."enum_student_profiles_pace";
  DROP TYPE "payload"."enum_subjects_category";
  DROP TYPE "payload"."enum_private_files_kind";
  DROP TYPE "payload"."enum_platform_settings_currency";`)
}
