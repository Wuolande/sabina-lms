import "server-only";
import type { Payload, Where } from "payload";
import type { Conversation, TutorProfile, User } from "@/payload-types";
import { BookingError, mediaUrl, personOf, shortName } from "../scheduling/server";
import { deliver } from "../notify/server";
import { newMessage } from "../email/notices";

const idOf = (v: unknown): number | null => (v == null ? null : typeof v === "object" ? ((v as { id: number }).id ?? null) : Number(v));
const EMAIL_GAP_MS = 30 * 60_000;
const MAX_LEN = 4000;

/** Contact details shared before a lesson is booked are a common way around the platform. */
const CONTACT = [
  { re: /[\w.+-]+@[\w-]+\.[\w.]{2,}/i, why: "email address" },
  { re: /(?:\+?\d[\s().-]?){9,}/, why: "phone number" },
  { re: /\b(whats\s?app|telegram|signal|wechat|skype|zoom\.us|meet\.google)\b/i, why: "outside app" },
];
export const contactFlag = (text: string) => CONTACT.find((c) => c.re.test(text))?.why ?? null;

import type { ConversationView, MessageView, Party } from "./types";
export type { ConversationView, MessageView, Party };

const roleIn = (c: Conversation, user: User): "student" | "tutor" | null => (idOf(c.student) === user.id ? "student" : idOf(c.tutorUser) === user.id ? "tutor" : null);
const unreadFor = (c: Conversation, me: "student" | "tutor", userId: number) => {
  if (!c.lastMessageAt || idOf(c.lastSender) === userId) return false;
  const read = me === "student" ? c.studentReadAt : c.tutorReadAt;
  return !read || Date.parse(read) < Date.parse(c.lastMessageAt);
};

async function partyFor(payload: Payload, c: Conversation, me: "student" | "tutor"): Promise<Party> {
  if (me === "student") {
    const t = (typeof c.tutor === "object" ? c.tutor : await payload.findByID({ collection: "tutor-profiles", id: idOf(c.tutor)!, depth: 1, overrideAccess: true }).catch(() => null)) as TutorProfile | null;
    return { name: t?.displayName ?? "Tutor", avatar: mediaUrl(t?.photo), href: t?.slug ? `/tutors/${t.slug}` : null, subtitle: t?.headline ?? null };
  }
  const s = (typeof c.student === "object" ? c.student : await payload.findByID({ collection: "users", id: idOf(c.student)!, depth: 1, overrideAccess: true }).catch(() => null)) as User | null;
  return { name: s ? shortName(s) : "Student", avatar: mediaUrl(s?.avatar), href: null, subtitle: "Student" };
}

const mine = (user: User): Where => (user.role === "tutor" ? { tutorUser: { equals: user.id } } : { student: { equals: user.id } });

export async function listConversations(payload: Payload, user: User): Promise<ConversationView[]> {
  const r = await payload.find({ collection: "conversations", where: { and: [mine(user), { messageCount: { greater_than: 0 } }] }, sort: "-lastMessageAt", limit: 200, depth: 1, overrideAccess: true });
  const me = user.role === "tutor" ? "tutor" : "student";
  return Promise.all(
    r.docs.map(async (c) => ({
      id: c.id,
      other: await partyFor(payload, c, me),
      preview: c.lastPreview ?? "",
      at: c.lastMessageAt ?? null,
      unread: unreadFor(c, me, user.id),
      mine: idOf(c.lastSender) === user.id,
      closed: Boolean(c.closed),
    })),
  );
}

export async function unreadCount(payload: Payload, user: User) {
  if (user.role !== "student" && user.role !== "tutor") return 0;
  const r = await payload.find({
    collection: "conversations",
    where: { and: [mine(user), { messageCount: { greater_than: 0 } }] },
    limit: 500,
    depth: 0,
    overrideAccess: true,
    select: { lastMessageAt: true, lastSender: true, studentReadAt: true, tutorReadAt: true, student: true, tutorUser: true },
  });
  const me = user.role === "tutor" ? "tutor" : "student";
  return r.docs.filter((c) => unreadFor(c as Conversation, me, user.id)).length;
}

