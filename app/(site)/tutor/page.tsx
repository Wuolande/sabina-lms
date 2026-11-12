import { requireUser } from "@/cms/auth/session";
import { homeData } from "@/cms/scheduling/home";
import { TutorHome } from "@/components/portal/PortalHome";

export const metadata = { title: "Home" };
export const dynamic = "force-dynamic";

export default async function TutorHomePage() {
  const user = await requireUser(["tutor"], "/tutor");
  return <TutorHome data={await homeData(user)} />;
}
