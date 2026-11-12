import type { GlobalConfig } from "payload";
import { anyone, isAdmin } from "../access";
import { BRAND_COLOURS } from "../brand";

const colour = (name: keyof typeof BRAND_COLOURS, label: string) => ({
  name,
  label,
  type: "text" as const,
  defaultValue: BRAND_COLOURS[name],
  validate: (v: unknown) => (!v || /^#[0-9a-f]{6}$/i.test(String(v)) ? true : "Use a hex colour like #14209C"),
  admin: { width: "33%" },
});

/** Platform name, brand and contact details used across the site, portals, emails and admin. */
export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Site settings",
  admin: { group: "Settings" },
  access: { read: anyone, update: isAdmin },
  hooks: { afterChange: [async () => (await import("../content/revalidate")).refreshSite(["/"])] },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "General",
          fields: [
            { name: "platformName", type: "text", defaultValue: "Sabina Education", required: true },
            { name: "tagline", type: "text", defaultValue: "Learn from verified tutors, live." },
            { name: "supportEmail", type: "email" },
            { name: "supportPhone", type: "text" },
          ],
        },
        {
          label: "Brand",
          name: "brand",
          fields: [
            {
              type: "row",
              fields: [
                { name: "logo", type: "upload", relationTo: "media", admin: { width: "33%" } },
                { name: "logoDark", type: "upload", relationTo: "media", label: "Logo (dark mode)", admin: { width: "33%" } },
                { name: "icon", type: "upload", relationTo: "media", label: "Square icon", admin: { width: "33%" } },
              ],
            },
            {
              name: "colours",
              type: "group",
              fields: [
                { type: "row", fields: [colour("primary", "Primary"), colour("primaryLight", "Primary light"), colour("primaryDark", "Primary dark")] },
                { type: "row", fields: [colour("accent", "Accent"), colour("accentDark", "Accent dark"), colour("success", "Success")] },
              ],
            },
          ],
        },
        {
          label: "Search and sharing",
          name: "seo",
          fields: [
            { name: "title", type: "text", maxLength: 70, label: "Homepage title", defaultValue: "Sabina: live 1-on-1 tutoring with verified tutors" },
            { name: "description", type: "textarea", maxLength: 200, defaultValue: "Find a tutor for maths, sciences, languages, KCSE and IELTS. Book a time that suits you and learn live in your browser." },
            { name: "image", type: "upload", relationTo: "media", label: "Default sharing image", admin: { description: "1200 × 630. Used when a page has no image of its own." } },
            { name: "twitter", type: "text", label: "X (Twitter) handle", admin: { description: "e.g. @sabina" } },
            { type: "row", fields: [{ name: "googleVerification", type: "text", label: "Google site verification", admin: { width: "50%" } }, { name: "bingVerification", type: "text", label: "Bing site verification", admin: { width: "50%" } }] },
            { name: "allowIndexing", type: "checkbox", defaultValue: true, label: "Let search engines index the site", admin: { description: "Turn off on staging sites." } },
          ],
        },
      ],
    },
  ],
};
