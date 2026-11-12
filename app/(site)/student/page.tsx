import { requireUser } from "@/cms/auth/session";
import { homeData } from "@/cms/scheduling/home";
import { StudentHome } from "@/components/portal/PortalHome";

export const metadata = { title: "Home" };
export const dynamic = "force-dynamic";

export default async function StudentHomePage() {
  const user = await requireUser(["student"], "/student");
  return <StudentHome data={await homeData(user)} />;
}
