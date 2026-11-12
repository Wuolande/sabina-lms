import type { CollectionConfig } from "payload";
import { APIError } from "payload";
import { isAdmin, isStaffUser, staffOrOwner } from "../access";
import { toMinutes, validTimeZone } from "../../lib/time";

/**
 * A tutor's weekly hours, time off and booking rules. Kept apart from the tutor profile so an
 * approved tutor can change their hours without reopening their application. Students never read
 * this directly: the slots API turns it into open times.
 */
export const Schedules: CollectionConfig = {
  slug: "schedules",
  labels: { singular: "Schedule", plural: "Schedules" },
  admin: { group: "Tutors", useAsTitle: "label", defaultColumns: ["label", "timezone", "instantBooking", "updatedAt"] },
  access: {
    read: staffOrOwner(),
    create: ({ req }) => Boolean(req.user && (req.user.role === "tutor" || isStaffUser(req.user))),
    update: staffOrOwner(),
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (operation === "create" && req.user && !isStaffUser(req.user)) data.user = req.user.id;
        if (data.timezone && !validTimeZone(data.timezone)) throw new APIError("Choose a valid time zone.", 400, undefined, true);
        const weekly = (data.weekly ?? []) as { day: string; start: string; end: string }[];
        for (const w of weekly) {
          const s = toMinutes(w.start);
          const e = toMinutes(w.end);
          if (!(s >= 0 && e <= 24 * 60 && e > s)) throw new APIError(`Check the hours on ${w.day}: the end must be after the start.`, 400, undefined, true);
        }
        // Overlapping ranges on the same day are merged by the slot builder, but reject obvious mistakes.
        const byDay = new Map<string, [number, number][]>();
        for (const w of weekly) byDay.set(w.day, [...(byDay.get(w.day) ?? []), [toMinutes(w.start), toMinutes(w.end)]]);
        for (const [day, ranges] of byDay) {
          ranges.sort((a, b) => a[0] - b[0]);
          for (let i = 1; i < ranges.length; i++) if (ranges[i][0] < ranges[i - 1][1]) throw new APIError(`Two time ranges overlap on ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][+day]}.`, 400, undefined, true);
        }
        for (const t of (data.timeOff ?? []) as { from: string; to: string }[]) {
          if (t.from && t.to && t.to < t.from) throw new APIError("Time off must end on or after the day it starts.", 400, undefined, true);
        }
        return data;
      },
    ],
    afterChange: [
      // The marketplace filters on these, so mirror them onto the tutor profile.
      async ({ doc, req }) => {
        const found = await req.payload.find({ collection: "tutor-profiles", where: { user: { equals: typeof doc.user === "object" ? doc.user.id : doc.user } }, limit: 1, depth: 0, overrideAccess: true, req });
        const p = found.docs[0];
        if (p && (p.instantBooking !== doc.instantBooking || p.noticeHours !== doc.noticeHours || p.timezone !== doc.timezone)) {
          await req.payload.update({ collection: "tutor-profiles", id: p.id, data: { instantBooking: doc.instantBooking, noticeHours: doc.noticeHours, timezone: doc.timezone } as never, overrideAccess: true, req, context: { skipTutorChecks: true } });
        }
      },
    ],
  },
  fields: [
    { name: "label", type: "text", admin: { hidden: true }, hooks: { beforeChange: [({ siblingData, req }) => siblingData.label ?? (req.user?.name ? `${req.user.name}` : undefined)] } },
    { name: "user", type: "relationship", relationTo: "users", required: true, unique: true, index: true, access: { update: ({ req }) => isStaffUser(req.user) }, admin: { position: "sidebar" } },
    { name: "timezone", type: "text", required: true, defaultValue: "UTC", admin: { description: "IANA zone the weekly hours are in, e.g. Africa/Nairobi." } },
    {
      name: "weekly",
      type: "array",
      label: "Weekly hours",
      labels: { singular: "Time range", plural: "Time ranges" },
      fields: [
        {
          type: "row",
          fields: [
            { name: "day", type: "select", required: true, options: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((l, i) => ({ label: l, value: String(i) })), admin: { width: "40%" } },
            { name: "start", type: "text", required: true, admin: { width: "30%", placeholder: "09:00" } },
            { name: "end", type: "text", required: true, admin: { width: "30%", placeholder: "17:00" } },
          ],
        },
      ],
    },
    {
      name: "timeOff",
      type: "array",
      label: "Time off",
      fields: [
        {
          type: "row",
          fields: [
            { name: "from", type: "text", required: true, admin: { width: "30%", placeholder: "YYYY-MM-DD" } },
            { name: "to", type: "text", required: true, admin: { width: "30%", placeholder: "YYYY-MM-DD" } },
            { name: "note", type: "text", admin: { width: "40%" } },
          ],
        },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "noticeHours", type: "number", min: 0, max: 168, defaultValue: 12, label: "Minimum notice (hours)", admin: { width: "33%" } },
        { name: "bufferMinutes", type: "number", min: 0, max: 60, defaultValue: 0, label: "Break between lessons (min)", admin: { width: "33%" } },
        { name: "instantBooking", type: "checkbox", defaultValue: true, label: "Instant booking", admin: { width: "33%", description: "Off: students send a request you accept or decline." } },
      ],
    },
  ],
};
