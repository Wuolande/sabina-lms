import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";
import { devPaymentsOn } from "@/cms/payments/providers";
import { settlePayment } from "@/cms/payments/server";
import type { User } from "@/payload-types";

/** POST { ref, outcome: "succeeded" | "failed" } : the simulated checkout (development only). */
export async function POST(req: NextRequest) {
  if (!devPaymentsOn()) return fail("Not found.", 404);
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  if (!user) return fail("Please sign in.", 401);
  const b = (await req.json().catch(() => ({}))) as { ref?: string; outcome?: string };
  const found = await payload.find({ collection: "payments", where: { and: [{ reference: { equals: String(b.ref) } }, { student: { equals: user.id } }, { provider: { equals: "dev" } }] }, limit: 1, depth: 0, overrideAccess: true });
  if (!found.docs[0]) return fail("Payment not found.", 404);
  const outcome = b.outcome === "failed" ? "failed" : "succeeded";
  await settlePayment(payload, found.docs[0].reference, { status: outcome, chargeRef: `dev-${found.docs[0].reference}`, method: "test", event: { type: `dev.${outcome}` } });
  return NextResponse.json({ success: true });
}
