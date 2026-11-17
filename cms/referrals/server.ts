import "server-only";
import type { Payload } from "payload";
import type { Booking, User } from "@/payload-types";
import { getPolicies } from "../tutors/server";
import type { CreditKind } from "../collections/Credits";

const idOf = (v: unknown): number | null => (v == null ? null : typeof v === "object" ? ((v as { id: number }).id ?? null) : Number(v));
const round2 = (n: number) => Math.round(n * 100) / 100;
const siteUrl = () => (process.env.SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
const shortName = (u: Pick<User, "firstName" | "lastName">) => `${u.firstName ?? "A friend"}${u.lastName ? ` ${u.lastName.charAt(0)}.` : ""}`;
/** Kinds that make up a student's spendable balance (tutor bonuses are paid out with earnings). */
const SPENDABLE: CreditKind[] = ["referral_reward", "referral_welcome", "spent", "returned", "adjustment"];

/* ------------------------------------------------------------------ codes */

/** The person's invite code, made on first use: their first name plus four characters. */
export async function referralCode(payload: Payload, user: User): Promise<string> {
  if (user.referralCode) return user.referralCode;
  const base = (user.firstName ?? "friend").normalize("NFKD").replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 8) || "FRIEND";
  for (let i = 0; i < 6; i++) {
    const code = `${base}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    try {
      await payload.update({ collection: "users", id: user.id, data: { referralCode: code } as never, overrideAccess: true });
      return code;
    } catch {
      // Taken (unique): try another.
    }
  }
  throw new Error("Couldn't create an invite code");
}

export const inviteLink = (code: string) => `${siteUrl()}/r/${encodeURIComponent(code)}`;

export async function userByCode(payload: Payload, code: string) {
  const clean = code.trim().toUpperCase().slice(0, 20);
  if (!/^[A-Z]{1,8}-[A-Z0-9]{4}$/.test(clean)) return null;
  const r = await payload.find({ collection: "users", where: { and: [{ referralCode: { equals: clean } }, { status: { equals: "active" } }] }, limit: 1, depth: 0, overrideAccess: true });
  return r.docs[0] ?? null;
}

/** Link a new account to whoever invited them (never to themselves). */
export async function attachReferral(payload: Payload, newUser: { id: number; email?: string | null }, code: string | null | undefined) {
  if (!code) return null;
  const policies = await getPolicies(payload);
  if (!policies.referralsEnabled) return null;
  const by = await userByCode(payload, code);
  if (!by || by.id === newUser.id || (newUser.email && by.email === newUser.email)) return null;
  await payload.update({ collection: "users", id: newUser.id, data: { referredBy: by.id } as never, overrideAccess: true });
  return by;
}

/* ------------------------------------------------------------------ balance */

export async function creditBalance(payload: Payload, userId: number) {
  const r = await payload.find({ collection: "credits", where: { and: [{ user: { equals: userId } }, { kind: { in: SPENDABLE } }] }, limit: 5000, pagination: false, depth: 0, select: { amount: true, currency: true }, overrideAccess: true });
  return round2(r.docs.reduce((n, c) => n + (c.amount ?? 0), 0));
}

export async function addCredit(payload: Payload, data: { user: number; amount: number; currency: string; kind: CreditKind; note: string; friend?: number | null; booking?: number | null; payment?: number | null }) {
  if (!data.amount) return null;
  return payload.create({ collection: "credits", data: { ...data, amount: round2(data.amount) } as never, overrideAccess: true });
}

/* ------------------------------------------------------------------ rewards */

/**
 * After a finished lesson: if the student (or the tutor) was invited and this is their first
 * finished paid lesson, reward whoever invited them, and give an invited student credit too.
 * Each person's invite is rewarded once.
 */
export async function rewardReferrals(payload: Payload, b: Booking) {
  const policies = await getPolicies(payload);
  if (!policies.referralsEnabled) return;
  const paid = (b.paymentStatus === "paid" || b.paymentStatus === "partially_refunded") && (b.price ?? 0) > 0;
  if (!paid) return;
  for (const [field, isStudent] of [["student", true], ["tutorUser", false]] as const) {
    const id = idOf(b[field]);
    if (!id) continue;
    const friend = await payload.findByID({ collection: "users", id, depth: 0, overrideAccess: true }).catch(() => null);
    const inviterId = idOf(friend?.referredBy);
    if (!friend || !inviterId || friend.referralRewardedAt) continue;
    // Claim first, so a reward can't be given twice.
    const claimed = await payload.update({ collection: "users", where: { and: [{ id: { equals: friend.id } }, { referralRewardedAt: { exists: false } }] }, data: { referralRewardedAt: new Date().toISOString() } as never, overrideAccess: true });
    if (!claimed.docs.length) continue;
    const inviter = await payload.findByID({ collection: "users", id: inviterId, depth: 0, overrideAccess: true }).catch(() => null);
    if (!inviter || inviter.status !== "active") continue;
    const currency = String(policies.currency);
    const name = shortName(friend);
    const toTutor = inviter.role === "tutor";
    const inviterAmount = Number(toTutor ? policies.referralRewardTutor : policies.referralRewardReferrer);
    await addCredit(payload, { user: inviter.id, amount: inviterAmount, currency, kind: toTutor ? "tutor_bonus" : "referral_reward", note: `Thanks for inviting ${name}`, friend: friend.id, booking: b.id });
    if (isStudent) await addCredit(payload, { user: friend.id, amount: Number(policies.referralRewardFriend), currency, kind: "referral_welcome", note: `Welcome credit from ${shortName(inviter)}'s invite`, friend: inviter.id, booking: b.id });
    const [{ deliver }, { referralReward }, { personOf }] = await Promise.all([import("../notify/server"), import("../email/notices"), import("../scheduling/server")]);
    if (inviterAmount > 0) void deliver(payload, inviter, referralReward(personOf(inviter), { amount: inviterAmount, currency, friend: name, asEarnings: toTutor }));
    if (isStudent && Number(policies.referralRewardFriend) > 0) void deliver(payload, friend, referralReward(personOf(friend), { amount: Number(policies.referralRewardFriend), currency, friend: shortName(inviter), welcome: true }));
  }
}

