import type { Field, GlobalConfig } from "payload";
import { isAdmin } from "../access";
import { KEYS, SECRET_PATHS, TABS, type IntegrationKey } from "../integrations/keys";
import { decrypt, encrypt, isMasked, mask } from "../integrations/crypto";

const input = (k: IntegrationKey): Field => ({
  name: k.name,
  label: k.label,
  type: "text",
  admin: {
    placeholder: k.secret ? "Paste the key here" : k.placeholder,
    description: [k.secret ? "Saved encrypted. Only the last 4 characters are shown again. Clear the box to remove it." : "", k.description ?? ""].filter(Boolean).join(" "),
    ...(k.width ? { width: k.width } : {}),
  },
});

/** Pair up half-width fields into rows, so the form reads two to a line on wide screens. */
function layout(keys: IntegrationKey[]): Field[] {
  const out: Field[] = [];
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i]!;
    const next = keys[i + 1];
    if (k.width && next?.width) {
      out.push({ type: "row", fields: [input(k), input(next)] });
      i++;
    } else out.push(input(k));
  }
  return out;
}

type Doc = Record<string, Record<string, unknown> | undefined>;

/**
 * Keys and settings for email, payments, video, text messages and push, in one place for admins.
 * Secret values are encrypted before saving and never sent back to the browser in full.
 */
export const Integrations: GlobalConfig = {
  slug: "integrations",
  label: "Integrations & keys",
  admin: {
    group: "Settings",
    description:
      "Connect email, payments, live video, text messages and notifications. Changes apply within a minute, without redeploying. Each tab shows whether a service is ready and lets you send a test. Only the database address, the sign-in secret and file storage (R2) stay in your hosting settings, because the site needs them to start.",
  },
  access: { read: isAdmin, update: isAdmin },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        const saved = ((await req.payload.db.findGlobal({ slug: "integrations", req }).catch(() => null)) ?? {}) as Doc;
        const next = data as Doc;
        for (const k of KEYS) {
          const tab = (next[k.tab] ??= {});
          const v = tab[k.name];
          const before = saved[k.tab]?.[k.name];
          if (k.secret) {
            if (v === undefined || isMasked(v)) tab[k.name] = before ?? null; // unchanged
            else if (typeof v === "string" && v.trim()) tab[k.name] = encrypt(v.trim());
            else tab[k.name] = null; // cleared
          } else if (typeof v === "string") tab[k.name] = v.trim() || null;
        }
        return data;
      },
    ],
    afterRead: [
      // Secrets always leave the database masked. The server reads them raw (cms/integrations/server.ts).
      ({ doc }) => {
        const d = doc as Doc;
        for (const [tab, name] of SECRET_PATHS) {
          const v = d[tab]?.[name];
          if (typeof v !== "string" || !v) continue;
          d[tab]![name] = mask(decrypt(v));
        }
        return doc;
      },
    ],
    afterChange: [
      async ({ req }) => {
        const { applyIntegrations } = await import("../integrations/server");
        await applyIntegrations(req.payload, true, req);
      },
    ],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        ...TABS.map((t) => ({
          name: t.name,
          label: t.label,
          description: t.intro,
          fields: [
            { name: "status", type: "ui", admin: { components: { Field: { path: "/cms/admin/integrations/IntegrationPanel#IntegrationPanel", clientProps: { tab: t.name } } } } } as Field,
            ...layout(KEYS.filter((k) => k.tab === t.name)),
          ],
        })),
        {
          label: "Scheduler",
          description: "Reminders, lesson completion and clean-up run on a schedule.",
          fields: [{ name: "schedulerStatus", type: "ui", admin: { components: { Field: { path: "/cms/admin/integrations/IntegrationPanel#IntegrationPanel", clientProps: { tab: "scheduler" } } } } } as Field],
        },
      ],
    },
  ],
};
