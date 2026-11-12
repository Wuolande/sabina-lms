import type { AdminViewServerProps } from "payload";
import { Gutter } from "@payloadcms/ui";
import { ArrowUpRight, CalendarCheck, ClipboardList, GraduationCap, Image as ImageIcon, Settings, UserPlus, Users, UsersRound, Wallet } from "lucide-react";
import { Card, Delta, IconChip, StatusPill } from "../ui";
import { getDashboardData, parseRange } from "./data";
import { Sparkline, StatusBars } from "./charts";

const RANGES = [["7", "7 days"], ["30", "30 days"], ["90", "90 days"]] as const;
const ago = (iso: string) => {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : m < 2880 ? "Yesterday" : `${Math.round(m / 1440)} days ago`;
};
const ROLE: Record<string, string> = { admin: "Admin", manager: "Manager", finance: "Finance", support: "Support", editor: "Editor", tutor: "Tutor", student: "Student" };

/** Migration roadmap shown on the dashboard until every phase has landed. */
const PHASES = [
  ["Foundation", "Payload, admin, Cloudflare R2 storage"],
  ["Accounts & roles", "One sign-in for staff, tutors and students"],
  ["Tutors & catalogue", "Applications, verification, subjects, marketplace"],
  ["Scheduling & bookings", "Availability, time zones, double-booking guard"],
  ["Payments", "Stripe, Paystack, invoices, refunds, payouts"],
  ["Classroom & lessons", "LiveKit, whiteboard, homework, reviews"],
  ["Messaging & jobs", "Chat, notifications, emails, reminders"],
  ["Content & academy", "Blog, pages, SEO, tutor training"],
  ["Dashboards & launch", "Reports, cleanup, launch checklist"],
] as const;
const CURRENT_PHASE = 7;

