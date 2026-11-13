import "server-only";
import type { Payload } from "payload";
import type { Booking, PrivateFile, User } from "@/payload-types";
import { EgressClient, EncodedFileOutput, EncodedFileType, S3Upload } from "livekit-server-sdk";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { BookingError } from "../scheduling/server";
import { getPolicies } from "../tutors/server";
import { r2Config, r2Endpoint, r2Ready } from "../storage/r2";
import { lessonFor, videoConfigured } from "./server";

const idOf = (v: unknown): number | null => (v == null ? null : typeof v === "object" ? ((v as { id: number }).id ?? null) : Number(v));

/* ------------------------------------------------------------------ lesson materials */

export const MATERIAL_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
export const MATERIAL_MAX = 20 * 1024 * 1024;
const MAX_FILES = 30;

const fileView = (f: PrivateFile, me: number) => ({
  id: f.id,
  name: String(f.filename ?? "file").replace(/^lesson-\d+-\d+-\d+-/, ""),
  url: f.url ?? null,
  size: f.filesize ?? 0,
  type: f.mimeType ?? "",
  mine: idOf(f.owner) === me,
  at: f.createdAt,
});
export type MaterialView = ReturnType<typeof fileView>;

export async function listMaterials(payload: Payload, user: User, id: number) {
  const found = await lessonFor(payload, user, id);
  if (!found) throw new BookingError("Lesson not found.", 404);
  const ids = (found.b.materials ?? []).map(idOf).filter(Boolean) as number[];
  if (!ids.length) return [];
  const r = await payload.find({ collection: "private-files", where: { id: { in: ids } }, sort: "createdAt", limit: MAX_FILES, depth: 0, overrideAccess: true });
  return r.docs.map((f) => fileView(f, user.id));
}

/** Either person shares a file in a lesson (before, during or after it). */
export async function addMaterial(payload: Payload, user: User, id: number, file: File) {
  const found = await lessonFor(payload, user, id);
  if (!found) throw new BookingError("Lesson not found.", 404);
  const { b } = found;
  if (!["confirmed", "completed", "requested"].includes(b.status)) throw new BookingError("Files can only be shared for booked lessons.", 409);
  if (!MATERIAL_TYPES.has(file.type)) throw new BookingError("Share a PDF, photo, Word, PowerPoint, Excel or text file.");
  if (file.size > MATERIAL_MAX) throw new BookingError("That file is bigger than 20 MB.");
  const current = (b.materials ?? []).map(idOf).filter(Boolean) as number[];
  if (current.length >= MAX_FILES) throw new BookingError(`A lesson can have up to ${MAX_FILES} files.`);
  const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80) || "file";
  const doc = await payload
    .create({
      collection: "private-files",
      data: { kind: "lesson", owner: user.id } as never,
      file: { data: Buffer.from(await file.arrayBuffer()), mimetype: file.type, name: `lesson-${b.id}-${user.id}-${Date.now()}-${safe}`, size: file.size },
      overrideAccess: true,
    })
    .catch((err) => {
      // Payload checks the file's real contents (not just its name); damaged files end up here.
      payload.logger.warn({ err }, "[lesson files] upload rejected");
      throw new BookingError(`We couldn't read ${file.name}. Check it opens on your device, then try again.`);
    });
  await payload.update({ collection: "bookings", id: b.id, data: { materials: [...current, doc.id] } as never, overrideAccess: true });
  return fileView(doc, user.id);
}

/** Remove a file you shared. */
export async function removeMaterial(payload: Payload, user: User, id: number, fileId: number) {
  const found = await lessonFor(payload, user, id);
  if (!found) throw new BookingError("Lesson not found.", 404);
  const f = await payload.findByID({ collection: "private-files", id: fileId, depth: 0, overrideAccess: true }).catch(() => null);
  const current = (found.b.materials ?? []).map(idOf).filter(Boolean) as number[];
  if (!f || !current.includes(f.id)) throw new BookingError("File not found.", 404);
  if (idOf(f.owner) !== user.id) throw new BookingError("You can only remove files you shared.", 403);
  await payload.update({ collection: "bookings", id: found.b.id, data: { materials: current.filter((x) => x !== f.id) } as never, overrideAccess: true });
  await payload.delete({ collection: "private-files", id: f.id, overrideAccess: true });
}

/* ------------------------------------------------------------------ recording */

