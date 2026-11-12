import type { CollectionConfig, Where } from "payload";
import { hasRole, isAdmin, isStaffUser } from "../access";

export const PAYOUT_METHODS = [
  { label: "M-Pesa", value: "mpesa" },
  { label: "Bank transfer", value: "bank" },
  { label: "PayPal", value: "paypal" },
];

/** A tutor's withdrawal request. Finance marks it paid after sending the money. */
export const Payouts: CollectionConfig = {
  slug: "payouts",
  labels: { singular: "Payout", plural: "Payouts" },
  admin: { group: "Money", useAsTitle: "reference", defaultColumns: ["reference", "tutorUser", "amount", "currency", "method", "status", "createdAt"] },
  access: {
    read: ({ req }) => (!req.user ? false : isStaffUser(req.user) ? hasRole(req, "admin", "manager", "finance") : ({ tutorUser: { equals: req.user.id } } as Where)),
    create: () => false,
    update: ({ req }) => hasRole(req, "admin", "finance"),
    delete: isAdmin,
  },
  defaultSort: "-createdAt",
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        if (data.status === "paid" && originalDoc?.status !== "paid") data.paidAt ??= new Date().toISOString();
        return data;
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req, operation }) => {
        if (operation !== "update" || doc.status !== "paid" || previousDoc?.status === "paid") return;
        const { payoutSent } = await import("../email/payments");
        const u = await req.payload.findByID({ collection: "users", id: typeof doc.tutorUser === "object" ? doc.tutorUser.id : doc.tutorUser, depth: 0, overrideAccess: true });
        const mail = payoutSent(u, { amount: doc.amount, currency: doc.currency, reference: doc.reference, transferRef: doc.transferRef });
        await req.payload.sendEmail({ to: u.email, subject: mail.subject, html: mail.html }).catch((err: unknown) => req.payload.logger.error({ err }, "[payouts] email failed"));
      },
    ],
  },
  fields: [
    { name: "reference", type: "text", required: true, unique: true, admin: { readOnly: true } },
    {
      type: "row",
      fields: [
        { name: "status", type: "select", required: true, defaultValue: "requested", options: ["requested", "processing", "paid", "failed", "cancelled"].map((v) => ({ label: v, value: v })), index: true, admin: { width: "34%" } },
        { name: "amount", type: "number", required: true, admin: { width: "33%", readOnly: true } },
        { name: "currency", type: "text", required: true, admin: { width: "33%", readOnly: true } },
      ],
    },
    { name: "tutorUser", type: "relationship", relationTo: "users", required: true, index: true, admin: { readOnly: true } },
    {
      type: "group",
      name: "destination",
      label: "Send to",
      admin: { description: "Copied from the tutor's payout details when they asked." },
      fields: [
        { name: "method", type: "select", options: PAYOUT_METHODS },
        { name: "details", type: "textarea" },
      ],
    },
    { name: "method", type: "text", admin: { hidden: true }, hooks: { beforeChange: [({ siblingData }) => siblingData.destination?.method] } },
    { name: "transferRef", type: "text", label: "Transfer reference", admin: { description: "M-Pesa code or bank reference, shown to the tutor." } },
    { name: "notes", type: "textarea", label: "Note to the tutor" },
    { name: "paidAt", type: "date", admin: { readOnly: true } },
    { name: "bookings", type: "relationship", relationTo: "bookings", hasMany: true, admin: { readOnly: true, description: "Lessons this payout covers." } },
  ],
};

/** Where a tutor wants their money sent. One per tutor; private to them and finance. */
export const PayoutMethods: CollectionConfig = {
  slug: "payout-methods",
  labels: { singular: "Payout details", plural: "Payout details" },
  admin: { group: "Money", useAsTitle: "summary", defaultColumns: ["summary", "user", "method", "updatedAt"] },
  access: {
    read: ({ req }) => (!req.user ? false : isStaffUser(req.user) ? hasRole(req, "admin", "finance") : ({ user: { equals: req.user.id } } as Where)),
    create: () => false,
    update: ({ req }) => hasRole(req, "admin", "finance"),
    delete: isAdmin,
  },
  fields: [
    { name: "user", type: "relationship", relationTo: "users", required: true, unique: true, index: true },
    { name: "method", type: "select", required: true, options: PAYOUT_METHODS },
    { name: "mpesaPhone", type: "text", admin: { condition: (_, s) => s.method === "mpesa" } },
    { name: "accountName", type: "text", admin: { condition: (_, s) => s.method === "bank" } },
    { name: "bankName", type: "text", admin: { condition: (_, s) => s.method === "bank" } },
    { name: "accountNumber", type: "text", admin: { condition: (_, s) => s.method === "bank" } },
    { name: "swift", type: "text", label: "SWIFT / branch code", admin: { condition: (_, s) => s.method === "bank" } },
    { name: "paypalEmail", type: "email", admin: { condition: (_, s) => s.method === "paypal" } },
    { name: "summary", type: "text", admin: { readOnly: true } },
  ],
};
