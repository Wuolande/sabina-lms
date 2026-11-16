import type { CollectionConfig } from "payload";
import { isAdmin, isStaffUser } from "../access";

/** Browsers/devices that asked for push notifications. Written only by /api/push. */
export const PushSubscriptions: CollectionConfig = {
  slug: "push-subscriptions",
  labels: { singular: "Push device", plural: "Push devices" },
  admin: { group: "Messages", useAsTitle: "device", defaultColumns: ["user", "device", "lastSentAt", "createdAt"], description: "Devices that get push notifications. Removed automatically when a browser stops accepting them." },
  access: { read: ({ req }) => isStaffUser(req.user), create: () => false, update: () => false, delete: isAdmin },
  fields: [
    { name: "user", type: "relationship", relationTo: "users", required: true, index: true },
    { name: "endpoint", type: "text", required: true, unique: true, index: true, admin: { readOnly: true } },
    { name: "p256dh", type: "text", required: true, admin: { readOnly: true } },
    { name: "auth", type: "text", required: true, admin: { readOnly: true } },
    { name: "device", type: "text", admin: { readOnly: true } },
    { name: "lastSentAt", type: "date", admin: { readOnly: true } },
  ],
};
