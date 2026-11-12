import type { CollectionConfig, Where } from "payload";
import { hasRole, isAdmin } from "../access";

const editors = ({ req }: { req: Parameters<typeof hasRole>[0] }) => hasRole(req, "admin", "manager", "editor");

/** Training for tutors: short lessons (text and an optional video) and a quiz with a pass mark. */
export const TrainingCourses: CollectionConfig = {
  slug: "training-courses",
  labels: { singular: "Course", plural: "Courses" },
  admin: { group: "Academy", useAsTitle: "title", defaultColumns: ["title", "status", "required", "order"] },
  access: { read: ({ req }) => (hasRole(req, "admin", "manager", "editor", "support") ? true : ({ status: { equals: "published" } } as Where)), create: editors, update: editors, delete: isAdmin },
  defaultSort: "order",
  fields: [
    { name: "title", type: "text", required: true },
    { name: "summary", type: "textarea", required: true, maxLength: 240 },
    { name: "cover", type: "upload", relationTo: "media" },
    {
      name: "lessons",
      type: "array",
      required: true,
      minRows: 1,
      labels: { singular: "Lesson", plural: "Lessons" },
      admin: { initCollapsed: true },
      fields: [
        { type: "row", fields: [{ name: "title", type: "text", required: true, admin: { width: "70%" } }, { name: "minutes", type: "number", defaultValue: 5, admin: { width: "30%" } }] },
        { name: "video", type: "text", admin: { description: "Optional. A Cloudflare Stream video ID, or a YouTube or Vimeo link." } },
        { name: "body", type: "richText", required: true },
      ],
    },
    {
      name: "quiz",
      type: "group",
      fields: [
        { name: "passMark", type: "number", defaultValue: 80, min: 0, max: 100, admin: { description: "Percentage needed to pass." } },
        {
          name: "questions",
          type: "array",
          admin: { initCollapsed: true },
          fields: [
            { name: "question", type: "text", required: true },
            { name: "options", type: "array", minRows: 2, maxRows: 5, required: true, fields: [{ name: "text", type: "text", required: true }] },
            { name: "answer", type: "number", required: true, min: 1, max: 5, admin: { description: "Which option is right: 1 for the first, 2 for the second…" } },
            { name: "explain", type: "textarea", label: "Why", admin: { description: "Shown after the tutor answers." } },
          ],
        },
      ],
    },
    { name: "slug", type: "text", unique: true, required: true, admin: { position: "sidebar" } },
    { name: "status", type: "select", defaultValue: "published", options: [{ label: "Draft", value: "draft" }, { label: "Published", value: "published" }], admin: { position: "sidebar" } },
    { name: "required", type: "checkbox", label: "Recommended for every tutor", admin: { position: "sidebar" } },
    { name: "order", type: "number", defaultValue: 0, admin: { position: "sidebar" } },
  ],
};

export const TrainingProgress: CollectionConfig = {
  slug: "training-progress",
  labels: { singular: "Course progress", plural: "Course progress" },
  admin: { group: "Academy", useAsTitle: "title", defaultColumns: ["title", "percent", "quizBest", "passedAt"] },
  access: { read: ({ req }) => hasRole(req, "admin", "manager", "editor", "support"), create: () => false, update: isAdmin, delete: isAdmin },
  fields: [
    { name: "title", type: "text", admin: { readOnly: true } },
    { type: "row", fields: [{ name: "tutorUser", type: "relationship", relationTo: "users", required: true, index: true, admin: { width: "50%" } }, { name: "course", type: "relationship", relationTo: "training-courses", required: true, index: true, admin: { width: "50%" } }] },
    { name: "completedLessons", type: "json", defaultValue: [] },
    { name: "percent", type: "number", defaultValue: 0 },
    { name: "quizBest", type: "number", admin: { description: "Best quiz score, %." } },
    { name: "attempts", type: "number", defaultValue: 0 },
    { name: "passedAt", type: "date" },
    { name: "certificate", type: "text", unique: true, admin: { description: "Certificate number." } },
  ],
};