/** A tutor may write to a student only once they share a booking or the student wrote first. */
async function findOrOpen(payload: Payload, user: User, to: { tutorId?: number; studentId?: number }, create: boolean) {
  let tutor: TutorProfile | null = null;
  let studentId: number;
  if (user.role === "student") {
    tutor = to.tutorId ? await payload.findByID({ collection: "tutor-profiles", id: to.tutorId, depth: 0, overrideAccess: true }).catch(() => null) : null;
    if (!tutor || tutor.status !== "approved") throw new BookingError("This tutor isn't available to message.", 404);
    studentId = user.id;
  } else if (user.role === "tutor") {
    const t = await payload.find({ collection: "tutor-profiles", where: { user: { equals: user.id } }, limit: 1, depth: 0, overrideAccess: true });
    tutor = t.docs[0] ?? null;
    if (!tutor || !to.studentId) throw new BookingError("Student not found.", 404);
    studentId = to.studentId;
  } else throw new BookingError("Only students and tutors can send messages.", 403);

  const existing = await payload.find({ collection: "conversations", where: { and: [{ student: { equals: studentId } }, { tutor: { equals: tutor.id } }] }, limit: 1, depth: 0, overrideAccess: true });
  if (existing.docs[0]) return { c: existing.docs[0], tutor };
  if (user.role === "tutor") {
    const shared = await payload.count({ collection: "bookings", where: { and: [{ student: { equals: studentId } }, { tutor: { equals: tutor.id } }, { status: { not_equals: "pending_payment" } }] }, overrideAccess: true });
    if (!shared.totalDocs) throw new BookingError("You can message a student once they've booked with you or written to you.", 403);
  }
  if (!create) return { c: null, tutor };
  const student = await payload.findByID({ collection: "users", id: studentId, depth: 0, overrideAccess: true });
  const c = await payload.create({
    collection: "conversations",
    data: { title: `${shortName(student)} ↔ ${tutor.displayName ?? "Tutor"}`, student: studentId, tutorUser: idOf(tutor.user)!, tutor: tutor.id, messageCount: 0 },
    overrideAccess: true,
  });
  return { c, tutor };
}

async function owned(payload: Payload, user: User, id: number) {
  const c = await payload.findByID({ collection: "conversations", id, depth: 1, overrideAccess: true }).catch(() => null);
  const me = c ? roleIn(c, user) : null;
  if (!c || !me) throw new BookingError("Conversation not found.", 404);
  return { c, me };
}

/** Messages in a thread (oldest first). Opening a thread marks it read. */
export async function thread(payload: Payload, user: User, id: number, opts: { after?: number } = {}) {
  const { c, me } = await owned(payload, user, id);
  const r = await payload.find({
    collection: "messages",
    where: { and: [{ conversation: { equals: id } }, { hidden: { not_equals: true } }, ...(opts.after ? [{ id: { greater_than: opts.after } }] : [])] },
    sort: "-createdAt",
    limit: 200,
    depth: 0,
    overrideAccess: true,
  });
  if (unreadFor(c, me, user.id)) {
    await payload.update({ collection: "conversations", id, data: { [me === "student" ? "studentReadAt" : "tutorReadAt"]: new Date().toISOString() }, overrideAccess: true, depth: 0 });
  }
  const messages: MessageView[] = r.docs.reverse().map((m) => ({ id: m.id, body: m.body, at: m.createdAt, mine: idOf(m.sender) === user.id }));
  return { id: c.id, other: await partyFor(payload, c, me), closed: Boolean(c.closed), messages };
}

