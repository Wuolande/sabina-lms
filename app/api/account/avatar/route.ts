import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";

const MAX = 5 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"]);

/** POST /api/account/avatar (multipart "file"): upload a profile photo. DELETE removes it. */
export async function POST(req: NextRequest) {
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) return fail("Please sign in.", 401);

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return fail("Choose a photo to upload.");
  if (!TYPES.has(file.type)) return fail("Use a JPG, PNG, WebP or HEIC photo.");
  if (file.size > MAX) return fail("That photo is bigger than 5 MB.");

  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  let media;
  try {
    media = await payload.create({
    collection: "media",
    user,
    overrideAccess: false,
    data: { alt: `${user.name ?? "Sabina member"} profile photo` },
    file: { data: Buffer.from(await file.arrayBuffer()), mimetype: file.type, name: `avatar-${user.id}-${Date.now()}.${ext}`, size: file.size },
    });
  } catch (err) {
    payload.logger.warn({ err }, "[account/avatar] upload rejected");
    return fail("We couldn't read that image. Try a different photo.", 400);
  }
  await payload.update({ collection: "users", id: user.id, data: { avatar: media.id }, user, overrideAccess: false });
  return NextResponse.json({ success: true, avatarId: media.id, avatarUrl: media.sizes?.thumb?.url ?? media.url });
}

export async function DELETE(req: NextRequest) {
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) return fail("Please sign in.", 401);
  await payload.update({ collection: "users", id: user.id, data: { avatar: null }, user, overrideAccess: false });
  return NextResponse.json({ success: true });
}
