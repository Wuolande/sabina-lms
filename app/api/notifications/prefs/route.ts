import { NextResponse, type NextRequest } from "next/server";
import { withUser } from "@/cms/auth/api";

/** PUT { messages?, reminders?, text? }: which optional emails the caller gets, and reminders by SMS/WhatsApp. */
export const PUT = (req: NextRequest) =>
  withUser(req, "email prefs", async (payload, user) => {
    const b = (await req.json().catch(() => ({}))) as { messages?: unknown; reminders?: unknown; text?: unknown };
    if (typeof b.text === "boolean") {
      const { toE164 } = await import("@/cms/notify/text");
      if (b.text && !toE164(user.phone, user.country)) return NextResponse.json({ error: "Add your phone number with its country code (like +254 712 345 678) in Account settings first." }, { status: 400 });
      await payload.update({ collection: "users", id: user.id, data: { textReminders: b.text }, overrideAccess: true, depth: 0 });
    }
    const prefs = { messages: user.emailPrefs?.messages !== false, reminders: user.emailPrefs?.reminders !== false };
    if (typeof b.messages === "boolean") prefs.messages = b.messages;
    if (typeof b.reminders === "boolean") prefs.reminders = b.reminders;
    await payload.update({ collection: "users", id: user.id, data: { emailPrefs: prefs }, overrideAccess: true, depth: 0 });
    return NextResponse.json(prefs);
  });
