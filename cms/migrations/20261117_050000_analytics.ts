import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/** Sabina's own analytics events, in a separate schema so Payload's schema sync never touches it. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE SCHEMA IF NOT EXISTS "analytics";
  CREATE TABLE IF NOT EXISTS "analytics"."events" (
    "id" bigserial PRIMARY KEY,
    "at" timestamptz NOT NULL DEFAULT now(),
    "type" varchar(40) NOT NULL,
    "path" varchar(300),
    "visitor" varchar(40),
    "session" varchar(40),
    "user_id" integer,
    "source" varchar(120),
    "channel" varchar(20),
    "country" varchar(2),
    "device" varchar(10),
    "browser" varchar(20),
    "os" varchar(20),
    "meta" jsonb
  );
  CREATE INDEX IF NOT EXISTS "events_at_idx" ON "analytics"."events" ("at");
  CREATE INDEX IF NOT EXISTS "events_type_at_idx" ON "analytics"."events" ("type", "at");
  CREATE INDEX IF NOT EXISTS "events_visitor_idx" ON "analytics"."events" ("visitor");
  CREATE INDEX IF NOT EXISTS "events_user_idx" ON "analytics"."events" ("user_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "analytics"."events"; DROP SCHEMA IF EXISTS "analytics";`)
}
