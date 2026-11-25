import type { AdminViewServerProps } from "payload";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter } from "@payloadcms/ui";
import { redirect } from "next/navigation";
import { demoPlan, demoStatus } from "@/cms/seed/demo";
import { DemoPanel } from "./DemoPanel";

/** Admin → Demo data: load or remove example tutors, students and lessons. */
export async function DemoView({ initPageResult, searchParams, params }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult;
  if (!req.user) redirect("/admin/login");
  if ((req.user as { role?: string }).role !== "admin") redirect("/admin");
  const status = await demoStatus(req.payload);
  return (
    <DefaultTemplate i18n={req.i18n} locale={locale} params={params} payload={req.payload} permissions={permissions} searchParams={searchParams} user={req.user ?? undefined} visibleEntities={visibleEntities}>
      <Gutter>
        <div className="ep-db">
          <header className="ep-db__head">
            <div>
              <h1 className="ep-h1">Demo data</h1>
              <p className="ep-db__lead">Fill the site with example tutors, students, lessons, reviews and messages, so it looks lived-in for demos. Remove it all with one click before you launch.</p>
            </div>
          </header>
          <DemoPanel initial={status} plan={demoPlan()} />
        </div>
      </Gutter>
    </DefaultTemplate>
  );
}
