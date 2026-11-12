import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_pages_kind" AS ENUM('company', 'legal', 'help');
  CREATE TYPE "payload"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_training_courses_status" AS ENUM('draft', 'published');
  CREATE TABLE "payload"."posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"excerpt" varchar NOT NULL,
  	"cover_id" integer,
  	"body" jsonb NOT NULL,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_image_id" integer,
  	"seo_no_index" boolean,
  	"slug" varchar,
  	"status" "payload"."enum_posts_status" DEFAULT 'draft' NOT NULL,
  	"published_at" timestamp(3) with time zone,
  	"featured" boolean,
  	"category_id" integer,
  	"author_id" integer,
  	"author_title" varchar,
  	"reading_minutes" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."blog_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"description" varchar,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"intro" varchar,
  	"body" jsonb NOT NULL,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_image_id" integer,
  	"seo_no_index" boolean,
  	"slug" varchar,
  	"kind" "payload"."enum_pages_kind" DEFAULT 'company',
  	"status" "payload"."enum_pages_status" DEFAULT 'published' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."training_courses_lessons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"minutes" numeric DEFAULT 5,
  	"video" varchar,
  	"body" jsonb NOT NULL
  );
  
  CREATE TABLE "payload"."training_courses_quiz_questions_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."training_courses_quiz_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" numeric NOT NULL,
  	"explain" varchar
  );
  
  CREATE TABLE "payload"."training_courses" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"summary" varchar NOT NULL,
  	"cover_id" integer,
  	"quiz_pass_mark" numeric DEFAULT 80,
  	"slug" varchar NOT NULL,
  	"status" "payload"."enum_training_courses_status" DEFAULT 'published',
  	"required" boolean,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."training_progress" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"tutor_user_id" integer NOT NULL,
  	"course_id" integer NOT NULL,
  	"completed_lessons" jsonb DEFAULT '[]'::jsonb,
  	"percent" numeric DEFAULT 0,
  	"quiz_best" numeric,
  	"attempts" numeric DEFAULT 0,
  	"passed_at" timestamp(3) with time zone,
  	"certificate" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."home_page_hero_headlines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."home_page_hero_popular_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"slug" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."home_page_sections_steps_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."home_page_sections_teach_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."home_page_sections_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"q" varchar NOT NULL,
  	"a" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."home_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_pretitle" varchar,
  	"hero_subheading" varchar,
  	"hero_search_placeholder" varchar,
  	"hero_image_id" integer,
  	"hero_proof_text" varchar,
  	"hero_card1_value" numeric,
  	"hero_card1_suffix" varchar,
  	"hero_card1_decimals" numeric DEFAULT 0,
  	"hero_card1_label" varchar,
  	"hero_card2_value" numeric,
  	"hero_card2_suffix" varchar,
  	"hero_card2_decimals" numeric DEFAULT 0,
  	"hero_card2_label" varchar,
  	"hero_card3_value" numeric,
  	"hero_card3_suffix" varchar,
  	"hero_card3_decimals" numeric DEFAULT 0,
  	"hero_card3_label" varchar,
  	"stats_live" boolean DEFAULT false,
  	"stats_stat1_value" numeric,
  	"stats_stat1_suffix" varchar,
  	"stats_stat1_decimals" numeric DEFAULT 0,
  	"stats_stat1_label" varchar,
  	"stats_stat2_value" numeric,
  	"stats_stat2_suffix" varchar,
  	"stats_stat2_decimals" numeric DEFAULT 0,
  	"stats_stat2_label" varchar,
  	"stats_stat3_value" numeric,
  	"stats_stat3_suffix" varchar,
  	"stats_stat3_decimals" numeric DEFAULT 0,
  	"stats_stat3_label" varchar,
  	"stats_stat4_value" numeric,
  	"stats_stat4_suffix" varchar,
  	"stats_stat4_decimals" numeric DEFAULT 0,
  	"stats_stat4_label" varchar,
  	"sections_subjects_pretitle" varchar,
  	"sections_subjects_title" varchar,
  	"sections_subjects_cta" varchar,
  	"sections_tutors_pretitle" varchar,
  	"sections_tutors_title" varchar,
  	"sections_tutors_cta" varchar,
  	"sections_classroom_badge" varchar,
  	"sections_classroom_title" varchar,
  	"sections_classroom_subtitle" varchar,
  	"sections_steps_pretitle" varchar,
  	"sections_steps_title" varchar,
  	"sections_teach_badge" varchar,
  	"sections_teach_title" varchar,
  	"sections_teach_subtitle" varchar,
  	"sections_teach_cta" varchar,
  	"sections_teach_secondary" varchar,
  	"sections_faq_pretitle" varchar,
  	"sections_faq_title" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "posts_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "blog_categories_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "pages_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "training_courses_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "training_progress_id" integer;
  ALTER TABLE "payload"."site_settings" ADD COLUMN "seo_title" varchar DEFAULT 'Sabina: live 1-on-1 tutoring with verified tutors';
  ALTER TABLE "payload"."site_settings" ADD COLUMN "seo_description" varchar DEFAULT 'Find a tutor for maths, sciences, languages, KCSE and IELTS. Book a time that suits you and learn live in your browser.';
  ALTER TABLE "payload"."site_settings" ADD COLUMN "seo_image_id" integer;
  ALTER TABLE "payload"."site_settings" ADD COLUMN "seo_twitter" varchar;
  ALTER TABLE "payload"."site_settings" ADD COLUMN "seo_google_verification" varchar;
  ALTER TABLE "payload"."site_settings" ADD COLUMN "seo_bing_verification" varchar;
  ALTER TABLE "payload"."site_settings" ADD COLUMN "seo_allow_indexing" boolean DEFAULT true;
  ALTER TABLE "payload"."posts" ADD CONSTRAINT "posts_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."posts" ADD CONSTRAINT "posts_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."posts" ADD CONSTRAINT "posts_category_id_blog_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "payload"."blog_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pages" ADD CONSTRAINT "pages_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."training_courses_lessons" ADD CONSTRAINT "training_courses_lessons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."training_courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."training_courses_quiz_questions_options" ADD CONSTRAINT "training_courses_quiz_questions_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."training_courses_quiz_questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."training_courses_quiz_questions" ADD CONSTRAINT "training_courses_quiz_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."training_courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."training_courses" ADD CONSTRAINT "training_courses_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."training_progress" ADD CONSTRAINT "training_progress_tutor_user_id_users_id_fk" FOREIGN KEY ("tutor_user_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."training_progress" ADD CONSTRAINT "training_progress_course_id_training_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "payload"."training_courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."home_page_hero_headlines" ADD CONSTRAINT "home_page_hero_headlines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."home_page_hero_popular_tags" ADD CONSTRAINT "home_page_hero_popular_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."home_page_sections_steps_items" ADD CONSTRAINT "home_page_sections_steps_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."home_page_sections_teach_points" ADD CONSTRAINT "home_page_sections_teach_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."home_page_sections_faq_items" ADD CONSTRAINT "home_page_sections_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."home_page" ADD CONSTRAINT "home_page_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "posts_cover_idx" ON "payload"."posts" USING btree ("cover_id");
  CREATE INDEX "posts_seo_seo_image_idx" ON "payload"."posts" USING btree ("seo_image_id");
  CREATE UNIQUE INDEX "posts_slug_idx" ON "payload"."posts" USING btree ("slug");
  CREATE INDEX "posts_status_idx" ON "payload"."posts" USING btree ("status");
  CREATE INDEX "posts_published_at_idx" ON "payload"."posts" USING btree ("published_at");
  CREATE INDEX "posts_category_idx" ON "payload"."posts" USING btree ("category_id");
  CREATE INDEX "posts_author_idx" ON "payload"."posts" USING btree ("author_id");
  CREATE INDEX "posts_updated_at_idx" ON "payload"."posts" USING btree ("updated_at");
  CREATE INDEX "posts_created_at_idx" ON "payload"."posts" USING btree ("created_at");
  CREATE UNIQUE INDEX "blog_categories_slug_idx" ON "payload"."blog_categories" USING btree ("slug");
  CREATE INDEX "blog_categories_updated_at_idx" ON "payload"."blog_categories" USING btree ("updated_at");
  CREATE INDEX "blog_categories_created_at_idx" ON "payload"."blog_categories" USING btree ("created_at");
  CREATE INDEX "pages_seo_seo_image_idx" ON "payload"."pages" USING btree ("seo_image_id");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "payload"."pages" USING btree ("slug");
  CREATE INDEX "pages_updated_at_idx" ON "payload"."pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "payload"."pages" USING btree ("created_at");
  CREATE INDEX "training_courses_lessons_order_idx" ON "payload"."training_courses_lessons" USING btree ("_order");
  CREATE INDEX "training_courses_lessons_parent_id_idx" ON "payload"."training_courses_lessons" USING btree ("_parent_id");
  CREATE INDEX "training_courses_quiz_questions_options_order_idx" ON "payload"."training_courses_quiz_questions_options" USING btree ("_order");
  CREATE INDEX "training_courses_quiz_questions_options_parent_id_idx" ON "payload"."training_courses_quiz_questions_options" USING btree ("_parent_id");
  CREATE INDEX "training_courses_quiz_questions_order_idx" ON "payload"."training_courses_quiz_questions" USING btree ("_order");
  CREATE INDEX "training_courses_quiz_questions_parent_id_idx" ON "payload"."training_courses_quiz_questions" USING btree ("_parent_id");
  CREATE INDEX "training_courses_cover_idx" ON "payload"."training_courses" USING btree ("cover_id");
  CREATE UNIQUE INDEX "training_courses_slug_idx" ON "payload"."training_courses" USING btree ("slug");
  CREATE INDEX "training_courses_updated_at_idx" ON "payload"."training_courses" USING btree ("updated_at");
  CREATE INDEX "training_courses_created_at_idx" ON "payload"."training_courses" USING btree ("created_at");
  CREATE INDEX "training_progress_tutor_user_idx" ON "payload"."training_progress" USING btree ("tutor_user_id");
  CREATE INDEX "training_progress_course_idx" ON "payload"."training_progress" USING btree ("course_id");
  CREATE UNIQUE INDEX "training_progress_certificate_idx" ON "payload"."training_progress" USING btree ("certificate");
  CREATE INDEX "training_progress_updated_at_idx" ON "payload"."training_progress" USING btree ("updated_at");
  CREATE INDEX "training_progress_created_at_idx" ON "payload"."training_progress" USING btree ("created_at");
  CREATE INDEX "home_page_hero_headlines_order_idx" ON "payload"."home_page_hero_headlines" USING btree ("_order");
  CREATE INDEX "home_page_hero_headlines_parent_id_idx" ON "payload"."home_page_hero_headlines" USING btree ("_parent_id");
  CREATE INDEX "home_page_hero_popular_tags_order_idx" ON "payload"."home_page_hero_popular_tags" USING btree ("_order");
  CREATE INDEX "home_page_hero_popular_tags_parent_id_idx" ON "payload"."home_page_hero_popular_tags" USING btree ("_parent_id");
  CREATE INDEX "home_page_sections_steps_items_order_idx" ON "payload"."home_page_sections_steps_items" USING btree ("_order");
  CREATE INDEX "home_page_sections_steps_items_parent_id_idx" ON "payload"."home_page_sections_steps_items" USING btree ("_parent_id");
  CREATE INDEX "home_page_sections_teach_points_order_idx" ON "payload"."home_page_sections_teach_points" USING btree ("_order");
  CREATE INDEX "home_page_sections_teach_points_parent_id_idx" ON "payload"."home_page_sections_teach_points" USING btree ("_parent_id");
  CREATE INDEX "home_page_sections_faq_items_order_idx" ON "payload"."home_page_sections_faq_items" USING btree ("_order");
  CREATE INDEX "home_page_sections_faq_items_parent_id_idx" ON "payload"."home_page_sections_faq_items" USING btree ("_parent_id");
  CREATE INDEX "home_page_hero_hero_image_idx" ON "payload"."home_page" USING btree ("hero_image_id");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "payload"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blog_categories_fk" FOREIGN KEY ("blog_categories_id") REFERENCES "payload"."blog_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_training_courses_fk" FOREIGN KEY ("training_courses_id") REFERENCES "payload"."training_courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_training_progress_fk" FOREIGN KEY ("training_progress_id") REFERENCES "payload"."training_progress"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings" ADD CONSTRAINT "site_settings_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_posts_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX "payload_locked_documents_rels_blog_categories_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("blog_categories_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_training_courses_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("training_courses_id");
  CREATE INDEX "payload_locked_documents_rels_training_progress_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("training_progress_id");
  CREATE INDEX "site_settings_seo_seo_image_idx" ON "payload"."site_settings" USING btree ("seo_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."posts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."blog_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."pages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."training_courses_lessons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."training_courses_quiz_questions_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."training_courses_quiz_questions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."training_courses" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."training_progress" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."home_page_hero_headlines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."home_page_hero_popular_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."home_page_sections_steps_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."home_page_sections_teach_points" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."home_page_sections_faq_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."home_page" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."posts" CASCADE;
  DROP TABLE "payload"."blog_categories" CASCADE;
  DROP TABLE "payload"."pages" CASCADE;
  DROP TABLE "payload"."training_courses_lessons" CASCADE;
  DROP TABLE "payload"."training_courses_quiz_questions_options" CASCADE;
  DROP TABLE "payload"."training_courses_quiz_questions" CASCADE;
  DROP TABLE "payload"."training_courses" CASCADE;
  DROP TABLE "payload"."training_progress" CASCADE;
  DROP TABLE "payload"."home_page_hero_headlines" CASCADE;
  DROP TABLE "payload"."home_page_hero_popular_tags" CASCADE;
  DROP TABLE "payload"."home_page_sections_steps_items" CASCADE;
  DROP TABLE "payload"."home_page_sections_teach_points" CASCADE;
  DROP TABLE "payload"."home_page_sections_faq_items" CASCADE;
  DROP TABLE "payload"."home_page" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_posts_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_blog_categories_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_pages_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_training_courses_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_training_progress_fk";
  
  ALTER TABLE "payload"."site_settings" DROP CONSTRAINT "site_settings_seo_image_id_media_id_fk";
  
  DROP INDEX "payload"."payload_locked_documents_rels_posts_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_blog_categories_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_pages_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_training_courses_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_training_progress_id_idx";
  DROP INDEX "payload"."site_settings_seo_seo_image_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "posts_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "blog_categories_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "pages_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "training_courses_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "training_progress_id";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "seo_title";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "seo_description";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "seo_image_id";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "seo_twitter";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "seo_google_verification";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "seo_bing_verification";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "seo_allow_indexing";
  DROP TYPE "payload"."enum_posts_status";
  DROP TYPE "payload"."enum_pages_kind";
  DROP TYPE "payload"."enum_pages_status";
  DROP TYPE "payload"."enum_training_courses_status";`)
}
