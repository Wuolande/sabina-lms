import { NextResponse, type NextRequest } from "next/server";
import { withUser } from "@/cms/auth/api";
import { fail } from "@/cms/auth/http";
import { jobStatus, newCronSecret, runHousekeeping } from "@/cms/scheduling/housekeeping";

/** Admin only. GET: status. POST { action: "run" | "new-key" }. */
export const GET = (req: NextRequest) =>
  withUser(req, "jobs", async (payload, user) => (user.role === "admin" ? NextResponse.json(await jobStatus(payload), { headers: { "Cache-Control": "no-store" } }) : fail("Only admins can manage scheduled jobs.", 403)));

export const POST = (req: NextRequest) =>
  withUser(req, "jobs", async (payload, user) => {
    if (user.role !== "admin") return fail("Only admins can manage scheduled jobs.", 403);
    const b = (await req.json().catch(() => ({}))) as { action?: string };
    if (b.action === "run") return NextResponse.json({ run: await runHousekeeping(payload, "manual"), ...(await jobStatus(payload)) });
    if (b.action === "new-key") {
      if (process.env.CRON_SECRET) return fail("The key is set by CRON_SECRET in your hosting settings. Change it there.", 409);
      await newCronSecret(payload);
      return NextResponse.json(await jobStatus(payload));
    }
    return fail("Unknown action.");
  });
