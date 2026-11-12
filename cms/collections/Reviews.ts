import type { CollectionConfig, Where } from "payload";
import { hasRole, isAdmin } from "../access";

/** Recompute a tutor's rating and review count from published reviews. */
async function refreshTutorStats(req: import("payload").PayloadRequest, tutorId: number) {
  const payload = req.payload;
  const r = await payload.find({ collection: "reviews", where: { and: [{ tutor: { equals: tutorId } }, { status: { equals: "published" } }] }, limit: 5000, pagination: false, depth: 0, select: { rating: true }, overrideAccess: true, req });
  const n = r.docs.length;
  const avg = n ? Math.round((r.docs.reduce((s, d) => s + (d.rating ?? 0), 0) / n) * 10) / 10 : 0;
  const t = await payload.findByID({ collection: "tutor-profiles", id: tutorId, depth: 0, overrideAccess: true, req });
  await payload.update({ collection: "tutor-profiles", id: tutorId, data: { stats: { ...(t.stats ?? {}), rating: avg, reviewCount: n } } as never, overrideAccess: true, req, context: { skipTutorChecks: true } });
}

/** One review per completed lesson, written by the student. Staff can hide a review. */
export const Reviews: CollectionConfig = {
  slug: "reviews",
  labels: { singular: "Review", plural: "Reviews" },
  admin: { group: "Teaching", useAsTitle: "title", defaultColumns: ["title", "rating", "tutor", "student", "status", "createdAt"] },
  access: {
    read: ({ req }) => (hasRole(req, "admin", "manager", "support", "editor") ? true : ({ status: { equals: "published" } } as Where)),
    create: () => false,
    update: ({ req }) => hasRole(req, "admin", "manager", "support"),
    delete: isAdmin,
  },
  defaultSort: "-createdAt",
  hooks: {
    afterChange: [async ({ doc, req }) => refreshTutorStats(req, typeof doc.tutor === "object" ? doc.tutor.id : doc.tutor)],
    afterDelete: [async ({ doc, req }) => refreshTutorStats(req, typeof doc.tutor === "object" ? doc.tutor.id : doc.tutor)],
  },
  fields: [
    { name: "title", type: "text", admin: { hidden: true }, hooks: { beforeChange: [({ siblingData }) => `${siblingData.rating}★ ${String(siblingData.comment ?? "").slice(0, 60)}`] } },
    {
      type: "row",
      fields: [
        { name: "rating", type: "number", required: true, min: 1, max: 5, admin: { width: "30%" } },
        { name: "status", type: "select", required: true, defaultValue: "published", options: [{ label: "Published", value: "published" }, { label: "Hidden", value: "hidden" }], index: true, admin: { width: "30%" } },
      ],
    },
    { name: "comment", type: "textarea", maxLength: 1500 },
    { name: "tutorReply", type: "textarea", maxLength: 1000 },
    { name: "booking", type: "relationship", relationTo: "bookings", required: true, unique: true, admin: { readOnly: true } },
    { name: "tutor", type: "relationship", relationTo: "tutor-profiles", required: true, index: true, admin: { readOnly: true } },
    { name: "student", type: "relationship", relationTo: "users", required: true, index: true, admin: { readOnly: true } },
    { name: "studentName", type: "text", admin: { readOnly: true, description: "Shown publicly, e.g. \"Amani N.\"" } },
    { name: "subject", type: "text", admin: { readOnly: true } },
  ],
};
