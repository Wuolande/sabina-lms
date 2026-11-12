import type { TextField } from "payload";

export const slugify = (v: string) =>
  v
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

/** URL slug, filled from another field when left empty. */
export const slugField = (from: string): TextField => ({
  name: "slug",
  type: "text",
  unique: true,
  index: true,
  admin: { position: "sidebar", description: "Used in the web address. Filled in automatically." },
  hooks: {
    beforeValidate: [({ value, data }) => (value ? slugify(String(value)) : data?.[from] ? slugify(String(data[from])) : value)],
  },
});