/** The Sabina dashboard (replaces Payload's default collection grid). */
export async function DashboardView({ initPageResult, searchParams }: AdminViewServerProps) {
  const { req } = initPageResult;
  const range = parseRange((searchParams as Record<string, string> | undefined)?.range);
  const d = await getDashboardData(req.payload, range);
  const user = req.user as { name?: string; firstName?: string; timezone?: string } | null;
  const hour = +new Date().toLocaleString("en-GB", { hour: "numeric", hour12: false, timeZone: user?.timezone || "UTC" });
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const first = user?.firstName || user?.name?.split(" ")[0];
  const period = `the last ${range} days`;
  const share = (v: number) => `${d.totals.all ? (v / d.totals.all) * 100 : 0}%`;

  return (
    <Gutter>
      <div className="ep-db">
        <header className="ep-db__head">
          <div>
            <h1 className="ep-h1 sb-hero__title">
              {greet}
              {first ? `, ${first}` : ""}.
            </h1>
            <p className="ep-db__lead">Here&apos;s how Sabina is doing over {period}.</p>
          </div>
          <div className="ep-db__controls">
            <nav className="ep-seg" aria-label="Time range">
              {RANGES.map(([v, l]) => (
                <a key={v} href={`/admin?range=${v}`} aria-current={String(range) === v ? "true" : undefined}>
                  {l}
                </a>
              ))}
            </nav>
            <a className="ep-btn ep-btn--secondary" href="/" target="_blank" rel="noopener noreferrer">
              View website <ArrowUpRight size={16} />
            </a>
          </div>
        </header>

        <div className="ep-db__row ep-db__row--top">
          <section className="ep-hero" aria-labelledby="sb-hero-title">
            <div className="ep-hero__top">
              <span id="sb-hero-title" className="ep-hero__label">
                <UserPlus size={16} /> New sign-ups
              </span>
              {d.signups.count || d.signups.delta ? <Delta value={d.signups.delta} /> : null}
            </div>
            <div className="ep-hero__num">
              {d.signups.count}
              <small>in {period}</small>
            </div>
            <Sparkline data={d.signups.spark} color="#FFFFFF" height={56} />
            <div className="ep-hero__split" aria-label={`${d.totals.students} students, ${d.totals.tutors} tutors, ${d.totals.staff} staff`}>
              <div className="ep-hero__bar" aria-hidden="true">
                <i style={{ width: share(d.totals.students), background: "#7B95F0" }} />
                <i style={{ width: share(d.totals.tutors), background: "var(--brand-accent, #F9C31C)" }} />
                <i style={{ width: share(d.totals.staff), background: "#34D399" }} />
              </div>
              <div className="ep-hero__legend">
                <span><i style={{ background: "#7B95F0" }} />Students <b>{d.totals.students}</b></span>
                <span><i style={{ background: "var(--brand-accent, #F9C31C)" }} />Tutors <b>{d.totals.tutors}</b></span>
                <span><i style={{ background: "#34D399" }} />Staff <b>{d.totals.staff}</b></span>
              </div>
            </div>
            <div className="ep-hero__actions">
              <a className="ep-btn ep-btn--light" href="/admin/collections/users?sort=-createdAt">
                Review new accounts
              </a>
              <a className="ep-btn ep-btn--ghost-inverse" href="/admin/collections/users/create">
                Add a user
              </a>
            </div>
          </section>

          <div className="ep-kpis">
            <a className="ep-kpi-tile" href="/admin/collections/users?where[role][equals]=student">
              <div className="ep-kpi-tile__top">
                <IconChip tone="accent">
                  <UsersRound />
                </IconChip>
              </div>
              <span className="ep-kpi__label">Students</span>
              <span className="ep-kpi__value">{d.totals.students}</span>
              <Sparkline data={d.studentSpark} height={28} />
            </a>
            <a className="ep-kpi-tile" href="/admin/collections/users?where[role][equals]=tutor">
              <div className="ep-kpi-tile__top">
                <IconChip tone="warning">
                  <GraduationCap />
                </IconChip>
              </div>
              <span className="ep-kpi__label">Tutors</span>
              <span className="ep-kpi__value">{d.totals.tutors}</span>
              <Sparkline data={d.tutorSpark} height={28} color="var(--brand-accent-dark, #C77F02)" />
            </a>
            <a className="ep-kpi-tile" href="/admin/collections/bookings">
              <div className="ep-kpi-tile__top">
                <IconChip tone="success">
                  <CalendarCheck />
                </IconChip>
              </div>
              <span className="ep-kpi__label">Lessons booked</span>
              <span className="ep-kpi__value">{d.lessons.booked.toLocaleString()}</span>
              <span className="ep-kpi-tile__note">
                {d.lessons.upcoming} upcoming{d.lessons.requests ? ` · ${d.lessons.requests} awaiting tutors` : ""}
              </span>
            </a>
            <a className="ep-kpi-tile" href="/admin/collections/payments">
              <div className="ep-kpi-tile__top">
                <IconChip>
                  <Wallet />
                </IconChip>
              </div>
              <span className="ep-kpi__label">Revenue</span>
              <span className="ep-kpi__value">{new Intl.NumberFormat("en-US", { style: "currency", currency: d.revenue.currency, maximumFractionDigits: 0 }).format(d.revenue.gross)}</span>
              <span className="ep-kpi-tile__note">
                {d.revenue.count} payments{d.revenue.payoutsDue ? ` · ${d.revenue.payoutsDue} payouts to send` : ""}
              </span>
            </a>
          </div>
        </div>

        <div className="ep-db__row ep-db__row--8-4">
          <Card title="Sign-ups over time" sub={`${range === 90 ? "Weekly" : "Daily"} new accounts by role, ${period}.`}>
            <StatusBars buckets={d.buckets} />
          </Card>
          <Card title="Migration roadmap" sub="Every backend moving onto Payload, phase by phase.">
            <ol className="sb-roadmap">
              {PHASES.map(([title, sub], i) => (
                <li key={title} className={i < CURRENT_PHASE ? "is-done" : i === CURRENT_PHASE ? "is-now" : undefined}>
                  <span className="sb-step">{i < CURRENT_PHASE ? "✓" : i}</span>
                  <span>
                    <b>{title}</b>
                    <small>{sub}</small>
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="ep-db__row ep-db__row--8-4">
          <Card
            title="Newest accounts"
            sub="Newest first."
            flush
            action={
              <a className="ep-btn ep-btn--secondary ep-btn--sm" href="/admin/collections/users">
                View all
              </a>
            }
          >
            {d.latest.length ? (
              <div className="ep-tablewrap">
                <table className="ep-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th className="num ep-hide-sm">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.latest.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <a className="ep-link" href={`/admin/collections/users/${u.id}`}>
                            <b className="ep-strong">{u.name || u.email}</b>
                          </a>
                          <small className="ep-cellsub">{u.email}</small>
                        </td>
                        <td>
                          <span className={`sb-role sb-role--${u.role === "tutor" || u.role === "student" || u.role === "admin" ? u.role : "staff"}`}>{ROLE[u.role ?? ""] ?? u.role}</span>
                        </td>
                        <td>
                          <StatusPill status={u.status === "active" ? "active" : "inactive"} label={u.status === "active" ? "Active" : u.status === "suspended" ? "Suspended" : "Deactivated"} />
                        </td>
                        <td className="num ep-hide-sm">{ago(u.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="ep-pop__empty">No accounts yet.</p>
            )}
          </Card>
          <Card title="Quick actions">
            <div className="ep-quick">
              <a className="ep-quick__item" href="/admin/collections/users/create">
                <IconChip tone="accent">
                  <Users />
                </IconChip>
                <span>Add a staff member</span>
              </a>
              <a className="ep-quick__item" href="/admin/collections/media/create">
                <IconChip>
                  <ImageIcon />
                </IconChip>
                <span>Upload to media library</span>
              </a>
              <a className="ep-quick__item" href="/admin/globals/site-settings">
                <IconChip>
                  <Settings />
                </IconChip>
                <span>Brand &amp; site settings</span>
              </a>
              <a className="ep-quick__item" href="/admin-legacy">
                <IconChip tone="warning">
                  <ClipboardList />
                </IconChip>
                <span>Open legacy admin (until phase 8)</span>
              </a>
            </div>
          </Card>
        </div>
      </div>
    </Gutter>
  );
}
