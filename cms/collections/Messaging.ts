import type { CollectionConfig } from "payload";
import { hasRole, isAdmin } from "../access";
import { EMAIL_CATALOGUE } from "../notify/catalogue";

const staffRead = ({ req }: { req: Parameters<typeof hasRole>[0] }) => hasRole(req, "admin", "manager", "support");

/** One thread between a student and a tutor. People use it through /api/messages; staff can read it. */
export const Conversations: CollectionConfig = {
  slug: "conversations",
  labels: { singular: "Conversation", plural: "Conversations" },
  admin: { group: "Messages", useAsTitle: "title", defaultColumns: ["title", "lastMessageAt", "messageCount", "flagged"] },
  access: { read: staffRead, create: () => false, update: ({ req }) => hasRole(req, "admin", "support"), delete: isAdmin },
  defaultSort: "-lastMessageAt",
  fields: [
    { name: "title", type: "text", admin: { readOnly: true } },
    {
      type: "row",
      fields: [
        { name: "student", type: "relationship", relationTo: "users", required: true, index: true, admin: { readOnly: true, width: "50%" } },
        { name: "tutorUser", type: "relationship", relationTo: "users", required: true, index: true, admin: { readOnly: true, width: "50%" } },
      ],
    },
    { name: "tutor", type: "relationship", relationTo: "tutor-profiles", required: true, admin: { readOnly: true } },
    { name: "lastMessageAt", type: "date", index: true, admin: { readOnly: true, date: { pickerAppearance: "dayAndTime" } } },
    { name: "lastPreview", type: "text", admin: { readOnly: true } },
    { name: "lastSender", type: "relationship", relationTo: "users", admin: { readOnly: true } },
    { name: "messageCount", type: "number", defaultValue: 0, admin: { readOnly: true } },
    {
      type: "row",
      fields: [
        { name: "studentReadAt", type: "date", admin: { readOnly: true, width: "50%" } },
        { name: "tutorReadAt", type: "date", admin: { readOnly: true, width: "50%" } },
      ],
    },
    { name: "flagged", type: "checkbox", defaultValue: false, index: true, admin: { position: "sidebar", description: "A message here may share contact details. Untick once checked." } },
    { name: "lastEmailedAt", type: "date", admin: { readOnly: true, position: "sidebar" } },
    { name: "closed", type: "checkbox", defaultValue: false, admin: { position: "sidebar", description: "Stops both people from sending new messages." } },
  ],
};

export const Messages: CollectionConfig = {
  slug: "messages",
  labels: { singular: "Message", plural: "Messages" },
  admin: { group: "Messages", useAsTitle: "body", defaultColumns: ["body", "sender", "conversation", "flag", "createdAt"] },
  access: { read: staffRead, create: () => false, update: ({ req }) => hasRole(req, "admin", "support"), delete: isAdmin },
  defaultSort: "-createdAt",
  fields: [
    { name: "conversation", type: "relationship", relationTo: "conversations", required: true, index: true, admin: { readOnly: true } },
    { name: "sender", type: "relationship", relationTo: "users", required: true, admin: { readOnly: true } },
    { name: "body", type: "textarea", required: true, maxLength: 4000 },
    { name: "flag", type: "text", admin: { readOnly: true, description: "Why this message was flagged for review." } },
    { name: "hidden", type: "checkbox", defaultValue: false, admin: { position: "sidebar", description: "Hide this message from both people." } },
  ],
};

export const Notifications: CollectionConfig = {
  slug: "notifications",
  labels: { singular: "Notification", plural: "Notifications" },
  admin: { group: "Messages", useAsTitle: "title", defaultColumns: ["title", "user", "kind", "readAt", "createdAt"], hidden: ({ user }) => (user as { role?: string } | null)?.role !== "admin" },
  access: { read: ({ req }) => hasRole(req, "admin"), create: () => false, update: () => false, delete: isAdmin },
  defaultSort: "-createdAt",
  fields: [
    { name: "user", type: "relationship", relationTo: "users", required: true, index: true },
    { name: "kind", type: "text", index: true },
    { name: "title", type: "text", required: true },
    { name: "body", type: "text" },
    { name: "href", type: "text" },
    { name: "readAt", type: "date", index: true },
  ],
};

