import { getPayloadClient, requireUser } from "@/cms/auth/session";
import { listConversations, threadWith } from "@/cms/messages/server";
import { Inbox } from "./Inbox";

type Search = Promise<{ c?: string; tutor?: string; student?: string }>;

/** Shared server page for /student/messages and /tutor/messages. */
export async function MessagesPage({ role, searchParams }: { role: "student" | "tutor"; searchParams: Search }) {
  const user = await requireUser([role], `/${role}/messages`);
  const payload = await getPayloadClient();
  const q = await searchParams;
  const conversations = await listConversations(payload, user);
  let openId = Number(q.c) || null;
  if (openId && !conversations.some((c) => c.id === openId)) openId = null;

  let draft: { kind: "tutor" | "student"; id: number; other: NonNullable<Awaited<ReturnType<typeof threadWith>>["other"]> } | null = null;
  const targetId = Number(role === "student" ? q.tutor : q.student) || null;
  if (!openId && targetId) {
    const found = await threadWith(payload, user, role === "student" ? { tutorId: targetId } : { studentId: targetId }).catch(() => null);
    if (found?.existingId) openId = found.existingId;
    else if (found?.other) draft = { kind: role === "student" ? "tutor" : "student", id: targetId, other: found.other };
  }
  return <Inbox role={role} initial={conversations} openId={openId} draft={draft} />;
}
