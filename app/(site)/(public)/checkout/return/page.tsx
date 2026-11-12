import { requireUser } from "@/cms/auth/session";
import { CheckoutReturn } from "@/components/payments/CheckoutReturn";
import { safeTz } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payment", robots: { index: false } };

export default async function ReturnPage({ searchParams }: { searchParams: Promise<{ ref?: string; cancelled?: string }> }) {
  const { ref, cancelled } = await searchParams;
  const user = await requireUser(["student"], `/checkout/return?ref=${encodeURIComponent(ref ?? "")}`);
  return (
    <div className="bg-slate-50 px-4 py-16 sm:py-24">
      <CheckoutReturn reference={String(ref ?? "")} cancelled={cancelled === "1"} tz={safeTz(user.timezone)} />
    </div>
  );
}