export const EmailLog: CollectionConfig = {
  slug: "email-log",
  labels: { singular: "Sent email", plural: "Email log" },
  admin: { group: "Messages", useAsTitle: "subject", defaultColumns: ["subject", "to", "template", "status", "createdAt"] },
  access: { read: staffRead, create: () => false, update: () => false, delete: isAdmin },
  defaultSort: "-createdAt",
  fields: [
    { name: "to", type: "email", required: true, index: true },
    { name: "subject", type: "text", required: true },
    { name: "template", type: "text", index: true },
    {
      name: "status",
      type: "select",
      required: true,
      index: true,
      options: [
        { label: "Sent", value: "sent" },
        { label: "Failed", value: "failed" },
        { label: "Turned off", value: "off" },
        { label: "Not configured", value: "no_smtp" },
      ],
    },
    { name: "error", type: "textarea" },
  ],
};

/** Staff can switch an email off or add a note to it. Rows are created on first use. */
export const EmailTemplates: CollectionConfig = {
  slug: "email-templates",
  labels: { singular: "Email", plural: "Emails" },
  admin: { group: "Messages", useAsTitle: "name", defaultColumns: ["name", "audience", "enabled", "updatedAt"], description: "Every email Sabina sends. Turn one off, or add a note that appears above its button." },
  access: { read: staffRead, create: () => false, update: ({ req }) => hasRole(req, "admin", "manager", "support"), delete: () => false },
  hooks: { afterChange: [async () => (await import("../notify/server")).clearTemplateCache()] },
  fields: [
    { name: "key", type: "select", required: true, unique: true, options: EMAIL_CATALOGUE.map((e) => ({ label: e.name, value: e.key })), admin: { readOnly: true } },
    { name: "name", type: "text", required: true, admin: { readOnly: true } },
    { name: "audience", type: "text", admin: { readOnly: true } },
    { name: "description", type: "textarea", admin: { readOnly: true } },
    { name: "enabled", type: "checkbox", defaultValue: true, label: "Send this email" },
    { name: "note", type: "textarea", maxLength: 600, admin: { description: "Optional. Plain text shown above the button, e.g. a holiday notice. Leave a blank line between paragraphs." } },
  ],
};

/** Every SMS and WhatsApp reminder we tried to send. Written by the server. */
export const TextLog: CollectionConfig = {
  slug: "text-log",
  labels: { singular: "Text message", plural: "Text log" },
  admin: { group: "Messages", useAsTitle: "to", defaultColumns: ["to", "channel", "kind", "status", "createdAt"], description: "SMS and WhatsApp reminders, newest first." },
  access: { read: ({ req }) => hasRole(req, "admin", "support"), create: () => false, update: () => false, delete: isAdmin },
  defaultSort: "-createdAt",
  fields: [
    { name: "user", type: "relationship", relationTo: "users", index: true },
    { name: "to", type: "text", required: true, index: true },
    { name: "channel", type: "select", required: true, options: [{ label: "SMS", value: "sms" }, { label: "WhatsApp", value: "whatsapp" }] },
    { name: "kind", type: "text" },
    { name: "body", type: "textarea" },
    { name: "status", type: "select", required: true, options: [{ label: "Sent", value: "sent" }, { label: "Failed", value: "failed" }], index: true },
    { name: "error", type: "textarea" },
  ],
};

/** Messages sent through the public contact form. Support replies by email and marks them handled. */
export const ContactMessages: CollectionConfig = {
  slug: "contact-messages",
  labels: { singular: "Contact message", plural: "Contact messages" },
  admin: { group: "Messages", useAsTitle: "subject", defaultColumns: ["subject", "name", "email", "status", "createdAt"] },
  access: { read: staffRead, create: () => false, update: ({ req }) => hasRole(req, "admin", "manager", "support"), delete: isAdmin },
  defaultSort: "-createdAt",
  fields: [
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "new",
      index: true,
      options: [
        { label: "New", value: "new" },
        { label: "Replied", value: "replied" },
        { label: "Closed", value: "closed" },
      ],
      admin: { position: "sidebar" },
    },
    { name: "user", type: "relationship", relationTo: "users", admin: { position: "sidebar", readOnly: true, description: "Set when the sender was signed in." } },
    { type: "row", fields: [{ name: "name", type: "text", required: true, admin: { width: "50%", readOnly: true } }, { name: "email", type: "email", required: true, index: true, admin: { width: "50%", readOnly: true } }] },
    { name: "subject", type: "text", required: true, admin: { readOnly: true } },
    { name: "message", type: "textarea", required: true, admin: { readOnly: true } },
    { name: "notes", type: "textarea", label: "Staff notes", admin: { description: "Only staff see this." } },
  ],
};
