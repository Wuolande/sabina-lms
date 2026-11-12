import { getPayloadClient, requireUser } from "@/cms/auth/session";
import { tutorEarnings } from "@/cms/payments/server";
import { Earnings } from "@/components/payments/Earnings";
import { PageHeader } from "@/components/portal/PageHeader";
import { safeTz } from "@/lib/time";

export const metadata = { title: "Earnings" };
export const dynamic = "force-dynamic";

export default async function EarningsPage() {
  const user = await requireUser(["tutor"], "/tutor/earnings");
  const data = await tutorEarnings(await getPayloadClient(), user);
  return (
    <div className="space-y-6">
      <PageHeader title="Earnings" sub="What you've earned, what's clearing, and your payouts." />
      <Earnings data={data} tz={safeTz(user.timezone)} />
    </div>
  );
}
