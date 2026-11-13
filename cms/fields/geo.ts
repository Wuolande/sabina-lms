import type { TextField } from "payload";
import { countryValidator, zoneValidator } from "../geo/server";

/** A country picked from the list managed in Settings → Countries (stored as its name). */
export const countryField = (over: Partial<TextField> = {}): TextField =>
  ({
    name: "country",
    type: "text",
    index: true,
    validate: countryValidator as never,
    ...over,
    admin: { ...over.admin, components: { Field: "/cms/admin/fields/GeoSelect#CountrySelect" } },
  }) as TextField;

/** A time zone picked from the list managed in Settings → Time zones (stored as its IANA name). */
export const timezoneField = (over: Partial<TextField> = {}): TextField =>
  ({
    name: "timezone",
    type: "text",
    validate: zoneValidator as never,
    ...over,
    admin: { ...over.admin, components: { Field: "/cms/admin/fields/GeoSelect#TimezoneSelect" } },
  }) as TextField;
