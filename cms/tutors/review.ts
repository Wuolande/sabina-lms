import { APIError, type Endpoint, type PayloadRequest } from "payload";
import { hasRole } from "../access";
import { applicationApproved, applicationRejected, changesRequested } from "../email/tutor";
import type { TutorStatus } from "../collections/TutorProfiles";

const ACTIONS: Record<string, { to: TutorStatus; from: TutorStatus[]; needsNotes?: boolean }> = {
  approve: { to: "approved", from: ["submitted", "changes_requested", "rejected", "suspended"] },
  request_changes: { to: "changes_requested", from: ["submitted", "approved"], needsNotes: true },
  reject: { to: "rejected", from: ["submitted", "changes_requested"] },
  suspend: { to: "suspended", from: ["approved"], needsNotes: true },
};

/**
 * POST /api/tutor-profiles/:id/review { action, notes }
 * Staff decision on a tutor application. Records history and emails the tutor.
 */
export const reviewEndpoint: Endpoint = {
  path: "/:id/review",
  method: "post",
  handler: async (req: PayloadRequest) => {
    if (!hasRole(req, "admin", "manager", "support")) throw new APIError("Only the review team can do this.", 403, undefined, true);
    const id = req.routeParams?.id as string;
    const body = (req.json ? await req.json().catch(() => ({})) : {}) as { action?: string; notes?: string };
    const rule = ACTIONS[String(body.action)];
    if (!rule) throw new APIError("Unknown action.", 400, undefined, true);
    const notes = String(body.notes ?? "").trim().slice(0, 2000);
    if (rule.needsNotes && !notes) throw new APIError("Add a message for the tutor explaining what to change.", 400, undefined, true);

    const doc = await req.payload.findByID({ collection: "tutor-profiles", id, depth: 1, overrideAccess: true });
    if (!rule.from.includes(doc.status as TutorStatus)) throw new APIError(`This can't be done while the tutor is "${doc.status}".`, 409, undefined, true);

    const now = new Date().toISOString();
    const updated = await req.payload.update({
      collection: "tutor-profiles",
      id,
      overrideAccess: true,
      req,
      data: {
        status: rule.to,
        reviewNotes: rule.to === "approved" ? "" : notes,
        ...(rule.to === "approved" ? { approvedAt: now } : {}),
        reviewHistory: [...(doc.reviewHistory ?? []), { action: rule.to, notes, at: now, by: req.user!.id }],
      },
    });

    // Email the tutor (failures are logged, never block the decision).
    const user = typeof doc.user === "object" ? doc.user : await req.payload.findByID({ collection: "users", id: doc.user as number, overrideAccess: true });
    const mail =
      rule.to === "approved" ? applicationApproved(user, String(updated.slug)) : rule.to === "changes_requested" ? changesRequested(user, notes) : rule.to === "rejected" ? applicationRejected(user, notes) : null;
    if (mail && user?.email) {
      const { deliver } = await import("../notify/server");
      await deliver(req.payload, user as never, mail);
    }
    return Response.json({ success: true, status: updated.status });
  },
};
