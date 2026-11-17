import type { AdminViewServerProps } from "payload";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter } from "@payloadcms/ui";
import { redirect } from "next/navigation";
import { Card } from "../ui";
import { RankedBars } from "../dashboard/charts";
import { ANALYTICS_RANGES, getAnalytics, parseRange, type AnalyticsData } from "./data";

const RANGE_LABEL: Record<number, string> = { 7: "7 days", 30: "30 days", 90: "90 days", 365: "12 months" };
const CHANNEL: Record<string, string> = { direct: "Direct (typed or bookmarked)", search: "Search engines", social: "Social media", email: "Email", referral: "Other websites", campaign: "Campaigns (utm links)" };
const ACTIONS: [string, string][] = [
  ["signup", "Sign-ups"],
  ["booking_created", "Bookings started"],
  ["payment_succeeded", "Payments"],
  ["lesson_completed", "Lessons finished"],
  ["review_submitted", "Reviews written"],
  ["referral_signup", "Sign-ups from referrals"],
];
const regionName = (code: string) => {
  if (code === "??") return "Unknown";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Visitors and page views as bars and a line, drawn on the server (no client script needed). */
function Trend({ data, bucket }: { data: AnalyticsData["trend"]; bucket: string }) {
  if (!data.length)
    return (
      <div className="ep-empty ep-empty--compact">
        <b>No visits recorded yet</b>
        <p>Visits appear here a few seconds after people open the site.</p>
      </div>
    );
  const W = 720, H = 220, m = { l: 36, r: 8, t: 10, b: 26 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const max = Math.max(1, ...data.map((d) => Math.max(d.views, d.visitors)));
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  const top = Math.ceil(max / step) * step;
  const band = iw / data.length;
  const x = (i: number) => m.l + band * i + band / 2;
  const y = (v: number) => m.t + ih - (v / top) * ih;
  const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const every = Math.ceil(data.length / 8);
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.views).toFixed(1)}`).join(" ");
  return (
    <div>
      <div className="ep-legend">
        <span><i style={{ background: "var(--ep-chart-progress)" }} />Visitors</span>
        <span><i style={{ background: "var(--brand-gold, #FCC10D)" }} />Page views</span>
        <span style={{ marginLeft: "auto", color: "var(--ep-ink-3, #64748b)" }}>Per {bucket}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Visitors and page views per ${bucket}`} style={{ display: "block", maxHeight: 260 }}>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={m.l} x2={W - m.r} y1={y(top * f)} y2={y(top * f)} stroke="var(--ep-line, #e2e8f0)" strokeDasharray={f ? "3 3" : undefined} />
            <text x={m.l - 6} y={y(top * f) + 4} textAnchor="end" fontSize="10" fill="var(--ep-ink-3, #64748b)">{Math.round(top * f)}</text>
          </g>
        ))}
        {data.map((d, i) => (
          <rect key={d.date} x={x(i) - Math.min(18, band * 0.6) / 2} y={y(d.visitors)} width={Math.min(18, band * 0.6)} height={Math.max(0, m.t + ih - y(d.visitors))} rx="3" fill="var(--ep-chart-progress)">
            <title>{`${fmt(d.date)}: ${d.visitors} visitors, ${d.views} page views`}</title>
          </rect>
        ))}
        <path d={line} fill="none" stroke="var(--brand-gold, #FCC10D)" strokeWidth="2.5" strokeLinejoin="round" />
        {data.map((d, i) => <circle key={`p${d.date}`} cx={x(i)} cy={y(d.views)} r="3.5" fill="var(--brand-gold, #FCC10D)" />)}
        {data.map((d, i) => (i % every === 0 ? <text key={d.date} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--ep-ink-3, #64748b)">{fmt(d.date)}</text> : null))}
      </svg>
      <details style={{ marginTop: 8 }}>
        <summary className="ep-linkbtn">View as table</summary>
        <div className="ep-tablewrap">
          <table className="ep-table">
            <thead><tr><th>{cap(bucket)} starting</th><th className="num">Visitors</th><th className="num">Page views</th></tr></thead>
            <tbody>{data.map((d) => <tr key={d.date}><td>{fmt(d.date)}</td><td className="num">{d.visitors}</td><td className="num">{d.views}</td></tr>)}</tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

/** Funnel as stacked rows: how many reached each step, and what share moved on from the step before. */
function Funnel({ steps }: { steps: AnalyticsData["funnel"]["students"] }) {
  const max = Math.max(1, ...steps.map((s) => s.value));
  return (
    <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 14 }}>
      {steps.map((s, i) => (
        <li key={s.label} style={{ display: "grid", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <span>
              <b className="ep-strong">{s.label}</b> <span style={{ fontSize: 12, color: "var(--ep-ink-3, #64748b)" }}>{s.hint}</span>
            </span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              <b className="ep-strong">{s.value.toLocaleString()}</b>
              {i > 0 && <span style={{ fontSize: 12, color: s.ofPrevious < 30 ? "#b45309" : "var(--ep-ink-3, #64748b)" }}> · {s.ofPrevious}% of previous step</span>}
            </span>
          </div>
          <span aria-hidden="true" style={{ height: 12, borderRadius: 999, background: "var(--ep-surface-2, #f1f5f9)", overflow: "hidden" }}>
            <span style={{ display: "block", height: "100%", width: `${Math.min(100, Math.max(s.value ? 2 : 0, (s.value / max) * 100))}%`, background: i === 0 ? "var(--ep-chart-progress)" : "var(--brand-gold, #FCC10D)", borderRadius: 999 }} />
          </span>
        </li>
      ))}
    </ol>
  );
}

function Tile({ label, value, note, delta }: { label: string; value: string; note?: string; delta?: number | null }) {
  return (
    <div className="ep-kpi-tile">
      <span className="ep-kpi__label">{label}</span>
      <span className="ep-kpi__value">{value}</span>
      <span className="ep-kpi-tile__note">
        {delta != null ? <b style={{ color: delta >= 0 ? "#15803d" : "#b91c1c" }}>{delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}%</b> : null} {note}
      </span>
    </div>
  );
}

/** Admin › Analytics: Sabina's own visitor analytics and the sign-up → booking funnel. */
export async function AnalyticsView({ initPageResult, searchParams, params }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult;
  const role = (req.user as { role?: string } | null)?.role;
  if (!req.user) redirect("/admin/login");
  if (!["admin", "manager", "editor", "finance"].includes(role ?? "")) redirect("/admin");
  const days = parseRange((searchParams as Record<string, string> | undefined)?.range);
  const d = await getAnalytics(req.payload, days);
  const period = RANGE_LABEL[days] ?? `${days} days`;
  const fmt = (n: number) => n.toLocaleString();

  return (
    <DefaultTemplate i18n={req.i18n} locale={locale} params={params} payload={req.payload} permissions={permissions} searchParams={searchParams} user={req.user ?? undefined} visibleEntities={visibleEntities}>
      <Gutter>
        <div className="ep-db">
          <header className="ep-db__head">
            <div>
              <h1 className="ep-h1">Analytics</h1>
              <p className="ep-db__lead">
                Visits and sign-ups over the last {period}, compared with the {period} before. {d.live ? <b>{d.live} on the site now.</b> : null}
              </p>
            </div>
            <div className="ep-db__controls">
              <nav className="ep-seg" aria-label="Time range">
                {ANALYTICS_RANGES.map((v) => (
                  <a key={v} href={`/admin/analytics?range=${v}`} aria-current={days === v ? "true" : undefined}>
                    {RANGE_LABEL[v]}
                  </a>
                ))}
              </nav>
            </div>
          </header>

          <div className="sb-report-tiles">
            <Tile label="Visitors" value={fmt(d.totals.visitors)} delta={d.change.visitors} note="different people" />
            <Tile label="Visits" value={fmt(d.totals.sessions)} delta={d.change.sessions} note="sessions" />
            <Tile label="Page views" value={fmt(d.totals.views)} delta={d.change.views} note={`${d.totals.viewsPerSession} per visit`} />
            <Tile label="Left after one page" value={`${d.totals.bounceRate}%`} note="of visits (bounce rate)" />
            <Tile label="Sign-ups" value={fmt(d.actions.signup ?? 0)} note={`${d.totals.visitors ? Math.round(((d.actions.signup ?? 0) / d.totals.visitors) * 1000) / 10 : 0}% of visitors`} />
            <Tile label="Payments" value={fmt(d.actions.payment_succeeded ?? 0)} note={`${fmt(d.actions.lesson_completed ?? 0)} lessons finished`} />
          </div>

          <Card title="Visitors over time" sub="Bars are visitors; the line is page views.">
            <Trend data={d.trend} bucket={d.bucket} />
          </Card>

          <div className="ep-db__row ep-db__row--8-4">
            <Card title="Student funnel" sub={`Students who signed up in the last ${period}, followed through to booking again. Low percentages show where people drop off.`}>
              <Funnel steps={d.funnel.students} />
              {d.funnel.partialVisitors && <p style={{ fontSize: 12, color: "var(--ep-ink-3, #64748b)", marginTop: 12 }}>Visitor counting started recently, so this funnel starts from sign-ups. Visitors are added once there are more visits recorded than sign-ups.</p>}
            </Card>
            <Card title="Tutor funnel" sub={`Tutors who signed up in the last ${period}.`}>
              <Funnel steps={d.funnel.tutors} />
            </Card>
          </div>

          <div className="ep-db__row ep-db__row--8-4">
            <Card title="Pages" sub="Most viewed." flush>
              {d.pages.length ? (
                <div className="ep-tablewrap">
                  <table className="ep-table">
                    <thead><tr><th>Page</th><th className="num">Views</th><th className="num">Visitors</th></tr></thead>
                    <tbody>
                      {d.pages.map((p) => (
                        <tr key={p.path}>
                          <td><a className="ep-link" href={p.path} target="_blank" rel="noopener noreferrer">{p.path}</a></td>
                          <td className="num">{fmt(p.views)}</td>
                          <td className="num">{fmt(p.visitors)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="ep-pop__empty">No page views yet.</p>
              )}
            </Card>
            <Card title="Where visits start" sub="First page of each visit.">
              <RankedBars items={d.entries} unit="visits" empty={{ title: "No visits yet", text: "Landing pages show here." }} />
            </Card>
          </div>

          <div className="ep-db__row ep-db__row--8-4">
            <Card title="Sources" sub="Where visits came from.">
              <RankedBars items={d.sources} unit="visits" empty={{ title: "No visits yet", text: "Google, WhatsApp, Facebook and others show here." }} />
            </Card>
            <Card title="Channels">
              <RankedBars items={d.channels.map((c) => ({ label: CHANNEL[c.label] ?? cap(c.label), value: c.value }))} unit="visits" empty={{ title: "No visits yet", text: "Search, social, email and direct visits show here." }} />
            </Card>
          </div>

          <div className="ep-db__row ep-db__row--8-4">
            <Card title="Sign-ups by source" sub="Where people who created an account first came from.">
              <RankedBars items={d.signupSources} unit="sign-ups" empty={{ title: "No sign-ups yet", text: "Shows which sources bring people who sign up, not just visit." }} />
            </Card>
            <Card title="Key actions">
              <RankedBars items={ACTIONS.map(([k, l]) => ({ label: l, value: d.actions[k] ?? 0 })).filter((a) => a.value)} empty={{ title: "Nothing yet", text: "Sign-ups, bookings, payments and reviews are counted here." }} />
            </Card>
          </div>

          <div className="ep-db__row ep-db__row--8-4">
            <Card title="Countries" sub="Visitors.">
              <RankedBars items={d.countries.map((c) => ({ label: regionName(c.label), value: c.value }))} unit="visitors" empty={{ title: "No visits yet", text: "Countries show here on the live site." }} />
            </Card>
            <Card title="Devices">
              <RankedBars items={d.devices.map((x) => ({ label: cap(x.label), value: x.value }))} unit="visitors" empty={{ title: "No visits yet", text: "Phones, tablets and computers show here." }} />
              {d.browsers.length > 0 && (
                <>
                  <p className="ep-kpi__label" style={{ margin: "16px 0 6px" }}>Browsers</p>
                  <RankedBars items={d.browsers} unit="visitors" />
                  <p className="ep-kpi__label" style={{ margin: "16px 0 6px" }}>Systems</p>
                  <RankedBars items={d.systems} unit="visitors" />
                </>
              )}
            </Card>
          </div>

          <p className="ep-db__lead" style={{ fontSize: 12 }}>
            Counted on Sabina&apos;s own servers: no Google, Facebook or other trackers. No IP addresses or names are stored, bots are ignored, and browsers set to &quot;Do Not Track&quot; aren&apos;t counted. History is kept for 25 months.
          </p>
        </div>
      </Gutter>
    </DefaultTemplate>
  );
}
