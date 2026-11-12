import { NextResponse, type NextRequest } from "next/server";
import { withUser } from "@/cms/auth/api";
import { thread } from "@/cms/messages/server";

/** GET ?after=<messageId>: one conversation's messages (marks it read). */
export const GET = (req: NextRequest, { params }: { params: Promise<{ id: string }> }) =>
  withUser(req, "messages", async (payload, user) => {
    const after = Number(req.nextUrl.searchParams.get("after")) || undefined;
    return NextResponse.json(await thread(payload, user, Number((await params).id), { after }), { headers: { "Cache-Control": "no-store" } });
  });
