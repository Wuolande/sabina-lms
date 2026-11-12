import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_payments_status" AS ENUM('pending', 'succeeded', 'failed', 'cancelled', 'refunded', 'partially_refunded');
  CREATE TYPE "payload"."enum_payments_provider" AS ENUM('stripe', 'paystack', 'dev');
  CREATE TYPE "payload"."enum_payouts_status" AS ENUM('requested', 'processing', 'paid', 'failed', 'cancelled');
  CREATE TYPE "payload"."enum_payouts_destination_method" AS ENUM('mpesa', 'bank', 'paypal');
  CREATE TYPE "payload"."enum_payout_methods_method" AS ENUM('mpesa', 'bank', 'paypal');
  ALTER TYPE "payload"."enum_bookings_status" ADD VALUE 'pending_payment' BEFORE 'requested';
  ALTER TYPE "payload"."enum_bookings_payment_status" ADD VALUE 'failed';
  CREATE TABLE "payload"."payments_refunds" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"amount" numeric,
  	"reason" varchar,
  	"provider_ref" varchar,
  	"at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."payments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"reference" varchar NOT NULL,
  	"status" "payload"."enum_payments_status" DEFAULT 'pending' NOT NULL,
  	"provider" "payload"."enum_payments_provider" NOT NULL,
  	"method" varchar,
  	"amount" numeric NOT NULL,
  	"currency" varchar NOT NULL,
  	"refunded_amount" numeric DEFAULT 0,
  	"booking_id" integer NOT NULL,
  	"student_id" integer NOT NULL,
  	"tutor_id" integer,
  	"provider_ref" varchar,
  	"charge_ref" varchar,
  	"checkout_url" varchar,
  	"paid_at" timestamp(3) with time zone,
  	"failure_reason" varchar,
  	"events" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payouts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"reference" varchar NOT NULL,
  	"status" "payload"."enum_payouts_status" DEFAULT 'requested' NOT NULL,
  	"amount" numeric NOT NULL,
  	"currency" varchar NOT NULL,
  	"tutor_user_id" integer NOT NULL,
  	"destination_method" "payload"."enum_payouts_destination_method",
  	"destination_details" varchar,
  	"method" varchar,
  	"transfer_ref" varchar,
  	"notes" varchar,
  	"paid_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payouts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"bookings_id" integer
  );
  
  CREATE TABLE "payload"."payout_methods" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"method" "payload"."enum_payout_methods_method" NOT NULL,
  	"mpesa_phone" varchar,
  	"account_name" varchar,
  	"bank_name" varchar,
  	"account_number" varchar,
  	"swift" varchar,
  	"paypal_email" varchar,
  	"summary" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload"."bookings" ADD COLUMN "auto_confirm" boolean;
  ALTER TABLE "payload"."bookings" ADD COLUMN "hold_until" timestamp(3) with time zone;
  ALTER TABLE "payload"."bookings" ADD COLUMN "refunded_amount" numeric DEFAULT 0;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "payments_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "payouts_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "payout_methods_id" integer;
  ALTER TABLE "payload"."platform_settings" ADD COLUMN "payment_hold_minutes" numeric DEFAULT 15;
  ALTER TABLE "payload"."platform_settings" ADD COLUMN "late_cancellation_refund_percent" numeric DEFAULT 0;
  ALTER TABLE "payload"."platform_settings" ADD COLUMN "earnings_hold_days" numeric DEFAULT 2;
  ALTER TABLE "payload"."platform_settings" ADD COLUMN "minimum_payout" numeric DEFAULT 20;
  ALTER TABLE "payload"."payments_refunds" ADD CONSTRAINT "payments_refunds_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."payments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "payload"."bookings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."payments" ADD CONSTRAINT "payments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."payments" ADD CONSTRAINT "payments_tutor_id_tutor_profiles_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "payload"."tutor_profiles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."payouts" ADD CONSTRAINT "payouts_tutor_user_id_users_id_fk" FOREIGN KEY ("tutor_user_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."payouts_rels" ADD CONSTRAINT "payouts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payouts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payouts_rels" ADD CONSTRAINT "payouts_rels_bookings_fk" FOREIGN KEY ("bookings_id") REFERENCES "payload"."bookings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payout_methods" ADD CONSTRAINT "payout_methods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "payments_refunds_order_idx" ON "payload"."payments_refunds" USING btree ("_order");
  CREATE INDEX "payments_refunds_parent_id_idx" ON "payload"."payments_refunds" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "payments_reference_idx" ON "payload"."payments" USING btree ("reference");
  CREATE INDEX "payments_status_idx" ON "payload"."payments" USING btree ("status");
  CREATE INDEX "payments_booking_idx" ON "payload"."payments" USING btree ("booking_id");
  CREATE INDEX "payments_student_idx" ON "payload"."payments" USING btree ("student_id");
  CREATE INDEX "payments_tutor_idx" ON "payload"."payments" USING btree ("tutor_id");
  CREATE INDEX "payments_provider_ref_idx" ON "payload"."payments" USING btree ("provider_ref");
  CREATE INDEX "payments_updated_at_idx" ON "payload"."payments" USING btree ("updated_at");
  CREATE INDEX "payments_created_at_idx" ON "payload"."payments" USING btree ("created_at");
  CREATE UNIQUE INDEX "payouts_reference_idx" ON "payload"."payouts" USING btree ("reference");
  CREATE INDEX "payouts_status_idx" ON "payload"."payouts" USING btree ("status");
  CREATE INDEX "payouts_tutor_user_idx" ON "payload"."payouts" USING btree ("tutor_user_id");
  CREATE INDEX "payouts_updated_at_idx" ON "payload"."payouts" USING btree ("updated_at");
  CREATE INDEX "payouts_created_at_idx" ON "payload"."payouts" USING btree ("created_at");
  CREATE INDEX "payouts_rels_order_idx" ON "payload"."payouts_rels" USING btree ("order");
  CREATE INDEX "payouts_rels_parent_idx" ON "payload"."payouts_rels" USING btree ("parent_id");
  CREATE INDEX "payouts_rels_path_idx" ON "payload"."payouts_rels" USING btree ("path");
  CREATE INDEX "payouts_rels_bookings_id_idx" ON "payload"."payouts_rels" USING btree ("bookings_id");
  CREATE UNIQUE INDEX "payout_methods_user_idx" ON "payload"."payout_methods" USING btree ("user_id");
  CREATE INDEX "payout_methods_updated_at_idx" ON "payload"."payout_methods" USING btree ("updated_at");
  CREATE INDEX "payout_methods_created_at_idx" ON "payload"."payout_methods" USING btree ("created_at");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payments_fk" FOREIGN KEY ("payments_id") REFERENCES "payload"."payments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payouts_fk" FOREIGN KEY ("payouts_id") REFERENCES "payload"."payouts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payout_methods_fk" FOREIGN KEY ("payout_methods_id") REFERENCES "payload"."payout_methods"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_payments_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("payments_id");
  CREATE INDEX "payload_locked_documents_rels_payouts_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("payouts_id");
  CREATE INDEX "payload_locked_documents_rels_payout_methods_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("payout_methods_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."payments_refunds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."payments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."payouts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."payouts_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."payout_methods" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."payments_refunds" CASCADE;
  DROP TABLE "payload"."payments" CASCADE;
  DROP TABLE "payload"."payouts" CASCADE;
  DROP TABLE "payload"."payouts_rels" CASCADE;
  DROP TABLE "payload"."payout_methods" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_payments_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_payouts_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_payout_methods_fk";
  
  ALTER TABLE "payload"."bookings" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "payload"."bookings" ALTER COLUMN "status" SET DEFAULT 'requested'::text;
  DROP TYPE "payload"."enum_bookings_status";
  CREATE TYPE "payload"."enum_bookings_status" AS ENUM('requested', 'confirmed', 'completed', 'declined', 'cancelled', 'expired', 'no_show');
  ALTER TABLE "payload"."bookings" ALTER COLUMN "status" SET DEFAULT 'requested'::"payload"."enum_bookings_status";
  ALTER TABLE "payload"."bookings" ALTER COLUMN "status" SET DATA TYPE "payload"."enum_bookings_status" USING "status"::"payload"."enum_bookings_status";
  ALTER TABLE "payload"."bookings" ALTER COLUMN "payment_status" SET DATA TYPE text;
  ALTER TABLE "payload"."bookings" ALTER COLUMN "payment_status" SET DEFAULT 'unpaid'::text;
  DROP TYPE "payload"."enum_bookings_payment_status";
  CREATE TYPE "payload"."enum_bookings_payment_status" AS ENUM('unpaid', 'paid', 'refunded', 'partially_refunded', 'waived');
  ALTER TABLE "payload"."bookings" ALTER COLUMN "payment_status" SET DEFAULT 'unpaid'::"payload"."enum_bookings_payment_status";
  ALTER TABLE "payload"."bookings" ALTER COLUMN "payment_status" SET DATA TYPE "payload"."enum_bookings_payment_status" USING "payment_status"::"payload"."enum_bookings_payment_status";
  DROP INDEX "payload"."payload_locked_documents_rels_payments_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_payouts_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_payout_methods_id_idx";
  ALTER TABLE "payload"."bookings" DROP COLUMN "auto_confirm";
  ALTER TABLE "payload"."bookings" DROP COLUMN "hold_until";
  ALTER TABLE "payload"."bookings" DROP COLUMN "refunded_amount";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "payments_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "payouts_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "payout_methods_id";
  ALTER TABLE "payload"."platform_settings" DROP COLUMN "payment_hold_minutes";
  ALTER TABLE "payload"."platform_settings" DROP COLUMN "late_cancellation_refund_percent";
  ALTER TABLE "payload"."platform_settings" DROP COLUMN "earnings_hold_days";
  ALTER TABLE "payload"."platform_settings" DROP COLUMN "minimum_payout";
  DROP TYPE "payload"."enum_payments_status";
  DROP TYPE "payload"."enum_payments_provider";
  DROP TYPE "payload"."enum_payouts_status";
  DROP TYPE "payload"."enum_payouts_destination_method";
  DROP TYPE "payload"."enum_payout_methods_method";`)
}
