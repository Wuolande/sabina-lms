import type { CollectionConfig } from "payload";
import { anyone, isAdmin, signedIn } from "../access";

/**
 * Public media: avatars, blog and page images, course thumbnails.
 * Stored in Cloudflare R2 (public bucket) and served from R2_PUBLIC_URL.
 * Private files (ID documents, certificates, lesson materials) live in their own collection (private-files).
 */
export const Media: CollectionConfig = {
  slug: "media",
  labels: { singular: "Image or file", plural: "Media library" },
  admin: { group: "Content", defaultColumns: ["filename", "alt", "mimeType", "updatedAt"] },
  access: {
    read: anyone,
    create: signedIn,
    update: ({ req }) => (req.user ? (["admin", "editor", "manager"].includes(String((req.user as { role?: string }).role)) ? true : { uploadedBy: { equals: req.user.id } }) : false),
    delete: isAdmin,
  },
  upload: {
    mimeTypes: ["image/*", "application/pdf"],
    focalPoint: true,
    formatOptions: { format: "webp", options: { quality: 82 } },
    resizeOptions: { width: 2400, height: 2400, fit: "inside", withoutEnlargement: true },
    imageSizes: [
      { name: "thumb", width: 320, height: 320, position: "centre" },
      { name: "card", width: 800 },
      { name: "hero", width: 1800 },
    ],
    adminThumbnail: "thumb",
  },
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === "create" && req.user && !data.uploadedBy) data.uploadedBy = req.user.id;
        return data;
      },
    ],
  },
  fields: [
    { name: "alt", type: "text", required: true, admin: { description: "Describe the image for screen readers and Google Images." } },
    { name: "uploadedBy", type: "relationship", relationTo: "users", admin: { readOnly: true, position: "sidebar" } },
  ],
};
