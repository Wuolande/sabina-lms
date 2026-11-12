import type { Payload } from "payload";
import { MENU, hrefOf } from "./menu";
import { HeaderActionsClient, type Destination, type NewItem, type Notice } from "./Actions";

type Props = { payload: Payload; visibleEntities?: { collections: string[]; globals: string[] }; user?: { role?: string } | null };

const ago = (iso: string) => {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} d`;
};

/** Header: ⌘K search, "+ New", notifications (new sign-ups for now) and the theme switch. */
export async function HeaderActions({ payload, visibleEntities, user }: Props) {
  const visible = visibleEntities ?? { collections: [], globals: [] };
  const canSee = (slug: string) => visible.collections.includes(slug);
  const isAdmin = user?.role === "admin";

  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const signups = canSee("users")
    ? await payload
        .find({ collection: "users", where: { createdAt: { greater_than: dayAgo } }, sort: "-createdAt", limit: 6, depth: 0, overrideAccess: true })
        .catch(() => ({ docs: [], totalDocs: 0 }))
    : { docs: [], totalDocs: 0 };

  const notices: Notice[] = (signups.docs as { id: string | number; name?: string; email: string; role?: string; createdAt: string }[]).map((u) => ({
    kind: "message" as const,
    href: `/admin/collections/users/${u.id}`,
    title: `New ${u.role === "tutor" ? "tutor" : u.role === "student" ? "student" : "account"}: ${u.name || u.email}`,
    sub: u.email,
    when: ago(u.createdAt),
  }));

  const destinations: Destination[] = MENU.flatMap((s) =>
    s.items
      .filter((i) => (i.kind === "view" ? !i.adminOnly || isAdmin : (!i.adminOnly || isAdmin) && (i.kind === "collection" ? visible.collections : visible.globals).includes(i.slug)))
      .map((i) => ({ href: hrefOf(i), label: i.label, section: s.title ?? "Overview", icon: i.icon })),
  );

  const creatable: [string, string, string][] = [
    ["users", "User", "Users"],
    ["bookings", "Booking", "CalendarCheck"],
    ["posts", "Blog post", "Newspaper"],
    ["training-courses", "Academy course", "GraduationCap"],
    ["media", "Upload image", "Image"],
  ];
  const newItems: NewItem[] = creatable.filter(([slug]) => canSee(slug)).map(([slug, label, icon]) => ({ href: `/admin/collections/${slug}/create`, label, icon }));

  return <HeaderActionsClient notices={notices} noticeCount={signups.totalDocs} destinations={destinations} newItems={newItems} />;
}
