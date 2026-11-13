import { APIError, type CollectionConfig, type Endpoint, type PayloadRequest, type Where } from "payload";
import type { User } from "@/payload-types";
import { hasRole, isAdmin, isStaffUser } from "../access";

export const PACKAGE_STATUSES = [
  { label: "Awaiting payment", value: "pending_payment" },
  { label: "Active", value: "active" },
  { label: "All lessons used", value: "used_up" },
  { label: "Expired", value: "expired" },
  { label: "Refunded", value: "refunded" },
  { label: "Cancelled", value: "cancelled" },
] as const;
export type PackageStatus = (typeof PACKAGE_STATUSES)[number]["value"];

/** POST /api/cms/lesson-packages/:id/refund-unused { reason } (finance and admins). */
const refundEndpoint: Endpoint = {
  path: "/:id/refund-unused",
  method: "post",
  handler: async (req: PayloadRequest) => {
    if (!hasRole(req, "admin", "finance")) throw new APIError("Only finance can refund packages.", 403, undefined, true);
    const body = (req.json ? await req.json().catch(() => ({})) : {}) as { reason?: string };
    const reason = String(body.reason ?? "").trim().slice(0, 300);
    if (!reason) throw new APIError("Add a reason for the refund.", 400, undefined, true);
    const { refundUnused } = await import("../packages/server");
    const { BookingError } = await import("../scheduling/server");
    try {
      const amount = await refundUnused(req.payload, Number(req.routeParams?.id), reason, req.user as unknown as User);
      return Response.json({ amount, message: `Refunded ${amount}. The student will get an email.` });
    } catch (err) {
      if (err instanceof BookingError) throw new APIError(err.message, err.status, undefined, true);
      throw err;
    }
  },
};

/** Lesson sizes tutors can offer as a package. */
export const PACKAGE_SIZES = [5, 10, 20] as const;

/**
 * A pack of prepaid lessons a student bought from one tutor, for one lesson length, at a
 * discount. Lessons booked from it are already paid. Created only by the server.
 */
export const LessonPackages: CollectionConfig = {
  slug: "lesson-packages",
  labels: { singular: "Lesson package", plural: "Lesson packages" },
  admin: {
    group: "Money",
    useAsTitle: "reference",
    defaultColumns: ["reference", "student", "tutor", "lessons", "minutes", "price", "status", "expiresAt"],
    listSearchableFields: ["reference"],
    description: "Prepaid lessons. Students book lessons from a package without paying again; cancelling in time returns the lesson to the package.",
  },
  access: {
    read: ({ req }) => {
      if (!req.user) return false;
      if (isStaffUser(req.user)) return true;
      return { or: [{ student: { equals: req.user.id } }, { tutorUser: { equals: req.user.id } }] } as Where;
    },
    create: () => false,
    update: ({ req }) => hasRole(req, "admin", "finance"),
    delete: isAdmin,
  },
  endpoints: [refundEndpoint],
  defaultSort: "-createdAt",
  fields: [
    { name: "reference", type: "text", required: true, unique: true, index: true, admin: { readOnly: true } },
    { name: "status", type: "select", required: true, defaultValue: "pending_payment", options: [...PACKAGE_STATUSES], index: true, admin: { position: "sidebar" } },
    { name: "expiresAt", type: "date", index: true, admin: { position: "sidebar", description: "Unused lessons can't be booked after this date." } },
    { name: "paidAt", type: "date", admin: { position: "sidebar", readOnly: true } },
    { name: "refundedAmount", type: "number", defaultValue: 0, admin: { position: "sidebar", readOnly: true } },
    {
      name: "refundUnused",
      type: "ui",
      admin: { position: "sidebar", components: { Field: "@/cms/admin/fields/RefundPackage#RefundPackage" } },
    },
    {
      type: "row",
      fields: [
        { name: "student", type: "relationship", relationTo: "users", required: true, index: true, admin: { width: "50%" } },
        { name: "tutor", type: "relationship", relationTo: "tutor-profiles", required: true, index: true, admin: { width: "50%" } },
      ],
    },
    { name: "tutorUser", type: "relationship", relationTo: "users", required: true, index: true, admin: { hidden: true } },
    {
      type: "row",
      fields: [
        { name: "lessons", type: "number", required: true, min: 1, admin: { width: "25%", description: "Lessons in the package." } },
        { name: "minutes", type: "number", required: true, admin: { width: "25%", description: "Length of each lesson." } },
        { name: "discountPercent", type: "number", min: 0, max: 100, defaultValue: 0, admin: { width: "25%" } },
        { name: "platformFeePercent", type: "number", admin: { width: "25%", description: "Snapshot at purchase." } },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "price", type: "number", required: true, admin: { width: "34%", description: "Total paid." } },
        { name: "perLesson", type: "number", required: true, admin: { width: "33%", description: "What each lesson is worth (and what the tutor earns from)." } },
        { name: "currency", type: "text", required: true, admin: { width: "33%" } },
      ],
    },
    {
      name: "history",
      type: "array",
      admin: { readOnly: true, initCollapsed: true },
      fields: [
        { name: "action", type: "text" },
        { name: "by", type: "relationship", relationTo: "users" },
        { name: "at", type: "date" },
        { name: "note", type: "text" },
      ],
    },
  ],
};
