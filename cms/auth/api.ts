import "server-only";
import type { NextRequest } from "next/server";
import type { Payload } from "payload";
import type { User } from "@/payload-types";
import { fail } from "./http";
import { getPayloadClient } from "./session";
import { BookingError } from "../scheduling/server";

/** Run an API handler for a signed-in user; BookingError becomes a clean 4xx, anything else a 500. */
export async function withUser(req: NextRequest, label: string, fn: (payload: Payload, user: User) => Promise<Response>) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  if (!user) return fail("Please sign in.", 401);
  try {
    return await fn(payload, user);
  } catch (err) {
    if (err instanceof BookingError) return fail(err.message, err.status);
    payload.logger.error({ err }, `[${label}] failed`);
    return fail("Something went wrong. Please try again.", 500);
  }
}
