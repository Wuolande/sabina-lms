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
      ],
    },
  ],
};
