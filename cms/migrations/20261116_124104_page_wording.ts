import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."site_text_menu_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site_text_menu_secondary" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site_text_footer_trust" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site_text_footer_learn_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site_text_footer_company_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site_text_how_it_works_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site_text_become_tutor_reasons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site_text_become_tutor_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site_text_sign_in_student_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site_text_sign_in_tutor_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site_text_sign_in_chips" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL,
  	"label" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site_text" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"menu_portals_label" varchar,
  	"menu_student_label" varchar,
  	"menu_student_text" varchar,
  	"menu_tutor_label" varchar,
  	"menu_tutor_text" varchar,
  	"footer_subjects_title" varchar,
  	"footer_learn_title" varchar,
  	"footer_company_title" varchar,
  	"how_it_works_badge" varchar,
  	"how_it_works_title" varchar,
  	"how_it_works_intro" varchar,
  	"how_it_works_pay_badge" varchar,
  	"how_it_works_pay_title" varchar,
  	"how_it_works_pay_text" varchar,
  	"how_it_works_cta" varchar,
  	"how_it_works_secondary_cta" varchar,
  	"become_tutor_badge" varchar,
  	"become_tutor_title" varchar,
  	"become_tutor_intro" varchar,
  	"become_tutor_cta" varchar,
  	"become_tutor_calc_eyebrow" varchar,
  	"become_tutor_calc_title" varchar,
  	"become_tutor_reasons_title" varchar,
  	"become_tutor_steps_title" varchar,
  	"contact_badge" varchar,
  	"contact_title" varchar,
  	"contact_intro" varchar,
  	"contact_side_title" varchar,
  	"contact_sent_title" varchar,
  	"contact_sent_text" varchar,
  	"sign_in_student_badge" varchar,
  	"sign_in_student_title" varchar,
  	"sign_in_student_text" varchar,
  	"sign_in_tutor_badge" varchar,
  	"sign_in_tutor_title" varchar,
  	"sign_in_tutor_text" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload"."site_text_menu_links" ADD CONSTRAINT "site_text_menu_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_text_menu_secondary" ADD CONSTRAINT "site_text_menu_secondary_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_text_footer_trust" ADD CONSTRAINT "site_text_footer_trust_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_text_footer_learn_links" ADD CONSTRAINT "site_text_footer_learn_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_text_footer_company_links" ADD CONSTRAINT "site_text_footer_company_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_text_how_it_works_steps" ADD CONSTRAINT "site_text_how_it_works_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_text_become_tutor_reasons" ADD CONSTRAINT "site_text_become_tutor_reasons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_text_become_tutor_steps" ADD CONSTRAINT "site_text_become_tutor_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_text_sign_in_student_points" ADD CONSTRAINT "site_text_sign_in_student_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_text_sign_in_tutor_points" ADD CONSTRAINT "site_text_sign_in_tutor_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_text_sign_in_chips" ADD CONSTRAINT "site_text_sign_in_chips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_text"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_text_menu_links_order_idx" ON "payload"."site_text_menu_links" USING btree ("_order");
  CREATE INDEX "site_text_menu_links_parent_id_idx" ON "payload"."site_text_menu_links" USING btree ("_parent_id");
  CREATE INDEX "site_text_menu_secondary_order_idx" ON "payload"."site_text_menu_secondary" USING btree ("_order");
  CREATE INDEX "site_text_menu_secondary_parent_id_idx" ON "payload"."site_text_menu_secondary" USING btree ("_parent_id");
  CREATE INDEX "site_text_footer_trust_order_idx" ON "payload"."site_text_footer_trust" USING btree ("_order");
  CREATE INDEX "site_text_footer_trust_parent_id_idx" ON "payload"."site_text_footer_trust" USING btree ("_parent_id");
  CREATE INDEX "site_text_footer_learn_links_order_idx" ON "payload"."site_text_footer_learn_links" USING btree ("_order");
  CREATE INDEX "site_text_footer_learn_links_parent_id_idx" ON "payload"."site_text_footer_learn_links" USING btree ("_parent_id");
  CREATE INDEX "site_text_footer_company_links_order_idx" ON "payload"."site_text_footer_company_links" USING btree ("_order");
  CREATE INDEX "site_text_footer_company_links_parent_id_idx" ON "payload"."site_text_footer_company_links" USING btree ("_parent_id");
  CREATE INDEX "site_text_how_it_works_steps_order_idx" ON "payload"."site_text_how_it_works_steps" USING btree ("_order");
  CREATE INDEX "site_text_how_it_works_steps_parent_id_idx" ON "payload"."site_text_how_it_works_steps" USING btree ("_parent_id");
  CREATE INDEX "site_text_become_tutor_reasons_order_idx" ON "payload"."site_text_become_tutor_reasons" USING btree ("_order");
  CREATE INDEX "site_text_become_tutor_reasons_parent_id_idx" ON "payload"."site_text_become_tutor_reasons" USING btree ("_parent_id");
  CREATE INDEX "site_text_become_tutor_steps_order_idx" ON "payload"."site_text_become_tutor_steps" USING btree ("_order");
  CREATE INDEX "site_text_become_tutor_steps_parent_id_idx" ON "payload"."site_text_become_tutor_steps" USING btree ("_parent_id");
  CREATE INDEX "site_text_sign_in_student_points_order_idx" ON "payload"."site_text_sign_in_student_points" USING btree ("_order");
  CREATE INDEX "site_text_sign_in_student_points_parent_id_idx" ON "payload"."site_text_sign_in_student_points" USING btree ("_parent_id");
  CREATE INDEX "site_text_sign_in_tutor_points_order_idx" ON "payload"."site_text_sign_in_tutor_points" USING btree ("_order");
  CREATE INDEX "site_text_sign_in_tutor_points_parent_id_idx" ON "payload"."site_text_sign_in_tutor_points" USING btree ("_parent_id");
  CREATE INDEX "site_text_sign_in_chips_order_idx" ON "payload"."site_text_sign_in_chips" USING btree ("_order");
  CREATE INDEX "site_text_sign_in_chips_parent_id_idx" ON "payload"."site_text_sign_in_chips" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."site_text_menu_links" CASCADE;
  DROP TABLE "payload"."site_text_menu_secondary" CASCADE;
  DROP TABLE "payload"."site_text_footer_trust" CASCADE;
  DROP TABLE "payload"."site_text_footer_learn_links" CASCADE;
  DROP TABLE "payload"."site_text_footer_company_links" CASCADE;
  DROP TABLE "payload"."site_text_how_it_works_steps" CASCADE;
  DROP TABLE "payload"."site_text_become_tutor_reasons" CASCADE;
  DROP TABLE "payload"."site_text_become_tutor_steps" CASCADE;
  DROP TABLE "payload"."site_text_sign_in_student_points" CASCADE;
  DROP TABLE "payload"."site_text_sign_in_tutor_points" CASCADE;
  DROP TABLE "payload"."site_text_sign_in_chips" CASCADE;
  DROP TABLE "payload"."site_text" CASCADE;`)
}
