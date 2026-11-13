import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";

const MAX = 10 * 1024 * 1024;
const TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"]);

/** POST (multipart: file) : a student uploads a homework file (photo or PDF), kept private. */
export async function POST(req: NextRequest) {
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: req.headers });
  if (!user || (user as { role?: string }).role !== "student") return fail("Only students can hand in homework.", 403);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return fail("Choose a file to upload.");
  if (!TYPES.has(file.type)) return fail("Upload a PDF or a photo (JPG, PNG, WebP).");
  if (file.size > MAX) return fail("That file is bigger than 10 MB.");
  try {
    const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80) || "homework";
    const doc = await payload.create({
      collection: "private-files",
      user,
      overrideAccess: false,
      data: { kind: "homework", owner: user.id } as never,
      file: { data: Buffer.from(await file.arrayBuffer()), mimetype: file.type, name: `homework-${user.id}-${Date.now()}-${safe}`, size: file.size },
    });
    return NextResponse.json({ id: doc.id, name: file.name, url: doc.url ?? null });
  } catch (err) {
    payload.logger.warn({ err }, "[homework/upload] rejected");
    return fail("We couldn't save that file. Try a different one.", 400);
  }
}