/* ------------------------------------------------------------------ view */

/** Everything the "Invite friends" page shows. */
export async function referralSummary(payload: Payload, user: User) {
  const policies = await getPolicies(payload);
  const code = await referralCode(payload, user);
  const [invited, credits] = await Promise.all([
    payload.find({ collection: "users", where: { referredBy: { equals: user.id } }, sort: "-createdAt", limit: 200, depth: 0, overrideAccess: true }),
    payload.find({ collection: "credits", where: { user: { equals: user.id } }, sort: "-createdAt", limit: 100, depth: 0, overrideAccess: true }),
  ]);
  const earned = round2(credits.docs.filter((c) => c.kind === "referral_reward" || c.kind === "tutor_bonus").reduce((n, c) => n + (c.amount ?? 0), 0));
  return {
    enabled: Boolean(policies.referralsEnabled),
    code,
    link: inviteLink(code),
    currency: String(policies.currency),
    rewards: { you: Number(user.role === "tutor" ? policies.referralRewardTutor : policies.referralRewardReferrer), friend: Number(policies.referralRewardFriend), asEarnings: user.role === "tutor" },
    invited: invited.docs.map((u) => ({ name: shortName(u), joinedAt: u.createdAt, rewarded: Boolean(u.referralRewardedAt) })),
    earned,
    balance: user.role === "student" ? await creditBalance(payload, user.id) : 0,
    history: credits.docs.map((c) => ({ id: c.id, amount: c.amount, currency: c.currency, note: c.note, kind: c.kind, at: c.createdAt })),
  };
}
export type ReferralSummary = Awaited<ReturnType<typeof referralSummary>>;
