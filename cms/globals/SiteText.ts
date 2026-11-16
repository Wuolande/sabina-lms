import type { Field, GlobalConfig } from "payload";
import { anyone, isEditor } from "../access";
import { TEXT_DEFAULTS as D, TEXT_TOKENS } from "../content/text-defaults";

const EMPTY = "Leave empty to use the default shown in grey.";

const text = (name: string, label: string, placeholder: string, width?: string): Field => ({
  name,
  label,
  type: "text",
  admin: { placeholder, ...(width ? { width } : {}) },
});
const area = (name: string, label: string, placeholder: string): Field => ({ name, label, type: "textarea", admin: { placeholder, rows: 3 } });

const links = (name: string, label: string, defaults: { label: string; href: string }[]): Field => ({
  name,
  label,
  type: "array",
  maxRows: 10,
  admin: { description: `${EMPTY} Default: ${defaults.map((l) => l.label).join(", ")}.`, initCollapsed: true },
  fields: [{ type: "row", fields: [{ name: "label", type: "text", required: true, admin: { width: "50%" } }, { name: "href", label: "Link", type: "text", required: true, admin: { width: "50%", description: "A page on this site, e.g. /find-tutors" } }] }],
});
const lines = (name: string, label: string, defaults: string[], max = 6): Field => ({
  name,
  label,
  type: "array",
  maxRows: max,
  admin: { description: `${EMPTY} Default: ${defaults.join(" · ")}`, initCollapsed: true },
  fields: [{ name: "text", type: "text", required: true }],
});
const items = (name: string, label: string, defaults: { title: string }[], max = 4): Field => ({
  name,
  label,
  type: "array",
  maxRows: max,
  admin: { description: `${EMPTY} Default: ${defaults.map((d) => d.title).join(" · ")}`, initCollapsed: true },
  fields: [{ name: "title", type: "text", required: true }, { name: "text", type: "textarea", required: true }],
});

/** Wording for menus, footer, How it works, Become a tutor, Contact and the sign-in screens. */
export const SiteText: GlobalConfig = {
  slug: "site-text",
  label: "Page wording",
  admin: { group: "Website", description: `Change the wording on these pages. Tags in braces are filled in with your live settings: ${TEXT_TOKENS}.` },
  access: { read: anyone, update: isEditor },
  hooks: { afterChange: [async () => (await import("../content/revalidate")).refreshSite(["/", "/how-it-works", "/become-a-tutor", "/contact", "/login", "/register"])] },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Top menu",
          name: "menu",
          fields: [
            links("links", "Menu links", D.menu.links),
            text("portalsLabel", "Portals menu name", D.menu.portalsLabel),
            { type: "row", fields: [text("studentLabel", "Student portal", D.menu.studentLabel, "40%"), text("studentText", "Student portal description", D.menu.studentText, "60%")] },
            { type: "row", fields: [text("tutorLabel", "Tutor portal", D.menu.tutorLabel, "40%"), text("tutorText", "Tutor portal description", D.menu.tutorText, "60%")] },
            links("secondary", "Extra links in the portals menu", D.menu.secondary),
          ],
        },
        {
          label: "Footer",
          name: "footer",
          fields: [
            lines("trust", "Promises along the top", D.footer.trust, 4),
            { type: "row", fields: [text("subjectsTitle", "Subjects column title", D.footer.subjectsTitle, "33%"), text("learnTitle", "Second column title", D.footer.learnTitle, "33%"), text("companyTitle", "Third column title", D.footer.companyTitle, "33%")] },
            links("learnLinks", "Second column links", D.footer.learnLinks),
            links("companyLinks", "Third column links", D.footer.companyLinks),
          ],
        },
        {
          label: "How it works",
          name: "howItWorks",
          fields: [
            text("badge", "Small heading", D.howItWorks.badge),
            text("title", "Title", D.howItWorks.title),
            area("intro", "Introduction", D.howItWorks.intro),
            items("steps", "Steps", D.howItWorks.steps),
            text("payBadge", "Payments: small heading", D.howItWorks.payBadge),
            text("payTitle", "Payments: title", D.howItWorks.payTitle),
            area("payText", "Payments: text", D.howItWorks.payText),
            { type: "row", fields: [text("cta", "Button", D.howItWorks.cta, "50%"), text("secondaryCta", "Link under the button", D.howItWorks.secondaryCta, "50%")] },
          ],
        },
        {
          label: "Become a tutor",
          name: "becomeTutor",
          fields: [
            text("badge", "Small heading", D.becomeTutor.badge),
            text("title", "Title", D.becomeTutor.title),
            area("intro", "Introduction", D.becomeTutor.intro),
            text("cta", "Button", D.becomeTutor.cta),
            { type: "row", fields: [text("calcEyebrow", "Calculator: small heading", D.becomeTutor.calcEyebrow, "50%"), text("calcTitle", "Calculator: title", D.becomeTutor.calcTitle, "50%")] },
            text("reasonsTitle", "Reasons: title", D.becomeTutor.reasonsTitle),
            items("reasons", "Reasons", D.becomeTutor.reasons, 6),
            text("stepsTitle", "Steps: title", D.becomeTutor.stepsTitle),
            items("steps", "Steps to apply", D.becomeTutor.steps, 5),
          ],
        },
        {
          label: "Contact",
          name: "contact",
          fields: [
            text("badge", "Small heading", D.contact.badge),
            text("title", "Title", D.contact.title),
            area("intro", "Introduction", D.contact.intro),
            text("sideTitle", "Side panel title", D.contact.sideTitle),
            { type: "row", fields: [text("sentTitle", "After sending: title", D.contact.sentTitle, "40%"), text("sentText", "After sending: text", D.contact.sentText, "60%")] },
          ],
        },
        {
          label: "Sign-in screens",
          name: "signIn",
          fields: [
            ...(["student", "tutor"] as const).map(
              (who): Field => ({
                name: who,
                label: who === "student" ? "Students" : "Tutors",
                type: "group",
                fields: [
                  text("badge", "Small heading", D.signIn[who].badge),
                  text("title", "Title", D.signIn[who].title),
                  area("text", "Text", D.signIn[who].text),
                  lines("points", "Points", D.signIn[who].points, 4),
                ],
              }),
            ),
            {
              name: "chips",
              label: "Three highlights",
              type: "array",
              maxRows: 3,
              admin: { description: `${EMPTY} Default: ${D.signIn.chips.map((c) => `${c.value} ${c.label}`).join(" · ")}`, initCollapsed: true },
              fields: [{ type: "row", fields: [{ name: "value", type: "text", required: true, admin: { width: "40%" } }, { name: "label", type: "text", required: true, admin: { width: "60%" } }] }],
            },
          ],
        },
      ],
    },
  ],
};
