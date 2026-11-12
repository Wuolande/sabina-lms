import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";
import { methodView, summarize, type MethodView } from "@/cms/payments/server";
import type { User } from "@/payload-types";

/** PUT the tutor's payout details (M-Pesa, bank or PayPal). */
export async function PUT(req: NextRequest) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  if (user?.role !== "tutor") return fail("Tutors only.", 403);
  const b = (await req.json().catch(() => ({}))) as Partial<MethodView>;
  const t = (v: unknown, n = 120) => String(v ?? "").trim().slice(0, n);
  const m: MethodView = { method: b.method === "bank" || b.method === "paypal" ? b.method : "mpesa", mpesaPhone: t(b.mpesaPhone, 20), accountName: t(b.accountName), bankName: t(b.bankName), accountNumber: t(b.accountNumber, 40), swift: t(b.swift, 20), paypalEmail: t(b.paypalEmail) };
  if (m.method === "mpesa" && !/^\+?\d[\d\s]{8,16}$/.test(m.mpesaPhone)) return fail("Enter your M-Pesa number, e.g. +254 712 345 678.");
  if (m.method === "bank" && (!m.accountName || !m.bankName || m.accountNumber.length < 5)) return fail("Enter the account name, bank and account number.");
  if (m.method === "paypal" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.paypalEmail)) return fail("Enter your PayPal email.");
  const data = { ...m, user: user.id, summary: summarize(m) };
  const found = await payload.find({ collection: "payout-methods", where: { user: { equals: user.id } }, limit: 1, depth: 0, overrideAccess: true });
  const saved = found.docs[0]
    ? await payload.update({ collection: "payout-methods", id: found.docs[0].id, data, overrideAccess: true })
    : await payload.create({ collection: "payout-methods", data, overrideAccess: true });
  return NextResponse.json({ success: true, method: methodView(saved) });
}
