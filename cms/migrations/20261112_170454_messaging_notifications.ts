import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_email_templates_key" AS ENUM('booking_confirmed_student', 'booking_confirmed_tutor', 'booking_requested_student', 'booking_requested_tutor', 'request_accepted', 'request_declined', 'lesson_cancelled', 'lesson_reminder_day', 'lesson_reminder_hour', 'new_message', 'review_received', 'payment_receipt', 'refund_issued', 'payout_requested', 'payout_sent', 'application_received', 'application_approved', 'application_changes', 'application_rejected');
  CREATE TYPE "payload"."enum_email_log_status" AS ENUM('sent', 'failed', 'off', 'no_smtp');
  CREATE TABLE "payload"."conversations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"student_id" integer NOT NULL,
  	"tutor_user_id" integer NOT NULL,
  	"tutor_id" integer NOT NULL,
  	"last_message_at" timestamp(3) with time zone,
  	"last_preview" varchar,
  	"last_sender_id" integer,
  	"message_count" numeric DEFAULT 0,
  	"student_read_at" timestamp(3) with time zone,
  	"tutor_read_at" timestamp(3) with time zone,
  	"flagged" boolean DEFAULT false,
  	"last_emailed_at" timestamp(3) with time zone,
  	"closed" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"conversation_id" integer NOT NULL,
  	"sender_id" integer NOT NULL,
  	"body" varchar NOT NULL,
  	"flag" varchar,
  	"hidden" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."notifications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"kind" varchar,
  	"title" varchar NOT NULL,
  	"body" varchar,
  	"href" varchar,
  	"read_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."email_templates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" "payload"."enum_email_templates_key" NOT NULL,
  	"name" varchar NOT NULL,
  	"audience" varchar,
  	"description" varchar,
  	"enabled" boolean DEFAULT true,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."email_log" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"to" varchar NOT NULL,
  	"subject" varchar NOT NULL,
  	"template" varchar,
  	"status" "payload"."enum_email_log_status" NOT NULL,
  	"error" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload"."users" ADD COLUMN "email_prefs_messages" boolean DEFAULT true;
  ALTER TABLE "payload"."users" ADD COLUMN "email_prefs_reminders" boolean DEFAULT true;
  ALTER TABLE "payload"."bookings" ADD COLUMN "reminded_day_at" timestamp(3) with time zone;
  ALTER TABLE "payload"."bookings" ADD COLUMN "reminded_hour_at" timestamp(3) with time zone;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "conversations_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "messages_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "notifications_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "email_templates_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "email_log_id" integer;
  ALTER TABLE "payload"."conversations" ADD CONSTRAINT "conversations_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."conversations" ADD CONSTRAINT "conversations_tutor_user_id_users_id_fk" FOREIGN KEY ("tutor_user_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."conversations" ADD CONSTRAINT "conversations_tutor_id_tutor_profiles_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "payload"."tutor_profiles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."conversations" ADD CONSTRAINT "conversations_last_sender_id_users_id_fk" FOREIGN KEY ("last_sender_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "payload"."conversations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "conversations_student_idx" ON "payload"."conversations" USING btree ("student_id");
  CREATE INDEX "conversations_tutor_user_idx" ON "payload"."conversations" USING btree ("tutor_user_id");
  CREATE INDEX "conversations_tutor_idx" ON "payload"."conversations" USING btree ("tutor_id");
  CREATE INDEX "conversations_last_message_at_idx" ON "payload"."conversations" USING btree ("last_message_at");
  CREATE INDEX "conversations_last_sender_idx" ON "payload"."conversations" USING btree ("last_sender_id");
  CREATE INDEX "conversations_flagged_idx" ON "payload"."conversations" USING btree ("flagged");
  CREATE INDEX "conversations_updated_at_idx" ON "payload"."conversations" USING btree ("updated_at");
  CREATE INDEX "conversations_created_at_idx" ON "payload"."conversations" USING btree ("created_at");
  CREATE INDEX "messages_conversation_idx" ON "payload"."messages" USING btree ("conversation_id");
  CREATE INDEX "messages_sender_idx" ON "payload"."messages" USING btree ("sender_id");
  CREATE INDEX "messages_updated_at_idx" ON "payload"."messages" USING btree ("updated_at");
  CREATE INDEX "messages_created_at_idx" ON "payload"."messages" USING btree ("created_at");
  CREATE INDEX "notifications_user_idx" ON "payload"."notifications" USING btree ("user_id");
  CREATE INDEX "notifications_kind_idx" ON "payload"."notifications" USING btree ("kind");
  CREATE INDEX "notifications_read_at_idx" ON "payload"."notifications" USING btree ("read_at");
  CREATE INDEX "notifications_updated_at_idx" ON "payload"."notifications" USING btree ("updated_at");
  CREATE INDEX "notifications_created_at_idx" ON "payload"."notifications" USING btree ("created_at");
  CREATE UNIQUE INDEX "email_templates_key_idx" ON "payload"."email_templates" USING btree ("key");
  CREATE INDEX "email_templates_updated_at_idx" ON "payload"."email_templates" USING btree ("updated_at");
  CREATE INDEX "email_templates_created_at_idx" ON "payload"."email_templates" USING btree ("created_at");
  CREATE INDEX "email_log_to_idx" ON "payload"."email_log" USING btree ("to");
  CREATE INDEX "email_log_template_idx" ON "payload"."email_log" USING btree ("template");
  CREATE INDEX "email_log_status_idx" ON "payload"."email_log" USING btree ("status");
  CREATE INDEX "email_log_updated_at_idx" ON "payload"."email_log" USING btree ("updated_at");
  CREATE INDEX "email_log_created_at_idx" ON "payload"."email_log" USING btree ("created_at");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_conversations_fk" FOREIGN KEY ("conversations_id") REFERENCES "payload"."conversations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_messages_fk" FOREIGN KEY ("messages_id") REFERENCES "payload"."messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_notifications_fk" FOREIGN KEY ("notifications_id") REFERENCES "payload"."notifications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_email_templates_fk" FOREIGN KEY ("email_templates_id") REFERENCES "payload"."email_templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_email_log_fk" FOREIGN KEY ("email_log_id") REFERENCES "payload"."email_log"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_conversations_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("conversations_id");
  CREATE INDEX "payload_locked_documents_rels_messages_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("messages_id");
  CREATE INDEX "payload_locked_documents_rels_notifications_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("notifications_id");
  CREATE INDEX "payload_locked_documents_rels_email_templates_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("email_templates_id");
  CREATE INDEX "payload_locked_documents_rels_email_log_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("email_log_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."conversations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."messages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."notifications" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."email_templates" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."email_log" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."conversations" CASCADE;
  DROP TABLE "payload"."messages" CASCADE;
  DROP TABLE "payload"."notifications" CASCADE;
  DROP TABLE "payload"."email_templates" CASCADE;
  DROP TABLE "payload"."email_log" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_conversations_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_messages_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_notifications_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_email_templates_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_email_log_fk";
  
  DROP INDEX "payload"."payload_locked_documents_rels_conversations_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_messages_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_notifications_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_email_templates_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_email_log_id_idx";
  ALTER TABLE "payload"."users" DROP COLUMN "email_prefs_messages";
  ALTER TABLE "payload"."users" DROP COLUMN "email_prefs_reminders";
  ALTER TABLE "payload"."bookings" DROP COLUMN "reminded_day_at";
  ALTER TABLE "payload"."bookings" DROP COLUMN "reminded_hour_at";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "conversations_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "messages_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "notifications_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "email_templates_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "email_log_id";
  DROP TYPE "payload"."enum_email_templates_key";
  DROP TYPE "payload"."enum_email_log_status";`)
}
