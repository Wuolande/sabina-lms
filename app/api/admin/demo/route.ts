import { NextResponse, type NextRequest } from "next/server";
import { withUser } from "@/cms/auth/api";
import { fail } from "@/cms/auth/http";
import { demoPlan, demoStatus, removeDemo, runDemoStep } from "@/cms/seed/demo";
import type { User } from "@/payload-types";

// Each loading step adds a few tutors with their full history, so give it time.
export const maxDuration = 60;

/** Admin only. GET: what's loaded. POST { action: "step", step } | { action: "remove" }. */
export const GET = (req: NextRequest) =>
  withUser(req, "demo", async (payload, user) => (user.role === "admin" ? NextResponse.json({ ...(await demoStatus(payload)), plan: demoPlan() }, { headers: { "Cache-Control": "no-store" } }) : fail("Only admins can manage demo data.", 403)));

export const POST = (req: NextRequest) =>
  withUser(req, "demo", async (payload, user) => {
    if (user.role !== "admin") return fail("Only admins can manage demo data.", 403);
    const b = (await req.json().catch(() => ({}))) as { action?: string; step?: string };
    try {
      if (b.action === "step" && b.step) {
        const done = await runDemoStep(payload, user as User, b.step);
        return NextResponse.json({ done, ...(await demoStatus(payload)) });
      }
      if (b.action === "remove") {
        const removed = await removeDemo(payload);
        return NextResponse.json({ removed, ...(await demoStatus(payload)) });
      }
    } catch (err) {
      payload.logger.error({ err }, "[demo] step failed");
      return fail(err instanceof Error ? err.message : "That didn't work.", 500);
    }
    return fail("Unknown action.");
  });
