import { NextResponse, type NextRequest } from "next/server";
import { withUser } from "@/cms/auth/api";
import { listConversations, sendMessage } from "@/cms/messages/server";

const noStore = { headers: { "Cache-Control": "no-store" } };

/** GET: the caller's conversations, newest first. */
export const GET = (req: NextRequest) => withUser(req, "messages", async (payload, user) => NextResponse.json({ conversations: await listConversations(payload, user) }, noStore));

/** POST { body, conversationId } to reply, or { body, tutorId } / { body, studentId } to start a conversation. */
export const POST = (req: NextRequest) =>
  withUser(req, "messages", async (payload, user) => {
    const b = (await req.json().catch(() => ({}))) as { body?: string; conversationId?: number; tutorId?: number; studentId?: number };
    const out = await sendMessage(payload, user, { body: String(b.body ?? ""), conversationId: Number(b.conversationId) || undefined, tutorId: Number(b.tutorId) || undefined, studentId: Number(b.studentId) || undefined });
    return NextResponse.json(out, { status: 201 });
  });
