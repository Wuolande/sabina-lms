import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";

const MAX = 10 * 1024 * 1024;
const TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"]);
const KINDS = new Set(["identity", "degree", "certificate", "other"]);

/** POST /api/tutor/documents (multipart: file, kind): upload a private document (ID, degree, certificate). */
export async function POST(req: NextRequest) {
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: req.headers });
  if (!user || (user as { role?: string }).role !== "tutor") return fail("Only tutors can do this.", 403);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const kind = String(form?.get("kind") ?? "other");
  if (!(file instanceof File)) return fail("Choose a file to upload.");
  if (!TYPES.has(file.type)) return fail("Upload a PDF or a photo (JPG, PNG, WebP).");
  if (file.size > MAX) return fail("That file is bigger than 10 MB.");
  if (!KINDS.has(kind)) return fail("Unknown document type.");
  try {
    const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80) || "document";
    const doc = await payload.create({
      collection: "private-files",
      user,
      overrideAccess: false,
      data: { kind: kind as never, owner: user.id },
      file: { data: Buffer.from(await file.arrayBuffer()), mimetype: file.type, name: `${kind}-${user.id}-${Date.now()}-${safe}`, size: file.size },
    });
    return NextResponse.json({ id: doc.id, filename: file.name, url: doc.url ?? null });
  } catch (err) {
    payload.logger.warn({ err }, "[tutor/documents] upload rejected");
    return fail("We couldn't save that file. Try a different one.", 400);
  }
}
