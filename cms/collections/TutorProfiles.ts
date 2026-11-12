import { APIError, type Access, type CollectionConfig, type FieldAccess, type Where } from "payload";
import { hasRole, isAdmin, isStaffUser } from "../access";
import { slugify } from "../fields/slug";
import { reviewEndpoint } from "../tutors/review";

export const TUTOR_STATUSES = [
  { label: "Draft", value: "draft" },
  { label: "Submitted for review", value: "submitted" },
  { label: "Changes requested", value: "changes_requested" },
  { label: "Approved (live)", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Suspended", value: "suspended" },
] as const;
export type TutorStatus = (typeof TUTOR_STATUSES)[number]["value"];

export const LANGUAGE_LEVELS = [
  { label: "Native", value: "native" },
  { label: "Fluent (C2)", value: "c2" },
  { label: "Advanced (C1)", value: "c1" },
  { label: "Upper intermediate (B2)", value: "b2" },
  { label: "Intermediate (B1)", value: "b1" },
  { label: "Basic (A1-A2)", value: "a2" },
] as const;

export const LEVELS_TAUGHT = [
  { label: "Primary school", value: "primary" },
  { label: "Secondary / high school", value: "secondary" },
  { label: "University", value: "university" },
  { label: "Adults & professionals", value: "adult" },
  { label: "Exam preparation", value: "exam" },
] as const;

const REVIEWERS = ["admin", "manager", "support"] as const;
const isReviewer = (req: Parameters<Access>[0]["req"]) => hasRole(req, ...REVIEWERS);

/** Fields only the tutor and the review team can see (never on the public profile). */
const ownerOrReviewerField: FieldAccess = ({ req, doc }) => {
  if (!req.user) return false;
  if (isReviewer(req)) return true;
  const owner = doc?.user && typeof doc.user === "object" ? doc.user.id : doc?.user;
  return owner === req.user.id;
};
const reviewerField: FieldAccess = ({ req }) => isReviewer(req);
const staffField: FieldAccess = ({ req }) => isStaffUser(req.user);

/** Statuses in which the tutor may edit their own application/profile. */
export const TUTOR_EDITABLE: TutorStatus[] = ["draft", "changes_requested", "approved"];

/**
 * One document per tutor: their application while being reviewed and their public profile once
 * approved. Public visitors only ever see approved profiles and only the public fields.
 */
export const TutorProfiles: CollectionConfig = {
  slug: "tutor-profiles",
  labels: { singular: "Tutor", plural: "Tutors" },
  admin: {
    useAsTitle: "displayName",
    group: "People",
    defaultColumns: ["displayName", "status", "hourlyRate", "country", "submittedAt", "updatedAt"],
    listSearchableFields: ["displayName", "headline", "slug"],
    description: "Tutor applications and public profiles. Filter by status to see applications waiting for review.",
    components: {
      edit: { beforeDocumentControls: ["/cms/admin/tutors/ReviewActions#ReviewActions"] },
    },
  },
  endpoints: [reviewEndpoint],
  access: {
    read: ({ req }) => {
      if (isStaffUser(req.user)) return true;
      if (req.user) return { or: [{ status: { equals: "approved" } }, { user: { equals: req.user.id } }] } as Where;
      return { status: { equals: "approved" } } as Where;
    },
    create: ({ req }) => hasRole(req, "tutor", ...REVIEWERS),
    update: ({ req }) => {
      if (isReviewer(req)) return true;
      if (hasRole(req, "tutor")) return { and: [{ user: { equals: req.user!.id } }, { status: { in: TUTOR_EDITABLE } }] } as Where;
      return false;
    },
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req, originalDoc }) => {
        // A tutor always owns exactly one profile: their own.
        if (operation === "create" && hasRole(req, "tutor")) {
          data.user = req.user!.id;
          data.status = "draft";
          const existing = await req.payload.count({ collection: "tutor-profiles", where: { user: { equals: req.user!.id } }, overrideAccess: true });
          if (existing.totalDocs > 0) throw new APIError("You already have a tutor profile.", 409, undefined, true);
        }
        // Display name and slug follow the account name.
        const userId = typeof data.user === "object" ? data.user?.id : (data.user ?? originalDoc?.user);
        if (userId && (operation === "create" || !originalDoc?.displayName)) {
          const u = await req.payload.findByID({ collection: "users", id: userId, depth: 0, overrideAccess: true }).catch(() => null);
          if (u) {
            data.displayName = u.firstName && u.lastName ? `${u.firstName} ${String(u.lastName).charAt(0)}.` : u.name;
            data.country ??= u.country;
            data.timezone ??= u.timezone;
          }
        }
        if (!data.slug && !originalDoc?.slug && data.displayName) data.slug = `${slugify(String(data.displayName))}-${Math.random().toString(36).slice(2, 7)}`;
        // Price and subject limits from Settings › Fees & policies (staff may override).
        if (!isStaffUser(req.user) && (data.hourlyRate != null || data.subjects)) {
          const p = (await req.payload.findGlobal({ slug: "platform-settings", overrideAccess: true }).catch(() => null)) as { tutorMinHourlyRate?: number; tutorMaxHourlyRate?: number; maxSubjectsPerTutor?: number } | null;
          const min = p?.tutorMinHourlyRate ?? 10, max = p?.tutorMaxHourlyRate ?? 250, maxSubjects = p?.maxSubjectsPerTutor ?? 5;
          if (data.hourlyRate != null && (data.hourlyRate < min || data.hourlyRate > max)) throw new APIError(`Set an hourly rate between ${min} and ${max}.`, 400, undefined, true);
          if (Array.isArray(data.subjects) && data.subjects.length > maxSubjects) throw new APIError(`Choose up to ${maxSubjects} subjects.`, 400, undefined, true);
        }
        // Keep the primary subject inside the subject list.
        const subjects = (data.subjects ?? originalDoc?.subjects ?? []).map((s: unknown) => (typeof s === "object" && s ? (s as { id: unknown }).id : s));
        if (data.primarySubject) {
          const p = typeof data.primarySubject === "object" ? data.primarySubject.id : data.primarySubject;
          if (!subjects.includes(p)) data.subjects = [p, ...subjects];
        } else if (subjects.length && !originalDoc?.primarySubject) data.primarySubject = subjects[0];
        return data;
      },
    ],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Profile",
          fields: [
            { name: "headline", type: "text", maxLength: 90, admin: { description: "One line students see first, e.g. \"Patient KCSE Maths tutor, 8 years' experience\"." } },
            { name: "about", type: "textarea", maxLength: 2000, admin: { description: "Who you are and how you got into teaching." } },
            { name: "teachingStyle", type: "textarea", maxLength: 1500, admin: { description: "What a lesson with you looks like." } },
            {
              name: "languages",
              type: "array",
              labels: { singular: "Language", plural: "Languages spoken" },
              maxRows: 8,
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "language", type: "relationship", relationTo: "languages", required: true, admin: { width: "60%" } },
                    { name: "level", type: "select", required: true, options: [...LANGUAGE_LEVELS], admin: { width: "40%" } },
                  ],
                },
              ],
            },
            { name: "introVideoUrl", type: "text", label: "Intro video link", admin: { description: "YouTube, Vimeo or Cloudflare Stream link to a 1-2 minute introduction." } },
          ],
        },
        {
          label: "Subjects & pricing",
          fields: [
            { name: "primarySubject", type: "relationship", relationTo: "subjects", index: true },
            { name: "subjects", type: "relationship", relationTo: "subjects", hasMany: true, index: true },
            { name: "levelsTaught", type: "select", hasMany: true, options: [...LEVELS_TAUGHT] },
            {
              type: "row",
              fields: [
                { name: "hourlyRate", type: "number", min: 1, index: true, admin: { width: "33%", description: "Per 60-minute lesson." } },
                { name: "offersTrial", type: "checkbox", defaultValue: true, label: "Offer a discounted trial lesson", admin: { width: "33%" } },
                { name: "instantBooking", type: "checkbox", defaultValue: true, label: "Allow instant booking", admin: { width: "33%" } },
              ],
            },
            { name: "noticeHours", type: "number", min: 0, max: 168, defaultValue: 12, label: "Minimum notice for bookings (hours)" },
          ],
        },
        {
          label: "Background",
          fields: [
            {
              name: "education",
              type: "array",
              maxRows: 8,
              labels: { singular: "Qualification", plural: "Education" },
              fields: [
                { type: "row", fields: [{ name: "degree", type: "text", required: true, admin: { width: "50%" } }, { name: "institution", type: "text", required: true, admin: { width: "50%" } }] },
                {
                  type: "row",
                  fields: [
                    { name: "field", type: "text", admin: { width: "50%" } },
                    { name: "startYear", type: "number", admin: { width: "25%" } },
                    { name: "endYear", type: "number", admin: { width: "25%" } },
                  ],
                },
                { name: "document", type: "upload", relationTo: "private-files", access: { read: ownerOrReviewerField } },
                { name: "verified", type: "checkbox", defaultValue: false, access: { update: reviewerField } },
              ],
            },
            {
              name: "certifications",
              type: "array",
              maxRows: 10,
              fields: [
                { type: "row", fields: [{ name: "title", type: "text", required: true, admin: { width: "50%" } }, { name: "issuer", type: "text", required: true, admin: { width: "50%" } }] },
                { type: "row", fields: [{ name: "year", type: "number", admin: { width: "50%" } }, { name: "credentialId", type: "text", admin: { width: "50%" }, access: { read: ownerOrReviewerField } }] },
                { name: "document", type: "upload", relationTo: "private-files", access: { read: ownerOrReviewerField } },
                { name: "verified", type: "checkbox", defaultValue: false, access: { update: reviewerField } },
              ],
            },
            {
              name: "experience",
              type: "array",
              maxRows: 10,
              labels: { singular: "Role", plural: "Work experience" },
              fields: [
                { type: "row", fields: [{ name: "role", type: "text", required: true, admin: { width: "50%" } }, { name: "organization", type: "text", required: true, admin: { width: "50%" } }] },
                { type: "row", fields: [{ name: "startYear", type: "number", admin: { width: "50%" } }, { name: "endYear", type: "number", admin: { width: "50%", description: "Leave empty if current." } }] },
                { name: "description", type: "textarea", maxLength: 500 },
              ],
            },
          ],
        },
        {
          label: "Identity",
          fields: [
            {
              name: "identity",
              type: "group",
              access: { read: ownerOrReviewerField },
              fields: [
                {
                  name: "documentType",
                  type: "select",
                  options: [
                    { label: "Passport", value: "passport" },
                    { label: "National ID", value: "national_id" },
                    { label: "Driving licence", value: "drivers_license" },
                  ],
                },
                { name: "document", type: "upload", relationTo: "private-files" },
                { name: "verified", type: "checkbox", defaultValue: false, access: { update: reviewerField } },
              ],
            },
          ],
        },
        {
          label: "Review",
          fields: [
            { name: "reviewNotes", type: "textarea", label: "Message to the tutor", access: { read: ownerOrReviewerField, update: reviewerField }, admin: { description: "Shown to the tutor when you request changes or reject." } },
            { name: "internalNotes", type: "textarea", access: { read: reviewerField, update: reviewerField }, admin: { description: "Only staff see this." } },
            {
              name: "reviewHistory",
              type: "array",
              access: { read: ownerOrReviewerField, update: reviewerField, create: reviewerField },
              admin: { readOnly: true },
              fields: [
                { name: "action", type: "select", options: [...TUTOR_STATUSES] },
                { name: "notes", type: "textarea" },
                { name: "at", type: "date" },
                { name: "by", type: "relationship", relationTo: "users" },
              ],
            },
          ],
        },
      ],
    },
    // Sidebar
    { name: "status", type: "select", required: true, defaultValue: "draft", options: [...TUTOR_STATUSES], index: true, access: { update: reviewerField }, admin: { position: "sidebar" } },
    { name: "user", type: "relationship", relationTo: "users", required: true, unique: true, index: true, access: { update: staffField, read: ownerOrReviewerField }, admin: { position: "sidebar" } },
    { name: "displayName", type: "text", index: true, admin: { position: "sidebar", description: "Public name, e.g. \"Jane D.\"" } },
    { name: "slug", type: "text", unique: true, index: true, access: { update: staffField }, admin: { position: "sidebar" } },
    { name: "country", type: "text", index: true, admin: { position: "sidebar" } },
    { name: "timezone", type: "text", admin: { position: "sidebar" } },
    { name: "submittedAt", type: "date", access: { update: reviewerField }, admin: { position: "sidebar", readOnly: true } },
    { name: "approvedAt", type: "date", access: { update: reviewerField }, admin: { position: "sidebar", readOnly: true } },
    { name: "isFeatured", type: "checkbox", defaultValue: false, access: { update: reviewerField }, admin: { position: "sidebar" } },
    { name: "isSuperTutor", type: "checkbox", defaultValue: false, label: "Super tutor", access: { update: reviewerField }, admin: { position: "sidebar" } },
    {
      name: "stats",
      type: "group",
      access: { update: staffField },
      admin: { position: "sidebar", description: "Updated automatically from lessons and reviews." },
      fields: [
        { name: "rating", type: "number", defaultValue: 0, admin: { readOnly: true } },
        { name: "reviewCount", type: "number", defaultValue: 0, admin: { readOnly: true } },
        { name: "lessonsTaught", type: "number", defaultValue: 0, admin: { readOnly: true } },
        { name: "studentsTaught", type: "number", defaultValue: 0, admin: { readOnly: true } },
      ],
    },
  ],
};
