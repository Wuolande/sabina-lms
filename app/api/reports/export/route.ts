import type { NextRequest } from "next/server";
import { withUser } from "@/cms/auth/api";
import { fail } from "@/cms/auth/http";
import { parseReportRange } from "@/cms/admin/reports/data";

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  // Quote everything; neutralise spreadsheet formulas.
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};
const name = (u: unknown) => (u && typeof u === "object" ? ((u as { name?: string; email?: string }).name || (u as { email?: string }).email || "") : "");

/** GET ?type=payments|bookings|payouts&range=30|90|365 → CSV. Admin, manager and finance only. */
export const GET = (req: NextRequest) =>
  withUser(req, "reports export", async (payload, user) => {
    if (!["admin", "manager", "finance"].includes(user.role ?? "")) return fail("Only admins, managers and finance can export reports.", 403);
    const type = req.nextUrl.searchParams.get("type");
    const range = parseReportRange(req.nextUrl.searchParams.get("range") ?? undefined);
    const since = new Date(Date.now() - range * 86400_000).toISOString();
    let rows: unknown[][] = [];
    if (type === "payments") {
      const r = await payload.find({ collection: "payments", where: { createdAt: { greater_than_equal: since } }, sort: "-createdAt", limit: 50000, pagination: false, depth: 1, overrideAccess: true });
      rows = [["Reference", "Status", "Provider", "Amount", "Refunded", "Currency", "Paid at", "Student", "Booking"], ...r.docs.map((p) => [p.reference, p.status, p.provider, p.amount, p.refundedAmount ?? 0, p.currency, p.paidAt ?? "", name(p.student), typeof p.booking === "object" && p.booking ? p.booking.reference : p.booking])];
    } else if (type === "bookings") {
      const r = await payload.find({ collection: "bookings", where: { startsAt: { greater_than_equal: since } }, sort: "-startsAt", limit: 50000, pagination: false, depth: 1, overrideAccess: true });
      rows = [
        ["Reference", "Status", "Payment", "Starts", "Minutes", "Kind", "Subject", "Tutor", "Student", "Price", "Fee %", "Refunded", "Currency"],
        ...r.docs.map((b) => [b.reference, b.status, b.paymentStatus, b.startsAt, b.minutes, b.kind, typeof b.subject === "object" && b.subject ? b.subject.name : "", typeof b.tutor === "object" ? b.tutor.displayName : b.tutor, name(b.student), b.price, b.platformFeePercent, b.refundedAmount ?? 0, b.currency]),
      ];
    } else if (type === "payouts") {
      const r = await payload.find({ collection: "payouts", where: { createdAt: { greater_than_equal: since } }, sort: "-createdAt", limit: 10000, pagination: false, depth: 1, overrideAccess: true });
      rows = [["Reference", "Status", "Amount", "Currency", "Method", "Tutor", "Requested", "Paid at", "Transfer reference"], ...r.docs.map((p) => [p.reference, p.status, p.amount, p.currency, p.destination?.method, name(p.tutorUser), p.createdAt, p.paidAt ?? "", p.transferRef ?? ""])];
    } else return fail("Choose payments, bookings or payouts.");
    const csv = rows.map((r) => r.map(cell).join(",")).join("\r\n");
    const file = `sabina-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
    return new Response(`﻿${csv}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${file}"`, "Cache-Control": "no-store" } });
  });
