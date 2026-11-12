import type { Payload, SanitizedPermissions } from "payload";
import { Logout } from "@payloadcms/ui";
import { NavHamburger, NavWrapper } from "@payloadcms/next/client";
import { Logo } from "../Brand";
import { hrefOf, visibleMenu } from "./menu";
import { NavDefaultOpen, NavLinks, type NavSection } from "./NavLinks";

type Props = {
  payload: Payload;
  permissions?: SanitizedPermissions;
  visibleEntities?: { collections: string[]; globals: string[] };
  user?: { name?: string; email?: string; role?: string } | null;
};

const ROLE_NAME: Record<string, string> = { admin: "Admin", manager: "Manager", finance: "Finance", support: "Support", editor: "Editor" };

/** Sabina sidebar. Keeps Payload's NavWrapper for open/close, the mobile overlay and saved state. */
export async function Nav({ payload, visibleEntities, user }: Props) {
  const visible = visibleEntities ?? { collections: [], globals: [] };
  const has = (slug: string) => payload.config.collections.some((c) => c.slug === slug);
  const count = async (collection: string, where: Record<string, unknown>) => {
    if (!has(collection)) return 0;
    try {
      return (await payload.count({ collection: collection as never, where: where as never, overrideAccess: true })).totalDocs;
    } catch {
      return 0;
    }
  };
  const [applications, disputes, reviews] = await Promise.all([
    count("tutor-profiles", { status: { equals: "submitted" } }),
    count("bookings", { and: [{ "issue.reportedAt": { exists: true } }, { "issue.resolved": { not_equals: true } }] }),
    count("lesson-reviews", { status: { equals: "pending" } }),
  ]);
  const badges: Record<string, number> = { applications, disputes, reviews };

  const extra = [
    ...payload.config.collections.map((c) => ({ kind: "collection" as const, slug: c.slug, label: String((c.labels?.plural as string) ?? c.slug) })),
    ...payload.config.globals.map((g) => ({ kind: "global" as const, slug: g.slug, label: String(g.label ?? g.slug) })),
  ];
  const sections: NavSection[] = visibleMenu(visible, user?.role === "admin", extra).map((s) => ({
    title: s.title,
    collapsible: s.collapsible,
    items: s.items.map((i) => ({ href: hrefOf(i), label: i.label, icon: i.icon, badge: i.badge ? badges[i.badge] : undefined })),
  }));

  const name = user?.name || user?.email || "";
  const initials = name.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");

  return (
    <NavWrapper baseClass="nav">
      <nav className="nav__wrap ep-nav" aria-label="Main">
        <a href="/admin" className="ep-nav__brand" aria-label="Sabina admin home">
          <Logo payload={payload} />
        </a>
        <NavDefaultOpen />
        <NavLinks sections={sections} />
        <div className="ep-nav__foot">
          <a href="/admin/account" className="ep-nav__user">
            <span className="ep-nav__avatar" aria-hidden="true">{initials || "?"}</span>
            <span className="ep-nav__who">
              <b>{user?.name || "Your account"}</b>
              <small>{ROLE_NAME[user?.role ?? ""] ?? "Staff"}</small>
            </span>
          </a>
          <Logout />
        </div>
      </nav>
      <div className="nav__header">
        <div className="nav__header-content">
          <NavHamburger baseClass="nav" />
        </div>
      </div>
    </NavWrapper>
  );
}
