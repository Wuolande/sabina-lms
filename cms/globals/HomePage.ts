import type { GlobalConfig, Field } from "payload";
import { hasRole } from "../access";
import { refreshSite } from "../content/revalidate";

const editors = ({ req }: { req: Parameters<typeof hasRole>[0] }) => hasRole(req, "admin", "manager", "editor");
const text = (name: string, label?: string, extra: Partial<Field> = {}): Field => ({ name, type: "text", label, ...extra }) as Field;
const counter = (name: string, label: string): Field => ({
  name,
  type: "group",
  label,
  fields: [
    {
      type: "row",
      fields: [
        { name: "value", type: "number", admin: { width: "25%" } },
        { name: "suffix", type: "text", admin: { width: "20%", description: "e.g. +, %, h" } },
        { name: "decimals", type: "number", defaultValue: 0, min: 0, max: 2, admin: { width: "15%" } },
        { name: "label", type: "text", admin: { width: "40%", description: "Leave empty to use the default." } },
      ],
    },
  ],
});

/**
 * Homepage text and images. Empty fields fall back to Sabina's default copy (cms/content/home.ts).
 * Write {cancelHours}, {trialMinutes}, {tutorShare} or {earlyJoin} to show the current platform rules.
 */
export const HomePage: GlobalConfig = {
  slug: "home-page",
  label: "Homepage",
  admin: { group: "Website", description: "Leave a field empty to use the default text. {cancelHours}, {trialMinutes}, {tutorShare} and {earlyJoin} are replaced with the current platform rules." },
  access: { read: () => true, update: editors },
  hooks: { afterChange: [async () => refreshSite(["/"])] },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Hero",
          name: "hero",
          fields: [
            text("pretitle", "Small heading"),
            { name: "headlines", type: "array", label: "Rotating headlines", maxRows: 8, fields: [text("text", "Headline", { required: true })] },
            { name: "subheading", type: "textarea" },
            text("searchPlaceholder", "Search box placeholder"),
            { name: "popularTags", type: "array", label: "Quick subject links", maxRows: 6, fields: [{ type: "row", fields: [text("label", "Label", { required: true, admin: { width: "50%" } }), text("slug", "Subject slug", { required: true, admin: { width: "50%" } })] }] },
            { name: "image", type: "upload", relationTo: "media", label: "Hero photo" },
            text("proofText", "Line under the avatars", { admin: { description: "Shown with the average review rating once there are at least 5 reviews." } }),
            counter("card1", "Floating card 1"),
            counter("card2", "Floating card 2"),
            counter("card3", "Floating card 3"),
          ],
        },
        {
          label: "Numbers",
          name: "stats",
          fields: [
            { name: "live", type: "checkbox", label: "Show live numbers", defaultValue: false, admin: { description: "Tutors, students, lessons taught and average rating, counted from the platform. Turn on once the numbers are worth showing." } },
            counter("stat1", "Number 1"),
            counter("stat2", "Number 2"),
            counter("stat3", "Number 3"),
            counter("stat4", "Number 4"),
          ],
        },
        {
          label: "Sections",
          name: "sections",
          fields: [
            { name: "subjects", type: "group", fields: [{ type: "row", fields: [text("pretitle", "Small heading", { admin: { width: "30%" } }), text("title", "Title", { admin: { width: "40%" } }), text("cta", "Button", { admin: { width: "30%" } })] }] },
            { name: "tutors", type: "group", fields: [{ type: "row", fields: [text("pretitle", "Small heading", { admin: { width: "30%" } }), text("title", "Title", { admin: { width: "40%" } }), text("cta", "Button", { admin: { width: "30%" } })] }] },
            { name: "classroom", type: "group", fields: [text("badge"), text("title"), { name: "subtitle", type: "textarea" }] },
            { name: "steps", type: "group", label: "How it works", fields: [text("pretitle", "Small heading"), text("title"), { name: "items", type: "array", maxRows: 4, fields: [text("title", "Title", { required: true }), { name: "text", type: "textarea", required: true }] }] },
            {
              name: "teach",
              type: "group",
              label: "Become a tutor",
              fields: [text("badge"), text("title"), { name: "subtitle", type: "textarea" }, { name: "points", type: "array", maxRows: 5, fields: [text("text", "Point", { required: true })] }, text("cta", "Button"), text("secondary", "Second button")],
            },
            { name: "faq", type: "group", label: "Questions", fields: [text("pretitle", "Small heading"), text("title"), { name: "items", type: "array", fields: [text("q", "Question", { required: true }), { name: "a", type: "textarea", label: "Answer", required: true }] }] },
          ],
        },
      ],
    },
  ],
};
