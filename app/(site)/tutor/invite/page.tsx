import { getPayloadClient, requireUser } from "@/cms/auth/session";
import { referralSummary } from "@/cms/referrals/server";
import { PageHeader } from "@/components/portal/PageHeader";
import { InvitePanel } from "@/components/referrals/InvitePanel";

export const metadata = { title: "Invite friends" };
export const dynamic = "force-dynamic";

export default async function InvitePage() {
  const user = await requireUser(["tutor"], "/tutor/invite");
  const data = await referralSummary(await getPayloadClient(), user);
  return (
    <div className="space-y-6">
      <PageHeader title="Invite friends" sub="Bring tutors and students to Sabina and earn a bonus." />
      <InvitePanel data={data} />
    </div>
  );
}