/** Find the thread with a tutor (student) or student (tutor), if one exists, without creating it. */
export async function threadWith(payload: Payload, user: User, to: { tutorId?: number; studentId?: number }) {
  const { c, tutor } = await findOrOpen(payload, user, to, false);
  if (c && (c.messageCount ?? 0) > 0) return { existingId: c.id, other: null };
  const other: Party =
    user.role === "student"
      ? { name: tutor!.displayName ?? "Tutor", avatar: mediaUrl(await payload.findByID({ collection: "tutor-profiles", id: tutor!.id, depth: 1, overrideAccess: true }).then((t) => t.photo).catch(() => null)), href: tutor!.slug ? `/tutors/${tutor!.slug}` : null, subtitle: tutor!.headline ?? null }
      : await payload.findByID({ collection: "users", id: to.studentId!, depth: 1, overrideAccess: true }).then((s) => ({ name: shortName(s), avatar: mediaUrl(s.avatar), href: null, subtitle: "Student" }));
  return { existingId: null, other };
}

export async function sendMessage(payload: Payload, user: User, input: { conversationId?: number; tutorId?: number; studentId?: number; body: string }) {
  const body = String(input.body ?? "").replace(/\r\n/g, "\n").trim();
  if (!body) throw new BookingError("Write a message first.");
  if (body.length > MAX_LEN) throw new BookingError(`Messages can be up to ${MAX_LEN.toLocaleString()} characters. Try splitting it in two.`);

  const recent = await payload.count({ collection: "messages", where: { and: [{ sender: { equals: user.id } }, { createdAt: { greater_than: new Date(Date.now() - 60_000).toISOString() } }] }, overrideAccess: true });
  if (recent.totalDocs >= 20) throw new BookingError("You're sending messages very quickly. Wait a minute and try again.", 429);

  const c = input.conversationId ? (await owned(payload, user, input.conversationId)).c : (await findOrOpen(payload, user, { tutorId: input.tutorId, studentId: input.studentId }, true)).c!;
  if (c.closed) throw new BookingError("This conversation has been closed by Sabina support.", 409);
  const me = roleIn(c, user)!;
  const flag = contactFlag(body);
  const now = new Date().toISOString();
  const msg = await payload.create({ collection: "messages", data: { conversation: c.id, sender: user.id, body, flag: flag ? `Possible ${flag}` : null }, overrideAccess: true });
  await payload.update({
    collection: "conversations",
    id: c.id,
    data: {
      lastMessageAt: now,
      lastPreview: body.replace(/\s+/g, " ").slice(0, 140),
      lastSender: user.id,
      messageCount: (c.messageCount ?? 0) + 1,
      [me === "student" ? "studentReadAt" : "tutorReadAt"]: now,
      ...(flag ? { flagged: true } : {}),
    },
    overrideAccess: true,
    depth: 0,
  });

  // Email the other person, at most once per 30 minutes per conversation unless they've caught up since.
  const otherId = idOf(me === "student" ? c.tutorUser : c.student)!;
  const otherRead = me === "student" ? c.tutorReadAt : c.studentReadAt;
  const last = c.lastEmailedAt ? Date.parse(c.lastEmailedAt) : 0;
  if (!last || Date.now() - last > EMAIL_GAP_MS || (otherRead && Date.parse(otherRead) > last)) {
    const other = await payload.findByID({ collection: "users", id: otherId, depth: 0, overrideAccess: true });
    const fromName = me === "student" ? shortName(user) : ((typeof c.tutor === "object" ? c.tutor.displayName : null) ?? shortName(user));
    await payload.update({ collection: "conversations", id: c.id, data: { lastEmailedAt: now }, overrideAccess: true, depth: 0 });
    void deliver(payload, other, newMessage(personOf(other), fromName, body, `/${me === "student" ? "tutor" : "student"}/messages?c=${c.id}`), { inApp: false });
  }
  return { conversationId: c.id, message: { id: msg.id, body, at: msg.createdAt, mine: true } as MessageView, flagged: Boolean(flag) };
}
