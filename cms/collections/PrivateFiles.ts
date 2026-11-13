import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Access, CollectionConfig, Where } from "payload";
import { hasRole, isStaffUser } from "../access";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Owner or the staff who verify tutors. Tutors can also open the files their own students
 * handed in as homework (and nothing else).
 */
const ownerOrReviewer: Access = async ({ req }): Promise<boolean | Where> => {
  if (!req.user) return false;
  if (hasRole(req, "admin", "manager", "support")) return true;
  if ((req.user as { role?: string }).role === "tutor") {
    const handedIn = await req.payload.find({
      collection: "assignments",
      where: { and: [{ tutorUser: { equals: req.user.id } }, { status: { not_equals: "assigned" } }] },
      select: { files: true },
      limit: 1000,
      depth: 0,
      overrideAccess: true,
      pagination: false,
    });
    const ids = handedIn.docs.flatMap((a) => (a.files ?? []).map((f) => (typeof f === "object" && f ? f.id : f)));
    if (ids.length) return { or: [{ owner: { equals: req.user.id } }, { id: { in: ids } }] as Where[] };
  }
  return { owner: { equals: req.user.id } };
};

/**
 * Private documents: tutor ID, degree and certificate scans, and students' homework files. Stored in the private Cloudflare R2
 * bucket (local `private-uploads/` folder in development) and only ever served through Payload,
 * which checks access on every download. Never public, never cached by a CDN.
 */
export const PrivateFiles: CollectionConfig = {
  slug: "private-files",
  labels: { singular: "Private document", plural: "Private documents" },
  admin: { group: "People", defaultColumns: ["filename", "kind", "owner", "createdAt"], useAsTitle: "filename" },
  access: {
    read: ownerOrReviewer,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => isStaffUser(req.user),
    delete: ({ req }) => (req.user ? (hasRole(req, "admin") ? true : { owner: { equals: req.user.id } }) : false),
  },
  upload: {
    staticDir: path.resolve(dirname, "../../private-uploads"),
    mimeTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"],
    // Keep originals exactly as uploaded: these are evidence, not display images.
    disableLocalStorage: false,
  },
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === "create" && req.user && !isStaffUser(req.user)) data.owner = req.user.id;
        if (operation === "create" && req.user && !data.owner) data.owner = req.user.id;
        return data;
      },
    ],
  },
  fields: [
    { name: "owner", type: "relationship", relationTo: "users", required: true, index: true, admin: { readOnly: true, position: "sidebar" } },
    {
      name: "kind",
      type: "select",
      required: true,
      defaultValue: "other",
      options: [
        { label: "Identity document", value: "identity" },
        { label: "Degree or diploma", value: "degree" },
        { label: "Certificate", value: "certificate" },
        { label: "Homework", value: "homework" },
        { label: "Other", value: "other" },
      ],
    },
  ],
};
