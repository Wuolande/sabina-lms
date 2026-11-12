import type { Access, FieldAccess, PayloadRequest } from "payload";

/**
 * Sabina roles.
 *
 * Staff (can open the Payload admin at /admin):
 *  - admin    everything, including users, roles and platform settings
 *  - manager  operations: tutors, students, bookings, lessons, reviews, reports
 *  - finance  payments, invoices, payouts, refunds, reports
 *  - support  read people and bookings, handle disputes and messages
 *  - editor   website content, blog, academy content
 *
 * Learners and teachers (use the student and tutor portals, never /admin):
 *  - tutor
 *  - student
 */
export const STAFF_ROLES = ["admin", "manager", "finance", "support", "editor"] as const;
export const ALL_ROLES = [...STAFF_ROLES, "tutor", "student"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];
export type Role = (typeof ALL_ROLES)[number];

export const roleOf = (req: Pick<PayloadRequest, "user">): Role | undefined =>
  (req.user as { role?: Role } | null | undefined)?.role;

export const hasRole = (req: Pick<PayloadRequest, "user">, ...roles: Role[]) => roles.includes(roleOf(req) as Role);
export const isStaffUser = (user: unknown) => STAFF_ROLES.includes((user as { role?: StaffRole } | null)?.role as StaffRole);

export const anyone: Access = () => true;
export const nobody: Access = () => false;
export const signedIn: Access = ({ req }) => Boolean(req.user);

export const isAdmin: Access = ({ req }) => hasRole(req, "admin");
export const isStaff: Access = ({ req }) => isStaffUser(req.user);
export const isOps: Access = ({ req }) => hasRole(req, "admin", "manager");
export const isOpsOrSupport: Access = ({ req }) => hasRole(req, "admin", "manager", "support");
export const isFinance: Access = ({ req }) => hasRole(req, "admin", "finance");
export const isEditor: Access = ({ req }) => hasRole(req, "admin", "editor");

export const isAdminField: FieldAccess = ({ req }) => hasRole(req, "admin");
export const isStaffField: FieldAccess = ({ req }) => isStaffUser(req.user);

/** Staff see everything; anyone else only the documents they own (`field` points at the user). */
export const staffOrOwner =
  (field = "user"): Access =>
  ({ req }) => {
    if (!req.user) return false;
    if (isStaffUser(req.user)) return true;
    return { [field]: { equals: req.user.id } };
  };

/** Public sees published documents only; staff see drafts too. */
export const publishedOrStaff: Access = ({ req }) => (isStaffUser(req.user) ? true : { _status: { equals: "published" } });

/** Standard website content: public read (published), editors write, admins delete. */
export const contentAccess = { read: publishedOrStaff, create: isEditor, update: isEditor, delete: isAdmin };
