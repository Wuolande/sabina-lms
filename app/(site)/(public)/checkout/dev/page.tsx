import { notFound } from "next/navigation";
import { getPayloadClient, requireUser } from "@/cms/auth/session";
import { devPaymentsOn } from "@/cms/payments/providers";
import { DevCheckout } from "@/components/payments/DevCheckout";

export const dynamic = "force-dynamic";
export const metadata = { title: "Test checkout", robots: { index: false } };

export default async function DevCheckoutPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  if (!devPaymentsOn()) notFound();
  const { ref } = await searchParams;
  const user = await requireUser(["student"], `/checkout/dev?ref=${encodeURIComponent(ref ?? "")}`);
  const payload = await getPayloadClient();
  const p = (await payload.find({ collection: "payments", where: { and: [{ reference: { equals: String(ref) } }, { student: { equals: user.id } }] }, limit: 1, depth: 0, overrideAccess: true })).docs[0];
  if (!p) notFound();
  return (
    <div className="bg-slate-50 px-4 py-16 sm:py-24">
      <DevCheckout reference={p.reference} amount={p.amount} currency={p.currency} />
    </div>
  );
}
