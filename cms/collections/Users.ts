import { APIError, type CollectionConfig } from "payload";
import { ALL_ROLES, hasRole, isAdmin, isAdminField, isStaffUser } from "../access";

const ROLE_LABELS: Record<(typeof ALL_ROLES)[number], string> = {
  admin: "Admin: everything, including users and platform settings",
  manager: "Manager: tutors, students, bookings, lessons and reports",
  finance: "Finance: payments, invoices, payouts and refunds",
  support: "Support: people, bookings, disputes and messages",
  editor: "Editor: website, blog and academy content",
  tutor: "Tutor",
  student: "Student",
};

/**
 * Everyone who can sign in: staff, tutors and students share one account system.
 * Staff open the admin at /admin; tutors and students use their portals.
 */
export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "User", plural: "Users & roles" },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7, // 7 days
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    cookies: { sameSite: "Lax", secure: process.env.NODE_ENV === "production" },
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "role", "status", "createdAt"],
    group: "People",
    listSearchableFields: ["name", "email", "phone"],
    description: "Every account on Sabina: staff, tutors and students.",
  },
  access: {
    // Only staff can open the Payload admin.
    admin: ({ req }) => isStaffUser(req.user),
    read: ({ req }) => (isStaffUser(req.user) ? true : req.user ? { id: { equals: req.user.id } } : false),
    // Public sign-up creates tutor or student accounts only (enforced in beforeChange).
    create: () => true,
    update: ({ req, id }) => hasRole(req, "admin", "manager", "support") || req.user?.id === id,
    delete: isAdmin,
  },
  hooks: {
    beforeLogin: [
      ({ user }) => {
        if (user?.status && user.status !== "active") {
          throw new APIError("This account is not active. Please contact support.", 403, undefined, true);
        }
      },
    ],
    afterLogin: [
      async ({ req, user }) => {
        await req.payload
          .update({ collection: "users", id: user.id, data: { lastLoginAt: new Date().toISOString() }, overrideAccess: true, req, context: { skipAudit: true } })
          .catch(() => undefined);
      },
    ],
    beforeChange: [
      async ({ data, operation, req, originalDoc }) => {
        // Keep the display name in sync with first and last name.
        const first = String(data.firstName ?? originalDoc?.firstName ?? "").trim();
        const last = String(data.lastName ?? originalDoc?.lastName ?? "").trim();
        if (first || last) data.name = [first, last].filter(Boolean).join(" ");

        if (operation === "create") {
          const existing = await req.payload.count({ collection: "users", overrideAccess: true });
          if (existing.totalDocs === 0) {
            // The very first account is always an admin.
            data.role = "admin";
          } else if (!hasRole(req, "admin")) {
            // Anyone who isn't an admin can only create tutor or student accounts.
            data.role = data.role === "tutor" ? "tutor" : "student";
          }
        }
        return data;
      },
    ],
  },
  fields: [
    {
      type: "row",
      fields: [
        { name: "firstName", type: "text", required: true, admin: { width: "50%" } },
        { name: "lastName", type: "text", required: true, admin: { width: "50%" } },
      ],
    },
    { name: "name", type: "text", index: true, admin: { readOnly: true, description: "Filled in from first and last name." } },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "student",
      saveToJWT: true,
      index: true,
      access: { update: isAdminField },
      options: ALL_ROLES.map((value) => ({ value, label: ROLE_LABELS[value] })),
      admin: { position: "sidebar" },
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "active",
      saveToJWT: true,
      options: [
        { label: "Active", value: "active" },
        { label: "Suspended", value: "suspended" },
        { label: "Deactivated", value: "deactivated" },
      ],
      access: { update: ({ req }) => hasRole(req, "admin", "manager") },
      admin: { position: "sidebar" },
    },
    { name: "avatar", type: "upload", relationTo: "media", admin: { position: "sidebar" } },
    {
      type: "row",
      fields: [
        { name: "phone", type: "text", admin: { width: "50%" } },
        { name: "country", type: "text", admin: { width: "50%" } },
      ],
    },
    { name: "timezone", type: "text", defaultValue: "UTC", admin: { description: "IANA time zone, e.g. Africa/Nairobi. Lesson times are shown in this zone." } },
    { name: "lastLoginAt", type: "date", admin: { readOnly: true, position: "sidebar" } },
  ],
};
