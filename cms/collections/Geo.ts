import type { CollectionConfig } from "payload";
import { APIError } from "payload";
import { anyone, isAdmin, isEditor } from "../access";
import { validTimeZone } from "../../lib/time";
import { clearGeoCache } from "../geo/server";

const clear = () => {
  clearGeoCache();
};

/** Countries people can pick on their profile. Turn one off to hide it from every picker. */
export const Countries: CollectionConfig = {
  slug: "countries",
  labels: { singular: "Country", plural: "Countries" },
  admin: {
    group: "Settings",
    useAsTitle: "name",
    defaultColumns: ["name", "code", "timezones", "isActive"],
    listSearchableFields: ["name", "code"],
    description: "The countries tutors and students choose from. Turn one off to hide it.",
    pagination: { defaultLimit: 50 },
  },
  defaultSort: "name",
  access: { read: anyone, create: isEditor, update: isEditor, delete: isAdmin },
  hooks: { afterChange: [clear], afterDelete: [clear] },
  fields: [
    { type: "row", fields: [
      { name: "name", type: "text", required: true, unique: true, admin: { width: "60%" } },
      {
        name: "code",
        type: "text",
        required: true,
        unique: true,
        admin: { width: "40%", description: "Two-letter ISO code, e.g. KE." },
        hooks: { beforeValidate: [({ value }) => (typeof value === "string" ? value.trim().toUpperCase() : value)] },
        validate: (v: unknown) => (typeof v === "string" && /^[A-Z]{2}$/.test(v) ? true : "Use the two-letter country code, e.g. KE."),
      },
    ] },
    {
      name: "timezones",
      type: "relationship",
      relationTo: "timezones",
      hasMany: true,
      label: "Time zones",
      admin: { description: "Suggested first when someone picks this country." },
    },
    { name: "isActive", type: "checkbox", defaultValue: true, label: "Show in pickers", admin: { position: "sidebar" } },
  ],
};

/** Time zones people can pick for their lessons and calendar. */
export const Timezones: CollectionConfig = {
  slug: "timezones",
  labels: { singular: "Time zone", plural: "Time zones" },
  admin: {
    group: "Settings",
    useAsTitle: "label",
    defaultColumns: ["label", "zone", "isActive"],
    listSearchableFields: ["label", "zone"],
    description: "The time zones tutors and students choose from. Turn one off to hide it.",
    pagination: { defaultLimit: 50 },
  },
  defaultSort: "zone",
  access: { read: anyone, create: isEditor, update: isEditor, delete: isAdmin },
  hooks: {
    afterChange: [clear],
    afterDelete: [clear],
    beforeChange: [
      ({ data }) => {
        if (data.zone && !validTimeZone(data.zone)) throw new APIError("That isn't a time zone the calendar knows. Use an IANA name such as Africa/Nairobi.", 400, undefined, true);
        if (!data.label && data.zone) data.label = zoneLabel(data.zone);
        return data;
      },
    ],
  },
  fields: [
    { type: "row", fields: [
      { name: "zone", type: "text", required: true, unique: true, admin: { width: "50%", description: "IANA name, e.g. Africa/Nairobi." } },
      { name: "label", type: "text", admin: { width: "50%", description: "What people see, e.g. Nairobi. Filled in for you if empty." } },
    ] },
    { name: "isActive", type: "checkbox", defaultValue: true, label: "Show in pickers", admin: { position: "sidebar" } },
  ],
};

/** "America/Argentina/Buenos_Aires" → "Buenos Aires, Argentina". */
export function zoneLabel(zone: string) {
  if (zone === "UTC") return "UTC";
  const parts = zone.split("/").map((p) => p.replace(/_/g, " "));
  const city = parts[parts.length - 1]!;
  const region = parts.length > 2 ? parts[parts.length - 2] : parts[0];
  return `${city}, ${region}`;
}