/** Recording needs the admin switch, our own LiveKit project (not the demo) and private R2 storage. */
export async function recordingAvailable(payload: Payload) {
  const policies = await getPolicies(payload);
  const url = process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "";
  return Boolean(policies.recordingEnabled && videoConfigured() && !/demo\.livekit/.test(url) && process.env.LIVEKIT_API_KEY !== "devkey" && r2Ready() && process.env.R2_PRIVATE_BUCKET);
}

export type RecordingState = { available: boolean; status: string; consent: { student: boolean; tutor: boolean }; startedAt: string | null; ready: boolean };

export function recordingState(b: Booking, available: boolean): RecordingState {
  const r = b.recording ?? {};
  return { available, status: r.status ?? "none", consent: { student: Boolean(r.consentStudentAt), tutor: Boolean(r.consentTutorAt) }, startedAt: r.startedAt ?? null, ready: r.status === "ready" };
}

const egress = () => new EgressClient(String(process.env.NEXT_PUBLIC_LIVEKIT_URL).replace(/^wss:/, "https:").replace(/^ws:/, "http:"), process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!);

/**
 * Consent-first recording. Each person agrees ("consent"); recording only starts once both have.
 * Either person can stop it. Recordings go to the private bucket and only the two of them (and
 * staff) can watch them.
 */
export async function recordingAction(payload: Payload, user: User, id: number, action: "consent" | "decline" | "stop") {
  const found = await lessonFor(payload, user, id);
  if (!found) throw new BookingError("Lesson not found.", 404);
  const { b, role } = found;
  const available = await recordingAvailable(payload);
  if (!available) throw new BookingError("Recording isn't available on this site.", 409);
  if (b.status !== "confirmed") throw new BookingError("Only lessons taking place can be recorded.", 409);
  const r = { ...(b.recording ?? {}) } as NonNullable<Booking["recording"]>;
  const now = new Date().toISOString();

  if (action === "decline") {
    r.consentStudentAt = null;
    r.consentTutorAt = null;
    if (r.status === "requested") r.status = "none";
  } else if (action === "consent") {
    if (r.status === "recording") return recordingState(b, available);
    if (role === "student") r.consentStudentAt = now;
    else r.consentTutorAt = now;
    r.status = "requested";
    if (r.consentStudentAt && r.consentTutorAt) {
      const key = `recordings/${b.reference ?? b.id}-${Date.now()}.mp4`;
      const out = new EncodedFileOutput({
        fileType: EncodedFileType.MP4,
        filepath: key,
        output: {
          case: "s3",
          value: new S3Upload({ accessKey: process.env.R2_ACCESS_KEY_ID!, secret: process.env.R2_SECRET_ACCESS_KEY!, region: "auto", endpoint: r2Endpoint()!, bucket: process.env.R2_PRIVATE_BUCKET!, forcePathStyle: true }),
        },
      });
      try {
        const info = await egress().startRoomCompositeEgress(`lesson-${b.id}`, { file: out }, { layout: "speaker" });
        Object.assign(r, { status: "recording", egressId: info.egressId, fileKey: key, startedAt: now, endedAt: null });
      } catch (err) {
        payload.logger.error({ err }, "[recording] start failed");
        Object.assign(r, { status: "failed" });
        await payload.update({ collection: "bookings", id: b.id, data: { recording: r } as never, overrideAccess: true });
        throw new BookingError("We couldn't start recording. The lesson carries on as normal.", 502);
      }
    }
  } else if (action === "stop") {
    if (r.status !== "recording" || !r.egressId) throw new BookingError("Nothing is being recorded.", 409);
    await egress()
      .stopEgress(r.egressId)
      .catch((err) => payload.logger.error({ err }, "[recording] stop failed"));
    Object.assign(r, { status: "ready", endedAt: now, consentStudentAt: null, consentTutorAt: null });
  }
  const updated = await payload.update({ collection: "bookings", id: b.id, data: { recording: r } as never, overrideAccess: true });
  return recordingState(updated, available);
}

/** A short-lived link to watch the recording (the two people in the lesson, or staff). */
export async function recordingUrl(payload: Payload, user: User, id: number) {
  const found = await lessonFor(payload, user, id);
  if (!found) throw new BookingError("Lesson not found.", 404);
  const key = found.b.recording?.fileKey;
  if (!key || found.b.recording?.status !== "ready") throw new BookingError("There's no recording for this lesson.", 404);
  const s3 = new S3Client(r2Config());
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: process.env.R2_PRIVATE_BUCKET!, Key: key }), { expiresIn: 900 });
}
