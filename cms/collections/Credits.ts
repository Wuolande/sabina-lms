import type { CollectionConfig, Where } from "payload";
import { hasRole, isAdmin, isStaffUser } from "../access";

export const CREDIT_KINDS = [
  { value: "referral_reward", label: "Referral reward (student)" },
  { value: "referral_welcome", label: "Welcome credit (invited friend)" },
  { value: "tutor_bonus", label: "Referral bonus (tutor earnings)" },
  { value: "spent", label: "Spent on a lesson" },
  { value: "returned", label: "Returned (lesson refunded)" },
  { value: "adjustment", label: "Adjustment by staff" },
] as const;
export type CreditKind = (typeof CREDIT_KINDS)[number]["value"];

/**
 * Lesson credit and referral bonuses, one row per change (positive adds, negative uses).
 * A student's balance is the sum of their rows, except tutor bonuses, which are paid out with the
 * tutor's earnings instead. Finance can add adjustments; rows are never edited after the fact.
 */
export const Credits: CollectionConfig = {
  slug: "credits",
  labels: { singular: "Credit", plural: "Credits & referral rewards" },
  admin: { group: "Money", useAsTitle: "note", defaultColumns: ["user", "amount", "currency", "kind", "note", "createdAt"] },
  access: {
    read: ({ req }) => (!req.user ? false : isStaffUser(req.user) ? hasRole(req, "admin", "manager", "finance", "support") : ({ user: { equals: req.user.id } } as Where)),
    create: ({ req }) => hasRole(req, "admin", "finance"),
    update: () => false,
    delete: isAdmin,
  },
  defaultSort: "-createdAt",
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        // Staff adjustments made in the admin.
        if (operation === "create" && !data.kind) data.kind = "adjustment";
        if (operation === "create" && !data.note && req.user) data.note = "Adjustment";
        return data;
      },
    ],
  },
  fields: [
    {
      type: "row",
      fields: [
        { name: "user", type: "relationship", relationTo: "users", required: true, index: true, admin: { width: "40%" } },
        { name: "amount", type: "number", required: true, admin: { width: "30%", description: "Positive adds credit, negative takes it away." } },
        { name: "currency", type: "text", required: true, defaultValue: "USD", admin: { width: "30%" } },
      ],
    },
    { name: "kind", type: "select", required: true, index: true, options: CREDIT_KINDS.map((k) => ({ label: k.label, value: k.value })), defaultValue: "adjustment" },
    { name: "note", type: "text", required: true, admin: { description: "Shown to the person, e.g. \"Thanks for inviting Amani\"." } },
    {
      type: "row",
      fields: [
        { name: "friend", type: "relationship", relationTo: "users", admin: { width: "34%", readOnly: true, description: "The invited friend, for referral rows." } },
        { name: "booking", type: "relationship", relationTo: "bookings", admin: { width: "33%", readOnly: true } },
        { name: "payment", type: "relationship", relationTo: "payments", admin: { width: "33%", readOnly: true } },
      ],
    },
    { name: "payout", type: "relationship", relationTo: "payouts", index: true, admin: { readOnly: true, description: "Tutor bonuses: the payout they were paid in." } },
  ],
};
