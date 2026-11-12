/**
 * Portal navigation for students and tutors. `phase` marks sections that are still being rebuilt
 * on Payload: the shell shows a "coming in phase N" panel for them instead of the legacy page.
 * Remove `phase` from an item when its screens land.
 */
export type PortalRole = "student" | "tutor";
export type NavItem = { href: string; label: string; short?: string; icon: string; exact?: boolean; phase?: number; primary?: boolean };

export const PHASE_NAMES: Record<number, string> = {
  2: "Tutors & catalogue",
  3: "Scheduling & bookings",
  4: "Payments",
  5: "Classroom & lessons",
  6: "Messaging & notifications",
  7: "Content & academy",
};

export const NAV: Record<PortalRole, NavItem[]> = {
  student: [
    { href: "/student", label: "Home", icon: "LayoutDashboard", exact: true, primary: true },
    { href: "/student/lessons", label: "My lessons", short: "Lessons", icon: "BookOpen", phase: 5, primary: true },
    { href: "/student/calendar", label: "Calendar", icon: "CalendarDays", phase: 3, primary: true },
    { href: "/student/messages", label: "Messages", icon: "MessageSquare", phase: 6, primary: true },
    { href: "/student/favorites", label: "Saved tutors", icon: "Heart", phase: 2 },
    { href: "/student/progress", label: "Progress", icon: "TrendingUp", phase: 5 },
    { href: "/student/payments", label: "Payments", icon: "CreditCard", phase: 4 },
    { href: "/student/billing", label: "Invoices", icon: "Receipt", phase: 4 },
    { href: "/student/notifications", label: "Notifications", icon: "Bell", phase: 6 },
    { href: "/student/profile", label: "Profile", icon: "User", phase: 2 },
    { href: "/student/settings", label: "Account settings", icon: "Settings" },
  ],
  tutor: [
    { href: "/tutor", label: "Home", icon: "LayoutDashboard", exact: true, primary: true },
    { href: "/tutor/calendar", label: "Schedule", icon: "CalendarDays", phase: 3, primary: true },
    { href: "/tutor/lessons", label: "Lessons", icon: "BookOpen", phase: 5, primary: true },
    { href: "/tutor/messages", label: "Messages", icon: "MessageSquare", phase: 6, primary: true },
    { href: "/tutor/students", label: "My students", icon: "Users", phase: 5 },
    { href: "/tutor/availability", label: "Availability", icon: "Clock", phase: 3 },
    { href: "/tutor/earnings", label: "Earnings", icon: "Wallet", phase: 4 },
    { href: "/tutor/reviews", label: "Reviews", icon: "Star", phase: 5 },
    { href: "/tutor/training", label: "Academy", icon: "GraduationCap", phase: 7 },
    { href: "/tutor/notifications", label: "Notifications", icon: "Bell", phase: 6 },
    { href: "/tutor/profile", label: "Public profile", icon: "User", phase: 2 },
    { href: "/tutor/settings", label: "Account settings", icon: "Settings" },
  ],
};

export const isActive = (path: string, item: NavItem) => (item.exact ? path === item.href : path === item.href || path.startsWith(`${item.href}/`));

/** The nav item that owns a path (longest matching prefix). */
export const itemFor = (role: PortalRole, path: string) =>
  [...NAV[role]].sort((a, b) => b.href.length - a.href.length).find((i) => isActive(path, i));
