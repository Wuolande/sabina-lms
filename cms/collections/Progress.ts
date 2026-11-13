import type { CollectionConfig, Where } from "payload";
import { hasRole, isAdmin, isStaffUser } from "../access";
import { richDescription } from "../fields/richtext";

const mineOrStaff = (studentField: string, tutorField?: string) =>
  (({ req }) => {
    if (!req.user) return false;
    if (isStaffUser(req.user)) return true;
    return { or: [{ [studentField]: { equals: req.user.id } }, ...(tutorField ? [{ [tutorField]: { equals: req.user.id } }] : [])] } as Where;
  }) as NonNullable<CollectionConfig["access"]>["read"];

export const ASSIGNMENT_STATUSES = [
  { label: "Set", value: "assigned" },
  { label: "Handed in", value: "submitted" },
  { label: "Marked", value: "reviewed" },
] as const;

/**
 * Homework and short quizzes a tutor sets for one student between lessons. Students hand in
 * homework (text and files) for feedback; quizzes are marked automatically. Written through
 * /api/homework, which checks the tutor actually teaches the student.
 */
export const Assignments: CollectionConfig = {
  slug: "assignments",
  labels: { singular: "Homework or quiz", plural: "Homework & quizzes" },
  admin: {
    group: "Teaching",
    useAsTitle: "title",
    defaultColumns: ["title", "kind", "student", "tutorUser", "status", "dueAt", "createdAt"],
    listSearchableFields: ["title"],
    description: "Set by tutors for their students between lessons.",
  },
  access: { read: mineOrStaff("student", "tutorUser"), create: () => false, update: ({ req }) => hasRole(req, "admin", "manager", "support"), delete: isAdmin },
  defaultSort: "-createdAt",
  fields: [
    { name: "title", type: "text", required: true, maxLength: 140 },
    {
      type: "row",
      fields: [
        { name: "kind", type: "select", required: true, defaultValue: "homework", options: [{ label: "Homework", value: "homework" }, { label: "Quiz", value: "quiz" }], admin: { width: "34%" } },
        { name: "status", type: "select", required: true, defaultValue: "assigned", options: [...ASSIGNMENT_STATUSES], index: true, admin: { width: "33%" } },
        { name: "dueAt", type: "date", index: true, admin: { width: "33%", date: { pickerAppearance: "dayAndTime" } } },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "student", type: "relationship", relationTo: "users", required: true, index: true, admin: { width: "50%" } },
        { name: "tutorUser", type: "relationship", relationTo: "users", required: true, index: true, label: "Tutor", admin: { width: "50%" } },
      ],
    },
    { name: "subject", type: "relationship", relationTo: "subjects" },
    { name: "lesson", type: "relationship", relationTo: "bookings", admin: { description: "The lesson this follows on from, if any." } },
    richDescription("instructions", { maxChars: 4000, label: "Instructions" }),
    {
      name: "questions",
      type: "array",
      maxRows: 30,
      admin: { condition: (d) => d?.kind === "quiz", initCollapsed: true },
      fields: [
        { name: "prompt", type: "textarea", required: true, maxLength: 600 },
        { name: "type", type: "select", required: true, defaultValue: "choice", options: [{ label: "Multiple choice", value: "choice" }, { label: "Short answer", value: "short" }] },
        { name: "options", type: "array", maxRows: 6, admin: { condition: (_, s) => s?.type === "choice" }, fields: [{ name: "text", type: "text", required: true, maxLength: 200 }] },
        { name: "correct", type: "number", min: 0, admin: { condition: (_, s) => s?.type === "choice", description: "Which option is right (first = 0)." } },
        { name: "accepted", type: "text", maxLength: 300, admin: { condition: (_, s) => s?.type === "short", description: "Accepted answers, separated by |. Not case-sensitive." } },
        { name: "explanation", type: "textarea", maxLength: 600, admin: { description: "Shown to the student after they finish." } },
      ],
    },
    {
      type: "collapsible",
      label: "Student's work",
      fields: [
        richDescription("answer", { maxChars: 8000, label: "Written answer" }),
        { name: "files", type: "relationship", relationTo: "private-files", hasMany: true, maxRows: 5 },
        { name: "responses", type: "json", admin: { description: "Quiz answers, one per question." } },
        { name: "submittedAt", type: "date", admin: { readOnly: true } },
      ],
    },
    {
      type: "collapsible",
      label: "Marking",
      fields: [
        {
          type: "row",
          fields: [
            { name: "score", type: "number", admin: { width: "50%", description: "Quiz: questions right." } },
            { name: "outOf", type: "number", admin: { width: "50%" } },
          ],
        },
        richDescription("feedback", { maxChars: 4000, label: "Tutor feedback" }),
        { name: "reviewedAt", type: "date", admin: { readOnly: true } },
      ],
    },
  ],
};

/** A learning goal a student works towards, with milestones. Shared with their tutors. */
export const Goals: CollectionConfig = {
  slug: "goals",
  labels: { singular: "Learning goal", plural: "Learning goals" },
  admin: { group: "Teaching", useAsTitle: "title", defaultColumns: ["title", "student", "status", "targetDate", "updatedAt"] },
  access: { read: mineOrStaff("student"), create: () => false, update: ({ req }) => isStaffUser(req.user), delete: isAdmin },
  defaultSort: "-updatedAt",
  fields: [
    { name: "title", type: "text", required: true, maxLength: 140 },
    {
      type: "row",
      fields: [
        { name: "student", type: "relationship", relationTo: "users", required: true, index: true, admin: { width: "34%" } },
        { name: "status", type: "select", required: true, defaultValue: "active", options: [{ label: "Working on it", value: "active" }, { label: "Achieved", value: "achieved" }, { label: "Archived", value: "archived" }], index: true, admin: { width: "33%" } },
        { name: "targetDate", type: "date", admin: { width: "33%" } },
      ],
    },
    { name: "subject", type: "relationship", relationTo: "subjects" },
    { name: "createdBy", type: "relationship", relationTo: "users", admin: { readOnly: true } },
    {
      name: "milestones",
      type: "array",
      maxRows: 12,
      fields: [
        {
          type: "row",
          fields: [
            { name: "text", type: "text", required: true, maxLength: 160, admin: { width: "70%" } },
            { name: "done", type: "checkbox", defaultValue: false, admin: { width: "30%" } },
          ],
        },
        { name: "doneAt", type: "date", admin: { hidden: true } },
      ],
    },
    { name: "achievedAt", type: "date", admin: { readOnly: true } },
  ],
};
