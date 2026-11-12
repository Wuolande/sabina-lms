import type { AdminViewServerProps } from "payload";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter } from "@payloadcms/ui";
import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { Card } from "../ui";
import { RankedBars } from "../dashboard/charts";
import { getReport, parseReportRange } from "./data";

const RANGES = [["30", "30 days"], ["90", "90 days"], ["365", "12 months"]] as const;
const STATUS: Record<string, string> = { completed: "Completed", confirmed: "Upcoming or in progress", no_show: "Tutor no-show", cancelled: "Cancelled", declined: "Declined", expired: "Expired" };

/** Admin → Reports: sales, refunds, Sabina's fee, tutor earnings, monthly breakdown, top tutors and subjects, CSV exports. */
export async function ReportsView({ initPageResult, searchParams, params }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult;
  const role = (req.user as { role?: string } | null)?.role;
  if (!req.user) redirect("/admin/login");
  if (!["admin", "manager", "finance"].includes(role ?? "")) redirect("/admin");
  const range = parseReportRange((searchParams as Record<string, string> | undefined)?.range);
  const d = await getReport(req.payload, range);
  const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: d.currency, maximumFractionDigits: 2 }).format(n);
  const month = (k: string) => new Date(`${k}-01T12:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const tiles = [
    { label: "Lesson sales", value: money(d.totals.sales), note: "Payments received" },
    { label: "Refunded", value: money(d.totals.refunds), note: `Net ${money(d.totals.net)}` },
    { label: "Sabina's fee", value: money(d.totals.sabinaFee), note: "From completed lessons" },
    { label: "Tutor earnings", value: money(d.totals.tutorEarnings), note: `${money(d.totals.paidOut)} paid out` },
    { label: "Lessons completed", value: d.totals.lessons.toLocaleString(), note: `${d.totals.noShows} tutor no-shows` },
    { label: "Cancellation rate", value: `${d.totals.cancelRate}%`, note: "Of lessons that have ended" },
  ];
  const exportHref = (type: string) => `/api/reports/export?type=${type}&range=${range}`;

  return (
    <DefaultTemplate i18n={req.i18n} locale={locale} params={params} payload={req.payload} permissions={permissions} searchParams={searchParams} user={req.user ?? undefined} visibleEntities={visibleEntities}>
      <Gutter>
        <div className="ep-db">
          <header className="ep-db__head">
            <div>
              <h1 className="ep-h1">Reports</h1>
              <p className="ep-db__lead">Money and lessons over the last {range === 365 ? "12 months" : `${range} days`}. Amounts in {d.currency}.</p>
            </div>
            <div className="ep-db__controls">
              <nav className="ep-seg" aria-label="Time range">
                {RANGES.map(([v, l]) => (
                  <a key={v} href={`/admin/reports?range=${v}`} aria-current={String(range) === v ? "true" : undefined}>
                    {l}
                  </a>
                ))}
              </nav>
            </div>
          </header>

          <div className="sb-report-tiles">
            {tiles.map((t) => (
              <div key={t.label} className="ep-kpi-tile">
                <span className="ep-kpi__label">{t.label}</span>
                <span className="ep-kpi__value">{t.value}</span>
                <span className="ep-kpi-tile__note">{t.note}</span>
              </div>
            ))}
          </div>

          <Card title="By month" sub="Sales and refunds by payment date; fee and tutor earnings by lesson date." flush>
            {d.monthly.length ? (
              <div className="ep-tablewrap">
                <table className="ep-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th className="num">Lessons</th>
                      <th className="num">Sales</th>
                      <th className="num">Refunded</th>
                      <th className="num ep-hide-sm">Sabina&apos;s fee</th>
                      <th className="num ep-hide-sm">Tutor earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.monthly.map((m) => (
                      <tr key={m.month}>
                        <td>
                          <b className="ep-strong">{month(m.month)}</b>
                        </td>
                        <td className="num">{m.lessons}</td>
                        <td className="num">{money(m.sales)}</td>
                        <td className="num">{money(m.refunds)}</td>
                        <td className="num ep-hide-sm">{money(m.fee)}</td>
                        <td className="num ep-hide-sm">{money(m.tutors)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="ep-pop__empty">No payments or lessons in this period yet.</p>
            )}
          </Card>

          <div className="ep-db__row ep-db__row--8-4">
            <Card title="Top tutors" sub="By completed lessons." flush>
              {d.topTutors.length ? (
                <div className="ep-tablewrap">
                  <table className="ep-table">
                    <thead>
                      <tr>
                        <th>Tutor</th>
                        <th className="num">Lessons</th>
                        <th className="num">Earned</th>
                        <th className="num ep-hide-sm">Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.topTutors.map((t) => (
                        <tr key={t.id}>
                          <td>
                            <a className="ep-link" href={`/admin/collections/tutor-profiles/${t.id}`}>
                              <b className="ep-strong">{t.name}</b>
                            </a>
                          </td>
                          <td className="num">{t.lessons}</td>
                          <td className="num">{money(t.earned)}</td>
                          <td className="num ep-hide-sm">{t.rating ? t.rating.toFixed(1) : "–"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="ep-pop__empty">No completed lessons in this period yet.</p>
              )}
            </Card>
            <Card title="Subjects" sub="Completed lessons.">
              <RankedBars items={d.topSubjects} unit="lessons" empty={{ title: "No lessons yet", text: "Subjects are ranked here once lessons are completed." }} />
            </Card>
          </div>

          <div className="ep-db__row ep-db__row--8-4">
            <Card title="Lessons by outcome" sub="Lessons that started in this period.">
              <RankedBars items={d.statusCounts.filter((s) => s.count).map((s) => ({ label: STATUS[s.status] ?? s.status, value: s.count }))} empty={{ title: "No lessons yet", text: "Outcomes show here once lessons have taken place." }} />
            </Card>
            <Card title="Download">
              <div className="ep-quick">
                {[
                  ["payments", "Payments (CSV)"],
                  ["bookings", "Lessons (CSV)"],
                  ["payouts", "Payouts (CSV)"],
                ].map(([type, label]) => (
                  <a key={type} className="ep-quick__item" href={exportHref(type!)}>
                    <Download size={18} />
                    <span>{label}</span>
                  </a>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </Gutter>
    </DefaultTemplate>
  );
}
