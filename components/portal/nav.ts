/** Portal navigation for students and tutors. `primary` items also appear in the phone tab bar. */
export type PortalRole = "student" | "tutor";
export type NavItem = { href: string; label: string; short?: string; icon: string; exact?: boolean; primary?: boolean };

export const NAV: Record<PortalRole, NavItem[]> = {
  student: [
    { href: "/student", label: "Home", icon: "LayoutDashboard", exact: true, primary: true },
    { href: "/student/lessons", label: "My lessons", short: "Lessons", icon: "BookOpen", primary: true },
    { href: "/student/calendar", label: "Calendar", icon: "CalendarDays", primary: true },
    { href: "/student/messages", label: "Messages", icon: "MessageSquare", primary: true },
    { href: "/student/favorites", label: "Saved tutors", icon: "Heart" },
    { href: "/student/progress", label: "Progress", icon: "TrendingUp" },
    { href: "/student/payments", label: "Payments", icon: "CreditCard" },
    { href: "/student/notifications", label: "Notifications", icon: "Bell" },
    { href: "/student/profile", label: "Learning goals", icon: "Target" },
    { href: "/student/settings", label: "Account settings", icon: "Settings" },
  ],
  tutor: [
    { href: "/tutor", label: "Home", icon: "LayoutDashboard", exact: true, primary: true },
    { href: "/tutor/calendar", label: "Schedule", icon: "CalendarDays", primary: true },
    { href: "/tutor/lessons", label: "Lessons", icon: "BookOpen", primary: true },
    { href: "/tutor/messages", label: "Messages", icon: "MessageSquare", primary: true },
    { href: "/tutor/students", label: "My students", icon: "Users" },
    { href: "/tutor/availability", label: "Availability", icon: "Clock" },
    { href: "/tutor/earnings", label: "Earnings", icon: "Wallet" },
    { href: "/tutor/reviews", label: "Reviews", icon: "Star" },
    { href: "/tutor/training", label: "Academy", icon: "GraduationCap" },
    { href: "/tutor/notifications", label: "Notifications", icon: "Bell" },
    { href: "/tutor/profile", label: "Profile & application", short: "Profile", icon: "User" },
    { href: "/tutor/settings", label: "Account settings", icon: "Settings" },
  ],
};

export const isActive = (path: string, item: NavItem) => (item.exact ? path === item.href : path === item.href || path.startsWith(`${item.href}/`));

/** The nav item that owns a path (longest matching prefix). */
export const itemFor = (role: PortalRole, path: string) =>
  [...NAV[role]].sort((a, b) => b.href.length - a.href.length).find((i) => isActive(path, i));
