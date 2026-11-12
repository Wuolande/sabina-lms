import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail, guard } from "@/cms/auth/http";
import { createDirectUpload, streamConfigured } from "@/cms/media/stream";
import type { User } from "@/payload-types";

/** POST → a one-time Cloudflare Stream upload URL for the tutor's intro video (max 3 minutes). */
export async function POST(req: NextRequest) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  if (user?.role !== "tutor") return fail("Tutors only.", 403);
  if (!streamConfigured()) return fail("Video uploads aren't available yet. Paste a YouTube or Vimeo link instead.", 503);
  const blocked = guard(req, {}, `stream:${user.id}`, { maxAttempts: 10, windowMs: 60 * 60_000, lockoutDurationMs: 30 * 60_000 });
  if (blocked) return blocked;
  try {
    return NextResponse.json(await createDirectUpload({ name: `Intro: ${user.name ?? user.email}`, maxDurationSeconds: 180, creator: String(user.id) }));
  } catch (err) {
    payload.logger.error({ err }, "[stream] direct upload failed");
    return fail("We couldn't start the upload. Please try again.", 502);
  }
}
