import "server-only";
import type { Payload } from "payload";
import type { User } from "@/payload-types";

/**
 * Text reminders by SMS or WhatsApp through Africa's Talking. Off until AFRICASTALKING_USERNAME
 * and AFRICASTALKING_API_KEY are set. WhatsApp is used when AFRICASTALKING_WHATSAPP_NUMBER is
 * set (falling back to SMS if it fails); otherwise SMS. People opt in on their Notifications page.
 */
const env = process.env;
export const textConfigured = () => Boolean(env.AFRICASTALKING_USERNAME && env.AFRICASTALKING_API_KEY);
export const whatsappConfigured = () => textConfigured() && Boolean(env.AFRICASTALKING_WHATSAPP_NUMBER);
const sandbox = () => env.AFRICASTALKING_USERNAME === "sandbox";
const smsUrl = () => env.AFRICASTALKING_SMS_URL || `https://api.${sandbox() ? "sandbox." : ""}africastalking.com/version1/messaging`;
const waUrl = () => env.AFRICASTALKING_WHATSAPP_URL || "https://chat.africastalking.com/whatsapp/message/send";

/** Dialling codes for the countries we see most; other numbers must be saved with +code. */
const DIAL: Record<string, string> = {
  Kenya: "254", Uganda: "256", Tanzania: "255", Rwanda: "250", Burundi: "257", Ethiopia: "251", "South Sudan": "211", Somalia: "252", Nigeria: "234", Ghana: "233",
  "South Africa": "27", Zambia: "260", Zimbabwe: "263", Malawi: "265", Egypt: "20", "United Kingdom": "44", "United States": "1", Canada: "1", India: "91", "United Arab Emirates": "971",
};

/** "+254 712 345 678", "0712 345678" (Kenya) → "+254712345678". Null when we can't be sure. */
export function toE164(phone: string | null | undefined, country?: string | null): string | null {
  const raw = String(phone ?? "").trim();
  if (!raw) return null;
  let digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;
  if (!digits.startsWith("+")) {
    const code = country ? DIAL[country] : undefined;
    if (!code) return null;
    digits = digits.startsWith(code) && digits.length > 10 ? `+${digits}` : `+${code}${digits.replace(/^0+/, "")}`;
  }
  return /^\+[1-9]\d{8,14}$/.test(digits) ? digits : null;
}

async function viaSms(to: string, message: string) {
  const form = new URLSearchParams({ username: env.AFRICASTALKING_USERNAME!, to, message });
  if (env.AFRICASTALKING_SENDER_ID) form.set("from", env.AFRICASTALKING_SENDER_ID);
  const res = await fetch(smsUrl(), { method: "POST", headers: { apiKey: env.AFRICASTALKING_API_KEY!, Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" }, body: form, signal: AbortSignal.timeout(15_000) });
  const data = (await res.json().catch(() => null)) as { SMSMessageData?: { Recipients?: { status?: string; statusCode?: number }[]; Message?: string } } | null;
  const r = data?.SMSMessageData?.Recipients?.[0];
  if (!res.ok || !r || (r.statusCode !== 101 && r.statusCode !== 100 && r.statusCode !== 102)) throw new Error(`SMS not accepted: ${r?.status ?? data?.SMSMessageData?.Message ?? res.status}`);
}

async function viaWhatsApp(to: string, message: string) {
  const res = await fetch(waUrl(), {
    method: "POST",
    headers: { apiKey: env.AFRICASTALKING_API_KEY!, Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ username: env.AFRICASTALKING_USERNAME, waNumber: env.AFRICASTALKING_WHATSAPP_NUMBER, phoneNumber: to, body: { message } }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`WhatsApp not accepted: ${res.status} ${(await res.text().catch(() => "")).slice(0, 200)}`);
}

/**
 * Send one text to a person who opted in. Never throws: the result is written to the text log
 * (Admin → Messages → Text log).
 */
export async function sendText(payload: Payload, user: User, message: string, kind: string) {
  if (!textConfigured() || !user.textReminders) return "skipped" as const;
  const to = toE164(user.phone, user.country);
  const log = (channel: "sms" | "whatsapp", status: "sent" | "failed", error?: string) =>
    payload.create({ collection: "text-log", data: { user: user.id, to: to ?? String(user.phone ?? ""), channel, kind, body: message, status, error }, overrideAccess: true }).catch(() => undefined);
  if (!to) {
    await log("sms", "failed", "The phone number needs a country code, e.g. +254 712 345 678.");
    return "failed" as const;
  }
  if (whatsappConfigured()) {
    try {
      await viaWhatsApp(to, message);
      await log("whatsapp", "sent");
      return "sent" as const;
    } catch (err) {
      await log("whatsapp", "failed", (err as Error).message);
    }
  }
  try {
    await viaSms(to, message);
    await log("sms", "sent");
    return "sent" as const;
  } catch (err) {
    payload.logger.warn({ err: (err as Error).message }, "[text] not sent");
    await log("sms", "failed", (err as Error).message);
    return "failed" as const;
  }
}

/** Send a test message from the admin (Settings › Integrations & keys). Throws with the reason if it fails. */
export async function sendTestText(phone: string, message: string): Promise<"whatsapp" | "sms"> {
  const to = toE164(phone);
  if (!to) throw new Error("Enter the number with its country code, e.g. +254 712 345 678.");
  if (whatsappConfigured()) {
    try {
      await viaWhatsApp(to, message);
      return "whatsapp";
    } catch {
      // fall back to SMS
    }
  }
  await viaSms(to, message);
  return "sms";
}
