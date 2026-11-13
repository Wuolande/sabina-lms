import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."countries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"code" varchar NOT NULL,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."countries_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"timezones_id" integer
  );
  
  CREATE TABLE "payload"."timezones" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"zone" varchar NOT NULL,
  	"label" varchar,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  -- Plain text → Lexical rich text (one paragraph per non-empty line), used only during this migration.
  CREATE OR REPLACE FUNCTION "payload"."sabina_text_to_lexical"(t text) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $fn$
    SELECT CASE WHEN t IS NULL OR btrim(t) = '' THEN NULL ELSE jsonb_build_object('root', jsonb_build_object(
      'type', 'root', 'format', '', 'indent', 0, 'version', 1, 'direction', 'ltr',
      'children', (SELECT coalesce(jsonb_agg(jsonb_build_object(
        'type', 'paragraph', 'format', '', 'indent', 0, 'version', 1, 'direction', 'ltr', 'textFormat', 0, 'textStyle', '',
        'children', jsonb_build_array(jsonb_build_object('type', 'text', 'text', btrim(line), 'format', 0, 'style', '', 'mode', 'normal', 'detail', 0, 'version', 1))
      ) ORDER BY n), '[]'::jsonb) FROM regexp_split_to_table(t, E'\\r?\\n') WITH ORDINALITY AS x(line, n) WHERE btrim(line) <> '')
    )) END
  $fn$;
  ALTER TABLE "payload"."tutor_profiles_experience" ALTER COLUMN "description" SET DATA TYPE jsonb USING "payload"."sabina_text_to_lexical"("description");
  ALTER TABLE "payload"."tutor_profiles" ALTER COLUMN "about" SET DATA TYPE jsonb USING "payload"."sabina_text_to_lexical"("about");
  ALTER TABLE "payload"."tutor_profiles" ALTER COLUMN "teaching_style" SET DATA TYPE jsonb USING "payload"."sabina_text_to_lexical"("teaching_style");
  ALTER TABLE "payload"."student_profiles" ALTER COLUMN "goal_details" SET DATA TYPE jsonb USING "payload"."sabina_text_to_lexical"("goal_details");
  ALTER TABLE "payload"."bookings" ALTER COLUMN "tutor_notes" SET DATA TYPE jsonb USING "payload"."sabina_text_to_lexical"("tutor_notes");
  ALTER TABLE "payload"."subjects" ALTER COLUMN "description" SET DATA TYPE jsonb USING "payload"."sabina_text_to_lexical"("description");
  ALTER TABLE "payload"."tutor_profiles" ADD COLUMN "about_text" varchar;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "countries_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "timezones_id" integer;
  ALTER TABLE "payload"."countries_rels" ADD CONSTRAINT "countries_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."countries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."countries_rels" ADD CONSTRAINT "countries_rels_timezones_fk" FOREIGN KEY ("timezones_id") REFERENCES "payload"."timezones"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "countries_name_idx" ON "payload"."countries" USING btree ("name");
  CREATE UNIQUE INDEX "countries_code_idx" ON "payload"."countries" USING btree ("code");
  CREATE INDEX "countries_updated_at_idx" ON "payload"."countries" USING btree ("updated_at");
  CREATE INDEX "countries_created_at_idx" ON "payload"."countries" USING btree ("created_at");
  CREATE INDEX "countries_rels_order_idx" ON "payload"."countries_rels" USING btree ("order");
  CREATE INDEX "countries_rels_parent_idx" ON "payload"."countries_rels" USING btree ("parent_id");
  CREATE INDEX "countries_rels_path_idx" ON "payload"."countries_rels" USING btree ("path");
  CREATE INDEX "countries_rels_timezones_id_idx" ON "payload"."countries_rels" USING btree ("timezones_id");
  CREATE UNIQUE INDEX "timezones_zone_idx" ON "payload"."timezones" USING btree ("zone");
  CREATE INDEX "timezones_updated_at_idx" ON "payload"."timezones" USING btree ("updated_at");
  CREATE INDEX "timezones_created_at_idx" ON "payload"."timezones" USING btree ("created_at");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_countries_fk" FOREIGN KEY ("countries_id") REFERENCES "payload"."countries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_timezones_fk" FOREIGN KEY ("timezones_id") REFERENCES "payload"."timezones"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_country_idx" ON "payload"."users" USING btree ("country");
  CREATE INDEX "payload_locked_documents_rels_countries_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("countries_id");
  CREATE INDEX "payload_locked_documents_rels_timezones_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("timezones_id");
  -- Searchable copy of "about", and schedule names for the admin list.
  UPDATE "payload"."tutor_profiles" tp SET "about_text" = left(x.txt, 2000)
    FROM (SELECT id, string_agg(e #>> '{}', ' ') AS txt FROM "payload"."tutor_profiles", jsonb_path_query("about", 'strict $.**.text') AS e(e) GROUP BY id) x
    WHERE tp.id = x.id;
  UPDATE "payload"."schedules" s SET "label" = coalesce(nullif(btrim(concat_ws(' ', u.first_name, u.last_name)), ''), u.email)
    FROM "payload"."users" u WHERE u.id = s.user_id AND s.label IS NULL;
  DROP FUNCTION "payload"."sabina_text_to_lexical"(text);`)

  // Countries and time zones (managed in Settings afterwards), and the Homepage editor's content.
  const { ensureGeo } = await import("../geo/server");
  const { seedHomePage } = await import("../content/seed-home");
  await ensureGeo(payload, req);
  await seedHomePage(payload, req);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."countries" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."countries_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."timezones" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."countries" CASCADE;
  DROP TABLE "payload"."countries_rels" CASCADE;
  DROP TABLE "payload"."timezones" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_countries_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_timezones_fk";
  
  DROP INDEX "payload"."users_country_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_countries_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_timezones_id_idx";
  ALTER TABLE "payload"."tutor_profiles_experience" ALTER COLUMN "description" SET DATA TYPE varchar;
  ALTER TABLE "payload"."tutor_profiles" ALTER COLUMN "about" SET DATA TYPE varchar;
  ALTER TABLE "payload"."tutor_profiles" ALTER COLUMN "teaching_style" SET DATA TYPE varchar;
  ALTER TABLE "payload"."student_profiles" ALTER COLUMN "goal_details" SET DATA TYPE varchar;
  ALTER TABLE "payload"."bookings" ALTER COLUMN "tutor_notes" SET DATA TYPE varchar;
  ALTER TABLE "payload"."subjects" ALTER COLUMN "description" SET DATA TYPE varchar;
  ALTER TABLE "payload"."tutor_profiles" DROP COLUMN "about_text";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "countries_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "timezones_id";`)
}
