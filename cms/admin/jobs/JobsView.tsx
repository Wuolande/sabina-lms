import type { AdminViewServerProps } from "payload";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter } from "@payloadcms/ui";
import { redirect } from "next/navigation";
import { jobStatus } from "@/cms/scheduling/housekeeping";
import { JobsPanel } from "./JobsPanel";

/** Admin → Scheduled jobs: set up an external scheduler for reminders and expiries. */
export async function JobsView({ initPageResult, searchParams, params }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult;
  if (!req.user) redirect("/admin/login");
  if ((req.user as { role?: string }).role !== "admin") redirect("/admin");
  const status = await jobStatus(req.payload);
  const site = (process.env.NEXT_PUBLIC_APP_URL || "https://sabina.education").replace(/\/+$/, "");
  return (
    <DefaultTemplate i18n={req.i18n} locale={locale} params={params} payload={req.payload} permissions={permissions} searchParams={searchParams} user={req.user ?? undefined} visibleEntities={visibleEntities}>
      <Gutter>
        <div className="ep-db">
          <header className="ep-db__head">
            <div>
              <h1 className="ep-h1">Scheduled jobs</h1>
              <p className="ep-db__lead">Reminders, unpaid bookings and lesson attendance are handled by one job. Ask a free scheduler to call it every 10 minutes.</p>
            </div>
          </header>
          <JobsPanel initial={status} url={`${site}/api/cron/housekeeping`} />
        </div>
      </Gutter>
    </DefaultTemplate>
  );
}
