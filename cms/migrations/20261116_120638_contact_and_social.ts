import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_contact_messages_status" AS ENUM('new', 'replied', 'closed');
  CREATE TABLE "payload"."contact_messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "payload"."enum_contact_messages_status" DEFAULT 'new' NOT NULL,
  	"user_id" integer,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"subject" varchar NOT NULL,
  	"message" varchar NOT NULL,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "contact_messages_id" integer;
  ALTER TABLE "payload"."site_settings" ADD COLUMN "social_x" varchar;
  ALTER TABLE "payload"."site_settings" ADD COLUMN "social_facebook" varchar;
  ALTER TABLE "payload"."site_settings" ADD COLUMN "social_instagram" varchar;
  ALTER TABLE "payload"."site_settings" ADD COLUMN "social_linkedin" varchar;
  ALTER TABLE "payload"."site_settings" ADD COLUMN "social_youtube" varchar;
  ALTER TABLE "payload"."site_settings" ADD COLUMN "social_tiktok" varchar;
  ALTER TABLE "payload"."contact_messages" ADD CONSTRAINT "contact_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "contact_messages_status_idx" ON "payload"."contact_messages" USING btree ("status");
  CREATE INDEX "contact_messages_user_idx" ON "payload"."contact_messages" USING btree ("user_id");
  CREATE INDEX "contact_messages_email_idx" ON "payload"."contact_messages" USING btree ("email");
  CREATE INDEX "contact_messages_updated_at_idx" ON "payload"."contact_messages" USING btree ("updated_at");
  CREATE INDEX "contact_messages_created_at_idx" ON "payload"."contact_messages" USING btree ("created_at");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contact_messages_fk" FOREIGN KEY ("contact_messages_id") REFERENCES "payload"."contact_messages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_contact_messages_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("contact_messages_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."contact_messages" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."contact_messages" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_contact_messages_fk";
  
  DROP INDEX "payload"."payload_locked_documents_rels_contact_messages_id_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "contact_messages_id";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "social_x";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "social_facebook";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "social_instagram";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "social_linkedin";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "social_youtube";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "social_tiktok";
  DROP TYPE "payload"."enum_contact_messages_status";`)
}
