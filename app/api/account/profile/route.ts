import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : undefined);

function validZone(tz: string) {
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** PATCH /api/account/profile: the signed-in person updates their own name, contact details and time zone. */
export async function PATCH(req: NextRequest) {
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) return fail("Please sign in.", 401);

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  const firstName = clean(body.firstName, 60);
  const lastName = clean(body.lastName, 60);
  if (firstName !== undefined) {
    if (!firstName) return fail("Enter your first name.");
    data.firstName = firstName;
  }
  if (lastName !== undefined) {
    if (!lastName) return fail("Enter your last name.");
    data.lastName = lastName;
  }
  const phone = clean(body.phone, 32);
  if (phone !== undefined) {
    if (phone && !/^\+?[0-9 ()-]{6,32}$/.test(phone)) return fail("Enter a valid phone number, e.g. +254 712 345 678.");
    data.phone = phone;
  }
  const country = clean(body.country, 60);
  if (country !== undefined) data.country = country;
  const timezone = clean(body.timezone, 64);
  if (timezone !== undefined) {
    if (!validZone(timezone)) return fail("Choose a valid time zone.");
    data.timezone = timezone;
  }

  // Runs with the person's own permissions: they can only change their own account, never role or status.
  const updated = await payload.update({ collection: "users", id: user.id, data, user, overrideAccess: false });
  return NextResponse.json({ success: true, user: { firstName: updated.firstName, lastName: updated.lastName, name: updated.name, phone: updated.phone, country: updated.country, timezone: updated.timezone } });
}
