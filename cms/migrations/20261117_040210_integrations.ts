import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."integrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"website_site_url" varchar,
  	"email_smtp_host" varchar,
  	"email_smtp_port" varchar,
  	"email_smtp_user" varchar,
  	"email_smtp_pass" varchar,
  	"email_from_address" varchar,
  	"email_from_name" varchar,
  	"payments_stripe_secret_key" varchar,
  	"payments_stripe_webhook_secret" varchar,
  	"payments_paystack_secret_key" varchar,
  	"video_livekit_url" varchar,
  	"video_livekit_api_key" varchar,
  	"video_livekit_api_secret" varchar,
  	"video_stream_account_id" varchar,
  	"video_stream_customer_code" varchar,
  	"video_stream_api_token" varchar,
  	"text_at_username" varchar,
  	"text_at_api_key" varchar,
  	"text_at_sender_id" varchar,
  	"text_at_whatsapp_number" varchar,
  	"push_vapid_public_key" varchar,
  	"push_vapid_private_key" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."integrations" CASCADE;`)
}
