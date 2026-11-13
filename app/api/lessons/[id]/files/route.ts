import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/cms/auth/session";
import { fail } from "@/cms/auth/http";
import { BookingError } from "@/cms/scheduling/server";
import { addMaterial, listMaterials, removeMaterial } from "@/cms/lessons/classroom";
import type { User } from "@/payload-types";

type Ctx = { params: Promise<{ id: string }> };
async function me(req: NextRequest) {
  const payload = await getPayloadClient();
  const { user } = (await payload.auth({ headers: req.headers })) as { user: User | null };
  return { payload, user };
}
const handle = (payload: Awaited<ReturnType<typeof getPayloadClient>>, err: unknown) => {
  if (err instanceof BookingError) return fail(err.message, err.status);
  payload.logger.error({ err }, "[lesson files]");
  return fail("Something went wrong. Please try again.", 500);
};

/** GET : files shared in the lesson. */
export async function GET(req: NextRequest, { params }: Ctx) {
  const { payload, user } = await me(req);
  if (!user) return fail("Please sign in.", 401);
  try {
    return NextResponse.json({ files: await listMaterials(payload, user, Number((await params).id)) }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return handle(payload, err);
  }
}

/** POST (multipart: file) : share a file in the lesson. */
export async function POST(req: NextRequest, { params }: Ctx) {
  const { payload, user } = await me(req);
  if (!user) return fail("Please sign in.", 401);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return fail("Choose a file to share.");
  try {
    return NextResponse.json(await addMaterial(payload, user, Number((await params).id), file), { status: 201 });
  } catch (err) {
    return handle(payload, err);
  }
}

/** DELETE ?file= : remove a file you shared. */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { payload, user } = await me(req);
  if (!user) return fail("Please sign in.", 401);
  try {
    await removeMaterial(payload, user, Number((await params).id), Number(req.nextUrl.searchParams.get("file")));
    return NextResponse.json({ success: true });
  } catch (err) {
    return handle(payload, err);
  }
}
