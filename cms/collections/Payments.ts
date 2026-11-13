import type { CollectionConfig, Where } from "payload";
import { hasRole, isAdmin, isStaffUser } from "../access";

export const PAYMENT_STATUSES = ["pending", "succeeded", "failed", "cancelled", "refunded", "partially_refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** One checkout attempt for a booking or a lesson package. Written only by the server (checkout, webhooks, refunds). */
export const Payments: CollectionConfig = {
  slug: "payments",
  labels: { singular: "Payment", plural: "Payments" },
  admin: { group: "Money", useAsTitle: "reference", defaultColumns: ["reference", "amount", "currency", "provider", "status", "student", "createdAt"], listSearchableFields: ["reference", "providerRef"] },
  access: {
    read: ({ req }) => (!req.user ? false : isStaffUser(req.user) && hasRole(req, "admin", "manager", "finance", "support") ? true : ({ student: { equals: req.user.id } } as Where)),
    create: () => false,
    update: ({ req }) => hasRole(req, "admin", "finance"),
    delete: isAdmin,
  },
  defaultSort: "-createdAt",
  fields: [
    { name: "reference", type: "text", required: true, unique: true, index: true, admin: { readOnly: true } },
    {
      type: "row",
      fields: [
        { name: "status", type: "select", required: true, defaultValue: "pending", options: PAYMENT_STATUSES.map((v) => ({ label: v.replace("_", " "), value: v })), index: true, admin: { width: "34%" } },
        { name: "provider", type: "select", required: true, options: ["stripe", "paystack", "dev"].map((v) => ({ label: v, value: v })), admin: { width: "33%" } },
        { name: "method", type: "text", admin: { width: "33%", description: "card, mobile_money, …" } },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "amount", type: "number", required: true, admin: { width: "34%" } },
        { name: "currency", type: "text", required: true, admin: { width: "33%" } },
        { name: "refundedAmount", type: "number", defaultValue: 0, admin: { width: "33%" } },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "booking", type: "relationship", relationTo: "bookings", index: true, admin: { width: "34%", condition: (d) => !d?.package } },
        { name: "package", type: "relationship", relationTo: "lesson-packages", index: true, admin: { width: "34%", condition: (d) => Boolean(d?.package) } },
        { name: "student", type: "relationship", relationTo: "users", required: true, index: true, admin: { width: "33%" } },
        { name: "tutor", type: "relationship", relationTo: "tutor-profiles", index: true, admin: { width: "33%" } },
      ],
    },
    { name: "providerRef", type: "text", index: true, admin: { description: "Stripe Checkout session / Paystack reference." } },
    { name: "chargeRef", type: "text", admin: { description: "Stripe payment intent / Paystack transaction id, used for refunds." } },
    { name: "checkoutUrl", type: "text", admin: { readOnly: true } },
    { name: "paidAt", type: "date", admin: { readOnly: true } },
    { name: "failureReason", type: "text" },
    {
      name: "refunds",
      type: "array",
      admin: { readOnly: true },
      fields: [
        { name: "amount", type: "number" },
        { name: "reason", type: "text" },
        { name: "providerRef", type: "text" },
        { name: "at", type: "date" },
      ],
    },
    { name: "events", type: "json", admin: { readOnly: true, description: "Provider events received (latest last)." } },
  ],
};
