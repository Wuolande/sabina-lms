/**
 * Admin navigation: one definition used by the sidebar and the ⌘K command palette.
 * Icons are Lucide names (rendered on the client). Items the user can't see, or collections that
 * don't exist yet, are filtered out, so the menu grows as each migration phase lands.
 * Any collection/global not listed here appears automatically under "Other".
 */
export type MenuItem = {
  kind: "collection" | "global" | "view";
  slug: string;
  label: string;
  icon: string;
  href?: string;
  badge?: "applications" | "disputes" | "reviews" | "flagged";
  adminOnly?: boolean;
};
export type MenuSection = { title?: string; collapsible?: boolean; items: MenuItem[] };

export const MENU: MenuSection[] = [
  {
    items: [
      { kind: "view", slug: "dashboard", label: "Dashboard", icon: "LayoutDashboard", href: "/admin" },
    ],
  },
  {
    title: "People",
    collapsible: true,
    items: [
      { kind: "collection", slug: "users", label: "All users", icon: "Users" },
      { kind: "view", slug: "tutor-applications", label: "Tutor applications", icon: "ClipboardList", badge: "applications", href: "/admin/collections/tutor-profiles?where[status][equals]=submitted" },
      { kind: "collection", slug: "tutor-profiles", label: "Tutors", icon: "GraduationCap" },
      { kind: "collection", slug: "schedules", label: "Tutor schedules", icon: "Clock" },
      { kind: "collection", slug: "student-profiles", label: "Students", icon: "UsersRound" },
      { kind: "collection", slug: "private-files", label: "Private documents", icon: "ShieldAlert" },
    ],
  },
  {
    title: "Teaching",
    collapsible: true,
    items: [
      { kind: "collection", slug: "bookings", label: "Bookings", icon: "CalendarCheck" },
      { kind: "collection", slug: "lessons", label: "Lessons", icon: "Video" },
      { kind: "collection", slug: "homework", label: "Homework", icon: "BookOpen" },
      { kind: "collection", slug: "reviews", label: "Reviews", icon: "Star" },
      { kind: "view", slug: "lesson-problems", label: "Reported problems", icon: "ShieldAlert", badge: "disputes", href: "/admin/collections/bookings?where[issue.reportedAt][exists]=true&where[issue.resolved][not_equals]=true" },
      { kind: "collection", slug: "subjects", label: "Subjects", icon: "Layers" },
      { kind: "collection", slug: "languages", label: "Languages", icon: "Languages" },
    ],
  },
  {
    title: "Money",
    collapsible: true,
    items: [
      { kind: "collection", slug: "payments", label: "Payments", icon: "Wallet" },
      { kind: "collection", slug: "invoices", label: "Invoices", icon: "Receipt" },
      { kind: "collection", slug: "refunds", label: "Refunds", icon: "Repeat" },
      { kind: "collection", slug: "payouts", label: "Tutor payouts", icon: "Banknote" },
      { kind: "collection", slug: "payout-methods", label: "Payout details", icon: "Landmark" },
    ],
  },
  {
    title: "Academy",
    collapsible: true,
    items: [
      { kind: "collection", slug: "training-courses", label: "Courses", icon: "GraduationCap" },
      { kind: "collection", slug: "training-modules", label: "Modules", icon: "BookOpen" },
      { kind: "collection", slug: "training-quizzes", label: "Quizzes", icon: "ListChecks" },
      { kind: "collection", slug: "training-live-sessions", label: "Live cohorts", icon: "Radio" },
    ],
  },
  {
    title: "Communication",
    collapsible: true,
    items: [
      { kind: "collection", slug: "conversations", label: "Conversations", icon: "MessagesSquare" },
      { kind: "view", slug: "flagged-conversations", label: "Flagged for review", icon: "ShieldAlert", badge: "flagged", href: "/admin/collections/conversations?where[flagged][equals]=true" },
      { kind: "collection", slug: "messages", label: "All messages", icon: "MessageSquare" },
      { kind: "collection", slug: "notifications", label: "Notifications", icon: "Bell" },
      { kind: "collection", slug: "email-templates", label: "Emails", icon: "Mail" },
      { kind: "collection", slug: "email-log", label: "Email log", icon: "MailCheck" },
    ],
  },
  {
    title: "Website",
    collapsible: true,
    items: [
      { kind: "global", slug: "home-page", label: "Homepage", icon: "House" },
      { kind: "collection", slug: "pages", label: "Pages", icon: "ScrollText" },
      { kind: "collection", slug: "posts", label: "Blog posts", icon: "Newspaper" },
      { kind: "collection", slug: "blog-categories", label: "Blog categories", icon: "Tags" },
      { kind: "collection", slug: "media", label: "Media library", icon: "Image" },
      { kind: "collection", slug: "redirects", label: "Redirects", icon: "CornerDownRight" },
    ],
  },
  {
    title: "Settings",
    collapsible: true,
    items: [
      { kind: "global", slug: "site-settings", label: "Site settings", icon: "Settings" },
      { kind: "global", slug: "seo-settings", label: "SEO", icon: "Search", adminOnly: true },
      { kind: "global", slug: "platform-settings", label: "Fees & policies", icon: "Percent", adminOnly: true },
      { kind: "global", slug: "payment-settings", label: "Payment gateways", icon: "Plug", adminOnly: true },
      { kind: "global", slug: "video-settings", label: "Classroom & video", icon: "Video", adminOnly: true },
      { kind: "global", slug: "email-settings", label: "Email", icon: "Mail", adminOnly: true },
      { kind: "collection", slug: "audit-log", label: "Audit log", icon: "ScrollText", adminOnly: true },
    ],
  },
];

export const hrefOf = (i: MenuItem): string => i.href ?? `/admin/${i.kind === "collection" ? "collections" : "globals"}/${i.slug}`;

const HIDDEN = ["payload-preferences", "payload-locked-documents", "payload-migrations", "payload-kv", "payload-folders", "payload-jobs"];

/** Sections the current user can see, plus "Other" for anything not listed above. */
export function visibleMenu(
  visible: { collections: string[]; globals: string[] },
  isAdmin: boolean,
  extra: { kind: "collection" | "global"; slug: string; label: string }[],
): MenuSection[] {
  const listed = new Set(MENU.flatMap((s) => s.items.map((i) => `${i.kind}:${i.slug}`)));
  const ok = (i: MenuItem) =>
    i.kind === "view" ? !i.adminOnly || isAdmin : (!i.adminOnly || isAdmin) && (i.kind === "collection" ? visible.collections : visible.globals).includes(i.slug);
  const sections = MENU.map((s) => ({ ...s, items: s.items.filter(ok) })).filter((s) => s.items.length);
  const other = extra.filter(
    (e) => !HIDDEN.includes(e.slug) && !listed.has(`${e.kind}:${e.slug}`) && (e.kind === "collection" ? visible.collections : visible.globals).includes(e.slug),
  );
  if (other.length) sections.push({ title: "Other", items: other.map((e) => ({ ...e, icon: "Folder" })) });
  return sections;
}
