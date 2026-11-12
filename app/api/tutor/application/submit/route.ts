import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";
import { checkApplication, ownTutorProfile, serializeApplication } from "@/cms/tutors/server";
import { applicationReceived } from "@/cms/email/tutor";
import type { User } from "@/payload-types";

/** POST /api/tutor/application/submit: send the application for review (only when complete). */
export async function POST(req: NextRequest) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  if (!user || user.role !== "tutor") return fail("Only tutors can do this.", 403);
  const profile = await ownTutorProfile(payload, user);
  if (!["draft", "changes_requested"].includes(profile.status)) return fail("This application has already been submitted.", 409);

  const check = checkApplication(profile, user);
  if (check.missing.length) return fail(`Please complete: ${check.missing.map((m) => m.label.replace(/ \(.*\)$/, "")).join(", ")}.`, 400, { missing: check.missing.map((m) => m.key) });

  const now = new Date().toISOString();
  const updated = await payload.update({
    collection: "tutor-profiles",
    id: profile.id,
    overrideAccess: true,
    depth: 1,
    data: {
      status: "submitted",
      submittedAt: now,
      reviewHistory: [...(profile.reviewHistory ?? []).map((h) => ({ ...h, by: typeof h.by === "object" && h.by ? h.by.id : h.by })), { action: "submitted", notes: "", at: now, by: user.id }],
    },
  });
  const mail = applicationReceived(user);
  const { deliver } = await import("@/cms/notify/server");
  await deliver(payload, user, mail);
  return NextResponse.json({ application: serializeApplication(updated), ...checkApplication(updated, user) });
}
