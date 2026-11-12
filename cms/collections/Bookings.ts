import type { CollectionConfig, Where } from "payload";
import { hasRole, isAdmin, isStaffUser } from "../access";

export const BOOKING_STATUSES = [
  { label: "Awaiting payment", value: "pending_payment" },
  { label: "Requested", value: "requested" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Completed", value: "completed" },
  { label: "Declined", value: "declined" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Expired", value: "expired" },
  { label: "No-show", value: "no_show" },
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number]["value"];
/** Statuses that hold a time slot. */
export const HOLDING: BookingStatus[] = ["pending_payment", "requested", "confirmed"];

/**
 * One lesson booked between a student and a tutor. Created only through /api/bookings, which
 * checks availability and prevents double-booking under a database lock; staff can edit here.
 */
export const Bookings: CollectionConfig = {
  slug: "bookings",
  labels: { singular: "Booking", plural: "Bookings" },
  admin: {
    group: "Teaching",
    useAsTitle: "reference",
    defaultColumns: ["reference", "startsAt", "student", "tutor", "subject", "kind", "status"],
    listSearchableFields: ["reference"],
    description: "Every lesson booked on Sabina. Times are stored in UTC and shown in your browser's time zone.",
  },
  access: {
    read: ({ req }) => {
      if (!req.user) return false;
      if (isStaffUser(req.user)) return true;
      return { or: [{ student: { equals: req.user.id } }, { tutorUser: { equals: req.user.id } }] } as Where;
    },
    create: ({ req }) => hasRole(req, "admin", "manager"),
    update: ({ req }) => hasRole(req, "admin", "manager", "support"),
    delete: isAdmin,
  },
  defaultSort: "-startsAt",
  fields: [
    { name: "reference", type: "text", unique: true, index: true, admin: { readOnly: true, position: "sidebar" } },
    { name: "status", type: "select", required: true, defaultValue: "requested", options: [...BOOKING_STATUSES], index: true, admin: { position: "sidebar" } },
    { name: "paymentStatus", type: "select", defaultValue: "unpaid", options: ["unpaid", "paid", "refunded", "partially_refunded", "waived", "failed"].map((v) => ({ label: v.replace("_", " "), value: v })), admin: { position: "sidebar" } },
    {
      type: "row",
      fields: [
        { name: "startsAt", type: "date", required: true, index: true, admin: { width: "50%", date: { pickerAppearance: "dayAndTime" } } },
        { name: "endsAt", type: "date", required: true, index: true, admin: { width: "50%", date: { pickerAppearance: "dayAndTime" } } },
      ],
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
        { name: "subject", type: "relationship", relationTo: "subjects", admin: { width: "40%" } },
        { name: "kind", type: "select", required: true, defaultValue: "regular", options: [{ label: "Trial", value: "trial" }, { label: "Regular", value: "regular" }], admin: { width: "30%" } },
        { name: "minutes", type: "number", required: true, admin: { width: "30%" } },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "price", type: "number", required: true, admin: { width: "33%" } },
        { name: "currency", type: "text", required: true, admin: { width: "33%" } },
        { name: "platformFeePercent", type: "number", admin: { width: "33%", description: "Snapshot at booking time." } },
      ],
    },
    { name: "studentNote", type: "textarea", maxLength: 1000, label: "Note from the student" },
    { name: "studentTimezone", type: "text", admin: { readOnly: true } },
    {
      type: "collapsible",
      label: "Cancellation",
      admin: { initCollapsed: true },
      fields: [
        { name: "cancelledBy", type: "select", options: ["student", "tutor", "staff", "system"].map((v) => ({ label: v, value: v })) },
        { name: "cancelReason", type: "textarea" },
        { name: "cancelledAt", type: "date" },
        { name: "lateCancellation", type: "checkbox", admin: { description: "The student cancelled inside the free-cancellation window." } },
      ],
    },
    { name: "autoConfirm", type: "checkbox", admin: { readOnly: true, position: "sidebar", description: "Instant booking: confirmed as soon as it's paid." } },
    { name: "holdUntil", type: "date", admin: { readOnly: true, position: "sidebar", description: "Unpaid bookings release the time after this." } },
    { name: "refundedAmount", type: "number", defaultValue: 0, admin: { readOnly: true, position: "sidebar" } },
    { name: "respondedAt", type: "date", admin: { readOnly: true, position: "sidebar" } },
    {
      type: "collapsible",
      label: "Classroom & attendance",
      admin: { initCollapsed: true },
      fields: [
        {
          type: "row",
          fields: [
            { name: "studentJoinedAt", type: "date", admin: { width: "33%", readOnly: true, date: { pickerAppearance: "dayAndTime" } } },
            { name: "tutorJoinedAt", type: "date", admin: { width: "33%", readOnly: true, date: { pickerAppearance: "dayAndTime" } } },
            { name: "completedAt", type: "date", admin: { width: "33%", readOnly: true, date: { pickerAppearance: "dayAndTime" } } },
          ],
        },
        { name: "noShowBy", type: "select", options: ["tutor", "student"].map((v) => ({ label: v, value: v })), admin: { description: "Who didn't turn up (set automatically from classroom attendance)." } },
        { name: "tutorNotes", type: "textarea", maxLength: 2000, label: "Lesson notes from the tutor", admin: { description: "Shared with the student after the lesson." } },
        {
          name: "issue",
          type: "group",
          label: "Reported problem",
          fields: [
            { name: "text", type: "textarea" },
            { name: "reportedAt", type: "date" },
            { name: "resolved", type: "checkbox" },
          ],
        },
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
