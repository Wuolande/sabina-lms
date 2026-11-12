import type { CollectionConfig, Field, Where } from "payload";
import { hasRole, isAdmin } from "../access";
import { refreshSite } from "../content/revalidate";

const editors = ({ req }: { req: Parameters<typeof hasRole>[0] }) => hasRole(req, "admin", "manager", "editor");
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

const slugField = (from: string): Field => ({
  name: "slug",
  type: "text",
  unique: true,
  index: true,
  admin: { position: "sidebar", description: "The web address. Filled in from the title if left empty." },
  hooks: { beforeValidate: [({ value, siblingData }) => (value ? slugify(String(value)) : siblingData?.[from] ? slugify(String(siblingData[from])) : value)] },
});

const seo: Field = {
  name: "seo",
  type: "group",
  label: "Search and sharing",
  admin: { description: "Optional. Leave empty to use the title and summary." },
  fields: [
    { name: "title", type: "text", maxLength: 70, admin: { description: "Up to 60 characters shows in full on Google." } },
    { name: "description", type: "textarea", maxLength: 200, admin: { description: "Up to 155 characters shows in full on Google." } },
    { name: "image", type: "upload", relationTo: "media", label: "Sharing image", admin: { description: "1200 × 630 works best." } },
    { name: "noIndex", type: "checkbox", label: "Hide from search engines" },
  ],
};

/** Words in a Lexical document, for reading time. */
function wordCount(node: unknown): number {
  if (!node || typeof node !== "object") return 0;
  const n = node as { text?: string; children?: unknown[]; root?: unknown };
  if (n.root) return wordCount(n.root);
  return (n.text ? n.text.split(/\s+/).filter(Boolean).length : 0) + (n.children ?? []).reduce<number>((s, c) => s + wordCount(c), 0);
}

const publishedOnly = ({ req }: { req: Parameters<typeof hasRole>[0] }) =>
  hasRole(req, "admin", "manager", "editor", "support") ? true : ({ and: [{ status: { equals: "published" } }, { publishedAt: { less_than_equal: new Date().toISOString() } }] } as Where);

export const BlogCategories: CollectionConfig = {
  slug: "blog-categories",
  labels: { singular: "Blog category", plural: "Blog categories" },
  admin: { group: "Website", useAsTitle: "name", defaultColumns: ["name", "slug", "order"] },
  access: { read: () => true, create: editors, update: editors, delete: editors },
  hooks: { afterChange: [async () => refreshSite(["/blog"])] },
  defaultSort: "order",
  fields: [
    { name: "name", type: "text", required: true },
    slugField("name"),
    { name: "description", type: "textarea", maxLength: 200 },
    { name: "order", type: "number", defaultValue: 0, admin: { position: "sidebar" } },
  ],
};

export const Posts: CollectionConfig = {
  slug: "posts",
  labels: { singular: "Blog post", plural: "Blog posts" },
  admin: { group: "Website", useAsTitle: "title", defaultColumns: ["title", "category", "status", "publishedAt"], preview: (doc) => `/blog/${doc.slug}` },
  access: { read: publishedOnly, create: editors, update: editors, delete: editors },
  defaultSort: "-publishedAt",
  hooks: {
    afterChange: [async ({ doc, previousDoc }) => refreshSite(["/", "/blog", `/blog/${doc.slug}`, ...(previousDoc?.slug && previousDoc.slug !== doc.slug ? [`/blog/${previousDoc.slug}`] : []), "/rss.xml", "/sitemap.xml"])],
    afterDelete: [async ({ doc }) => refreshSite(["/", "/blog", `/blog/${doc.slug}`])],
    beforeChange: [
      ({ data, originalDoc }) => {
        if (data.status === "published" && !data.publishedAt && !originalDoc?.publishedAt) data.publishedAt = new Date().toISOString();
        data.readingMinutes = Math.max(1, Math.round(wordCount(data.body) / 220));
        return data;
      },
    ],
  },
  fields: [
    { name: "title", type: "text", required: true, maxLength: 120 },
    { name: "excerpt", type: "textarea", required: true, maxLength: 280, label: "Summary", admin: { description: "One or two sentences for the blog list and search results." } },
    { name: "cover", type: "upload", relationTo: "media", label: "Cover image" },
    { name: "body", type: "richText", required: true },
    seo,
    slugField("title"),
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
      index: true,
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
      admin: { position: "sidebar" },
    },
    { name: "publishedAt", type: "date", index: true, admin: { position: "sidebar", date: { pickerAppearance: "dayAndTime" }, description: "Set a future date to schedule it." } },
    { name: "featured", type: "checkbox", admin: { position: "sidebar", description: "Show at the top of the blog." } },
    { name: "category", type: "relationship", relationTo: "blog-categories", admin: { position: "sidebar" } },
    { name: "author", type: "relationship", relationTo: "users", admin: { position: "sidebar" }, filterOptions: { role: { in: ["admin", "manager", "editor", "support", "tutor"] } } },
    { name: "authorTitle", type: "text", admin: { position: "sidebar", description: "e.g. \"Maths tutor\" or \"Sabina team\"" } },
    { name: "readingMinutes", type: "number", admin: { position: "sidebar", readOnly: true } },
  ],
};

export const Pages: CollectionConfig = {
  slug: "pages",
  labels: { singular: "Page", plural: "Pages" },
  admin: {
    group: "Website",
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "kind", "status", "updatedAt"],
    preview: (doc) => (["about", "pricing", "terms", "privacy", "cookies", "refund-policy"].includes(String(doc.slug)) ? `/${doc.slug}` : `/pages/${doc.slug}`),
    description: "About, Pricing and the legal pages, plus any extra pages you add (shown at /pages/<slug>).",
  },
  access: { read: ({ req }) => (hasRole(req, "admin", "manager", "editor", "support") ? true : ({ status: { equals: "published" } } as Where)), create: editors, update: editors, delete: isAdmin },
  hooks: { afterChange: [async ({ doc }) => refreshSite([`/${doc.slug}`, `/pages/${doc.slug}`, "/sitemap.xml"])] },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "intro", type: "textarea", maxLength: 300, admin: { description: "Short line under the title." } },
    { name: "body", type: "richText", required: true },
    seo,
    slugField("title"),
    { name: "kind", type: "select", defaultValue: "company", options: [{ label: "Company", value: "company" }, { label: "Legal", value: "legal" }, { label: "Help", value: "help" }], admin: { position: "sidebar" } },
    { name: "status", type: "select", required: true, defaultValue: "published", options: [{ label: "Draft", value: "draft" }, { label: "Published", value: "published" }], admin: { position: "sidebar" } },
  ],
};
