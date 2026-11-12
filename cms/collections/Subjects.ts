import type { CollectionConfig } from "payload";
import { anyone, isAdmin, isEditor, isStaffUser } from "../access";
import { slugField } from "../fields/slug";

export const SUBJECT_CATEGORIES = [
  { label: "Languages", value: "languages" },
  { label: "Mathematics", value: "mathematics" },
  { label: "Sciences", value: "sciences" },
  { label: "Exam prep", value: "exam-prep" },
  { label: "Coding & tech", value: "coding" },
  { label: "Humanities", value: "humanities" },
  { label: "Business", value: "business" },
  { label: "Arts & music", value: "arts" },
] as const;

/** What tutors teach and students search by. */
export const Subjects: CollectionConfig = {
  slug: "subjects",
  labels: { singular: "Subject", plural: "Subjects" },
  admin: { useAsTitle: "name", group: "Teaching", defaultColumns: ["name", "category", "isActive", "isFeatured", "sortOrder"], listSearchableFields: ["name", "slug"] },
  defaultSort: "sortOrder",
  access: {
    read: ({ req }) => (isStaffUser(req.user) ? true : { isActive: { equals: true } }),
    create: isEditor,
    update: isEditor,
    delete: isAdmin,
  },
  fields: [
    { name: "name", type: "text", required: true, unique: true },
    slugField("name"),
    { name: "category", type: "select", required: true, options: [...SUBJECT_CATEGORIES], index: true },
    { name: "description", type: "textarea", maxLength: 300, admin: { description: "One or two sentences shown on the subject page and in search." } },
    { name: "icon", type: "text", admin: { description: "Lucide icon name, e.g. Calculator, Languages, Atom." } },
    {
      type: "row",
      fields: [
        { name: "isActive", type: "checkbox", defaultValue: true, label: "Active", admin: { width: "33%" } },
        { name: "isFeatured", type: "checkbox", defaultValue: false, label: "Featured", admin: { width: "33%" } },
        { name: "sortOrder", type: "number", defaultValue: 100, admin: { width: "33%" } },
      ],
    },
  ],
};

export const Languages: CollectionConfig = {
  slug: "languages",
  labels: { singular: "Language", plural: "Languages" },
  admin: { useAsTitle: "name", group: "Teaching", defaultColumns: ["name", "code", "nativeName", "isActive"] },
  defaultSort: "name",
  access: { read: anyone, create: isEditor, update: isEditor, delete: isAdmin },
  fields: [
    { name: "name", type: "text", required: true, unique: true },
    { name: "code", type: "text", required: true, unique: true, admin: { description: "ISO 639-1 code, e.g. en, sw, fr." } },
    { name: "nativeName", type: "text" },
    { name: "isActive", type: "checkbox", defaultValue: true },
  ],
};
