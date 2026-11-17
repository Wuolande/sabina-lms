import type { EmailAdapter, SendEmailOptions } from "payload";
import nodemailer from "nodemailer";

/**
 * Sends email over SMTP using the settings in Settings › Integrations & keys › Email (or the
 * SMTP_* hosting settings). Read at send time, so saving new details in the admin takes effect
 * straight away. Without settings, emails are logged and skipped.
 */
const DEFAULT_FROM = "no-reply@sabina.education";

export const smtpAdapter: EmailAdapter = ({ payload }) => ({
  name: "sabina-smtp",
  defaultFromAddress: DEFAULT_FROM,
  defaultFromName: "Sabina Edge",
  async sendEmail(message: SendEmailOptions) {
    const { applyIntegrations } = await import("../integrations/server");
    await applyIntegrations(payload);
    const e = process.env;
    if (!(e.SMTP_HOST && e.SMTP_USER && e.SMTP_PASS)) {
      payload.logger.info(`[email] Email isn't set up yet, so this wasn't sent: ${String(message.subject ?? "")}`);
      return { skipped: true };
    }
    const port = Number(e.SMTP_PORT || 587);
    const transport = nodemailer.createTransport({ host: e.SMTP_HOST, port, secure: port === 465, auth: { user: e.SMTP_USER, pass: e.SMTP_PASS } });
    const from = `"${(e.EMAIL_FROM_NAME || "Sabina Edge").replace(/"/g, "")}" <${e.EMAIL_FROM || e.SMTP_USER}>`;
    const given = typeof message.from === "string" ? message.from : "";
    return transport.sendMail({ ...message, from: !given || given.includes(DEFAULT_FROM) ? from : message.from });
  },
});

export const emailReady = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
