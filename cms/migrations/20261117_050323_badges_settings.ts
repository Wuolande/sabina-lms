import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_tutor_profiles_badges" AS ENUM('top_rated', 'fast_responder', 'in_demand', 'lessons_500', 'lessons_100', 'lessons_50', 'lessons_10', 'new_tutor');
  CREATE TABLE "payload"."tutor_profiles_badges" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "payload"."enum_tutor_profiles_badges",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  ALTER TABLE "payload"."tutor_profiles" ADD COLUMN "stats_response_minutes" numeric;
  ALTER TABLE "payload"."platform_settings" ADD COLUMN "badge_top_rated_rating" numeric DEFAULT 4.8;
  ALTER TABLE "payload"."platform_settings" ADD COLUMN "badge_top_rated_reviews" numeric DEFAULT 5;
  ALTER TABLE "payload"."platform_settings" ADD COLUMN "badge_fast_reply_hours" numeric DEFAULT 3;
  ALTER TABLE "payload"."platform_settings" ADD COLUMN "badge_in_demand_lessons" numeric DEFAULT 8;
  ALTER TABLE "payload"."platform_settings" ADD COLUMN "badge_new_tutor_days" numeric DEFAULT 30;
  ALTER TABLE "payload"."platform_settings" ADD COLUMN "referrals_enabled" boolean DEFAULT true;
  ALTER TABLE "payload"."platform_settings" ADD COLUMN "referral_reward_referrer" numeric DEFAULT 5;
  ALTER TABLE "payload"."platform_settings" ADD COLUMN "referral_reward_friend" numeric DEFAULT 5;
  ALTER TABLE "payload"."platform_settings" ADD COLUMN "referral_reward_tutor" numeric DEFAULT 10;
  ALTER TABLE "payload"."tutor_profiles_badges" ADD CONSTRAINT "tutor_profiles_badges_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."tutor_profiles"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "tutor_profiles_badges_order_idx" ON "payload"."tutor_profiles_badges" USING btree ("order");
  CREATE INDEX "tutor_profiles_badges_parent_idx" ON "payload"."tutor_profiles_badges" USING btree ("parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."tutor_profiles_badges" CASCADE;
  ALTER TABLE "payload"."tutor_profiles" DROP COLUMN "stats_response_minutes";
  ALTER TABLE "payload"."platform_settings" DROP COLUMN "badge_top_rated_rating";
  ALTER TABLE "payload"."platform_settings" DROP COLUMN "badge_top_rated_reviews";
  ALTER TABLE "payload"."platform_settings" DROP COLUMN "badge_fast_reply_hours";
  ALTER TABLE "payload"."platform_settings" DROP COLUMN "badge_in_demand_lessons";
  ALTER TABLE "payload"."platform_settings" DROP COLUMN "badge_new_tutor_days";
  ALTER TABLE "payload"."platform_settings" DROP COLUMN "referrals_enabled";
  ALTER TABLE "payload"."platform_settings" DROP COLUMN "referral_reward_referrer";
  ALTER TABLE "payload"."platform_settings" DROP COLUMN "referral_reward_friend";
  ALTER TABLE "payload"."platform_settings" DROP COLUMN "referral_reward_tutor";
  DROP TYPE "payload"."enum_tutor_profiles_badges";`)
}
