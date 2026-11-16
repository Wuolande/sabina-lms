import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_text_log_channel" AS ENUM('sms', 'whatsapp');
  CREATE TYPE "payload"."enum_text_log_status" AS ENUM('sent', 'failed');
  CREATE TABLE "payload"."text_log" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer,
  	"to" varchar NOT NULL,
  	"channel" "payload"."enum_text_log_channel" NOT NULL,
  	"kind" varchar,
  	"body" varchar,
  	"status" "payload"."enum_text_log_status" NOT NULL,
  	"error" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload"."users" ADD COLUMN "text_reminders" boolean DEFAULT false;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "text_log_id" integer;
  ALTER TABLE "payload"."text_log" ADD CONSTRAINT "text_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "text_log_user_idx" ON "payload"."text_log" USING btree ("user_id");
  CREATE INDEX "text_log_to_idx" ON "payload"."text_log" USING btree ("to");
  CREATE INDEX "text_log_status_idx" ON "payload"."text_log" USING btree ("status");
  CREATE INDEX "text_log_updated_at_idx" ON "payload"."text_log" USING btree ("updated_at");
  CREATE INDEX "text_log_created_at_idx" ON "payload"."text_log" USING btree ("created_at");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_text_log_fk" FOREIGN KEY ("text_log_id") REFERENCES "payload"."text_log"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_text_log_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("text_log_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."text_log" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."text_log" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_text_log_fk";
  
  DROP INDEX "payload"."payload_locked_documents_rels_text_log_id_idx";
  ALTER TABLE "payload"."users" DROP COLUMN "text_reminders";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "text_log_id";
  DROP TYPE "payload"."enum_text_log_channel";
  DROP TYPE "payload"."enum_text_log_status";`)
}
