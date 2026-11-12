import { NextResponse, type NextRequest } from "next/server";
import { withUser } from "@/cms/auth/api";

/** PUT { messages?: boolean, reminders?: boolean }: which optional emails the caller gets. */
export const PUT = (req: NextRequest) =>
  withUser(req, "email prefs", async (payload, user) => {
    const b = (await req.json().catch(() => ({}))) as { messages?: unknown; reminders?: unknown };
    const prefs = { messages: user.emailPrefs?.messages !== false, reminders: user.emailPrefs?.reminders !== false };
    if (typeof b.messages === "boolean") prefs.messages = b.messages;
    if (typeof b.reminders === "boolean") prefs.reminders = b.reminders;
    await payload.update({ collection: "users", id: user.id, data: { emailPrefs: prefs }, overrideAccess: true, depth: 0 });
    return NextResponse.json(prefs);
  });
