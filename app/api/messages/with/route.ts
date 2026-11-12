import { NextResponse, type NextRequest } from "next/server";
import { withUser } from "@/cms/auth/api";
import { threadWith } from "@/cms/messages/server";

/** GET ?tutor=<profileId> (students) or ?student=<userId> (tutors): the existing thread, or who a new one would be with. */
export const GET = (req: NextRequest) =>
  withUser(req, "messages", async (payload, user) => {
    const q = req.nextUrl.searchParams;
    return NextResponse.json(await threadWith(payload, user, { tutorId: Number(q.get("tutor")) || undefined, studentId: Number(q.get("student")) || undefined }));
  });
