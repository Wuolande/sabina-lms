import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_credits_kind" AS ENUM('referral_reward', 'referral_welcome', 'tutor_bonus', 'spent', 'returned', 'adjustment');
  ALTER TYPE "payload"."enum_payments_provider" ADD VALUE 'credit';
  ALTER TYPE "payload"."enum_email_templates_key" ADD VALUE 'referral_reward' BEFORE 'rate_lesson';
  CREATE TABLE "payload"."credits" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"amount" numeric NOT NULL,
  	"currency" varchar DEFAULT 'USD' NOT NULL,
  	"kind" "payload"."enum_credits_kind" DEFAULT 'adjustment' NOT NULL,
  	"note" varchar NOT NULL,
  	"friend_id" integer,
  	"booking_id" integer,
  	"payment_id" integer,
  	"payout_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload"."users" ADD COLUMN "referral_code" varchar;
  ALTER TABLE "payload"."users" ADD COLUMN "referred_by_id" integer;
  ALTER TABLE "payload"."users" ADD COLUMN "referral_rewarded_at" timestamp(3) with time zone;
  ALTER TABLE "payload"."payments" ADD COLUMN "credit_used" numeric DEFAULT 0;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "credits_id" integer;
  ALTER TABLE "payload"."credits" ADD CONSTRAINT "credits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."credits" ADD CONSTRAINT "credits_friend_id_users_id_fk" FOREIGN KEY ("friend_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."credits" ADD CONSTRAINT "credits_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "payload"."bookings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."credits" ADD CONSTRAINT "credits_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "payload"."payments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."credits" ADD CONSTRAINT "credits_payout_id_payouts_id_fk" FOREIGN KEY ("payout_id") REFERENCES "payload"."payouts"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "credits_user_idx" ON "payload"."credits" USING btree ("user_id");
  CREATE INDEX "credits_kind_idx" ON "payload"."credits" USING btree ("kind");
  CREATE INDEX "credits_friend_idx" ON "payload"."credits" USING btree ("friend_id");
  CREATE INDEX "credits_booking_idx" ON "payload"."credits" USING btree ("booking_id");
  CREATE INDEX "credits_payment_idx" ON "payload"."credits" USING btree ("payment_id");
  CREATE INDEX "credits_payout_idx" ON "payload"."credits" USING btree ("payout_id");
  CREATE INDEX "credits_updated_at_idx" ON "payload"."credits" USING btree ("updated_at");
  CREATE INDEX "credits_created_at_idx" ON "payload"."credits" USING btree ("created_at");
  ALTER TABLE "payload"."users" ADD CONSTRAINT "users_referred_by_id_users_id_fk" FOREIGN KEY ("referred_by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_credits_fk" FOREIGN KEY ("credits_id") REFERENCES "payload"."credits"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "users_referral_code_idx" ON "payload"."users" USING btree ("referral_code");
  CREATE INDEX "users_referred_by_idx" ON "payload"."users" USING btree ("referred_by_id");
  CREATE INDEX "payload_locked_documents_rels_credits_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("credits_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."credits" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."credits" CASCADE;
  ALTER TABLE "payload"."users" DROP CONSTRAINT "users_referred_by_id_users_id_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_credits_fk";
  
  ALTER TABLE "payload"."payments" ALTER COLUMN "provider" SET DATA TYPE text;
  DROP TYPE "payload"."enum_payments_provider";
  CREATE TYPE "payload"."enum_payments_provider" AS ENUM('stripe', 'paystack', 'dev');
  ALTER TABLE "payload"."payments" ALTER COLUMN "provider" SET DATA TYPE "payload"."enum_payments_provider" USING "provider"::"payload"."enum_payments_provider";
  ALTER TABLE "payload"."email_templates" ALTER COLUMN "key" SET DATA TYPE text;
  DROP TYPE "payload"."enum_email_templates_key";
  CREATE TYPE "payload"."enum_email_templates_key" AS ENUM('booking_confirmed_student', 'booking_confirmed_tutor', 'booking_requested_student', 'booking_requested_tutor', 'request_accepted', 'request_declined', 'lesson_cancelled', 'lesson_reminder_day', 'lesson_reminder_hour', 'new_message', 'review_received', 'rate_lesson', 'homework_set', 'homework_submitted', 'homework_reviewed', 'payment_receipt', 'package_receipt', 'refund_issued', 'payout_requested', 'payout_sent', 'application_received', 'application_approved', 'application_changes', 'application_rejected');
  ALTER TABLE "payload"."email_templates" ALTER COLUMN "key" SET DATA TYPE "payload"."enum_email_templates_key" USING "key"::"payload"."enum_email_templates_key";
  DROP INDEX "payload"."users_referral_code_idx";
  DROP INDEX "payload"."users_referred_by_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_credits_id_idx";
  ALTER TABLE "payload"."users" DROP COLUMN "referral_code";
  ALTER TABLE "payload"."users" DROP COLUMN "referred_by_id";
  ALTER TABLE "payload"."users" DROP COLUMN "referral_rewarded_at";
  ALTER TABLE "payload"."payments" DROP COLUMN "credit_used";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "credits_id";
  DROP TYPE "payload"."enum_credits_kind";`)
}
