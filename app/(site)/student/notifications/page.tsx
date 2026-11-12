import { getPayloadClient, requireUser } from "@/cms/auth/session";
import { listNotifications } from "@/cms/notify/server";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

export const metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await requireUser(["student"], "/student/notifications");
  const items = await listNotifications(await getPayloadClient(), user);
  return <NotificationCenter initial={items} prefs={{ messages: user.emailPrefs?.messages !== false, reminders: user.emailPrefs?.reminders !== false }} />;
}
