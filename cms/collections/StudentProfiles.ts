import type { CollectionConfig } from "payload";
import { APIError } from "payload";
import { hasRole, isAdmin, isStaffUser, staffOrOwner } from "../access";
import { richDescription } from "../fields/richtext";

export const STUDENT_LEVELS = [
  { label: "Complete beginner", value: "beginner" },
  { label: "I know the basics", value: "elementary" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
] as const;
export const STUDENT_GOALS = [
  { label: "Pass an exam", value: "exam" },
  { label: "Keep up at school", value: "school" },
  { label: "Career & work", value: "career" },
  { label: "Travel & conversation", value: "conversation" },
  { label: "Personal interest", value: "hobby" },
  { label: "Help my child", value: "child" },
] as const;
export const STUDENT_PACE = [
  { label: "Once a week", value: "1" },
  { label: "2-3 times a week", value: "2-3" },
  { label: "4+ times a week", value: "4+" },
  { label: "Not sure yet", value: "unsure" },
] as const;

/** A student's learning goals and saved tutors (one per student). */
export const StudentProfiles: CollectionConfig = {
  slug: "student-profiles",
  labels: { singular: "Student", plural: "Students" },
  admin: { useAsTitle: "displayName", group: "People", defaultColumns: ["displayName", "goal", "level", "updatedAt"] },
  access: {
    read: staffOrOwner("user"),
    create: ({ req }) => hasRole(req, "student", "admin", "manager"),
    update: staffOrOwner("user"),
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        // Students creating their own profile can only create it for themselves.
        if (operation === "create" && req.user && !isStaffUser(req.user)) {
          data.user = req.user!.id;
          const existing = await req.payload.count({ collection: "student-profiles", where: { user: { equals: req.user!.id } }, overrideAccess: true });
          if (existing.totalDocs > 0) throw new APIError("You already have a student profile.", 409, undefined, true);
        }
        if (operation === "create" && data.user) {
          const u = await req.payload.findByID({ collection: "users", id: typeof data.user === "object" ? data.user.id : data.user, depth: 0, overrideAccess: true }).catch(() => null);
          if (u) data.displayName = u.name;
        }
        return data;
      },
    ],
  },
  fields: [
    { name: "user", type: "relationship", relationTo: "users", required: true, unique: true, index: true, access: { update: ({ req }) => isStaffUser(req.user) } },
    { name: "displayName", type: "text", admin: { readOnly: true } },
    { name: "subjects", type: "relationship", relationTo: "subjects", hasMany: true, label: "Wants to learn" },
    { type: "row", fields: [
      { name: "goal", type: "select", options: [...STUDENT_GOALS], admin: { width: "33%" } },
      { name: "level", type: "select", options: [...STUDENT_LEVELS], admin: { width: "33%" } },
      { name: "pace", type: "select", options: [...STUDENT_PACE], admin: { width: "33%" } },
    ] },
    { type: "row", fields: [
      { name: "budgetMin", type: "number", min: 0, admin: { width: "50%" } },
      { name: "budgetMax", type: "number", min: 0, admin: { width: "50%" } },
    ] },
    richDescription("goalDetails", { maxChars: 600, label: "In their own words" }),
    { name: "preferredLanguages", type: "relationship", relationTo: "languages", hasMany: true },
    { name: "savedTutors", type: "relationship", relationTo: "tutor-profiles", hasMany: true },
    { name: "onboardedAt", type: "date", admin: { readOnly: true } },
    {
      type: "collapsible",
      label: "Parent view",
      admin: { initCollapsed: true, description: "A private read-only link the student can share with a parent or guardian." },
      fields: [
        { name: "shareToken", type: "text", unique: true, index: true, access: { read: ({ req }) => isStaffUser(req.user), update: () => false }, admin: { readOnly: true } },
        { name: "shareCreatedAt", type: "date", admin: { readOnly: true } },
        { name: "parentEmail", type: "email", admin: { description: "Optional: gets a short weekly summary." } },
      ],
    },
  ],
};
