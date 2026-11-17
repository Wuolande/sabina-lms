import net from "node:net";
import { expect, test } from "@playwright/test";
import { Client } from "pg";
import { account, api } from "./accounts";

/**
 * Settings › Integrations & keys: admins enter service keys in the admin instead of the hosting
 * settings. Secrets are encrypted, shown only masked, kept when the form is saved again, used
 * straight away (a test email goes out through the SMTP details saved), and hidden from others.
 */
const ADMIN = { email: process.env.E2E_ADMIN_EMAIL || "admin@sabina.test", password: process.env.E2E_ADMIN_PASSWORD || "Admin12345!" };

/** A tiny SMTP server that accepts everything and remembers the messages. */
function fakeSmtp() {
  const messages: string[] = [];
  const server = net.createServer((sock) => {
    let data: string[] | null = null;
    const say = (s: string) => sock.write(`${s}\r\n`);
    say("220 fake");
    let buf = "";
    sock.on("data", (chunk) => {
      buf += chunk.toString();
      let i;
      while ((i = buf.indexOf("\r\n")) >= 0) {
        const line = buf.slice(0, i);
        buf = buf.slice(i + 2);
        if (data) {
          if (line === ".") (messages.push(data.join("\n")), (data = null), say("250 queued"));
          else data.push(line);
          continue;
        }
        const u = line.toUpperCase();
        if (u.startsWith("EHLO")) (say("250-fake"), say("250-AUTH PLAIN LOGIN"), say("250 OK"));
        else if (u.startsWith("AUTH")) say("235 ok");
        else if (u.startsWith("DATA")) ((data = []), say("354 go"));
        else if (u.startsWith("QUIT")) (say("221 bye"), sock.end());
        else say("250 ok");
      }
    });
  });
  return new Promise<{ port: number; messages: string[]; close: () => void }>((resolve) =>
    server.listen(0, "127.0.0.1", () => resolve({ port: (server.address() as net.AddressInfo).port, messages, close: () => server.close() })),
  );
}

test("service keys are managed in the admin, encrypted and used at once", async ({}, info) => {
  test.skip(info.project.name !== "desktop", "Runs once, on desktop");
  const smtp = await fakeSmtp();
  const admin = (await api("/api/auth/login", { method: "POST", body: JSON.stringify(ADMIN) })).cookie!;
  const pass = `pw-${Math.random().toString(36).slice(2)}-secret`;
  try {
    const saved = await api("/api/cms/globals/integrations", {
      method: "POST",
      cookie: admin,
      body: JSON.stringify({ email: { smtpHost: "127.0.0.1", smtpPort: String(smtp.port), smtpUser: "tester", smtpPass: pass, fromAddress: "hello@example.com", fromName: "Sabina Edge" } }),
    });
    expect(saved.res.ok, JSON.stringify(saved.data)).toBe(true);

    // Shown masked, stored encrypted.
    const read = (await api("/api/cms/globals/integrations", { cookie: admin })).data as { email: Record<string, string> };
    expect(read.email.smtpPass).toBe(`••••••••${pass.slice(-4)}`);
    expect(read.email.smtpHost).toBe("127.0.0.1");
    const db = new Client({ connectionString: process.env.DATABASE_URI });
    await db.connect();
    const row = (await db.query("select email_smtp_pass from payload.integrations limit 1")).rows[0];
    await db.end();
    expect(row.email_smtp_pass).toMatch(/^enc:v1:/);
    expect(row.email_smtp_pass).not.toContain(pass);

    // Saving the form again with the masked value keeps the real one.
    await api("/api/cms/globals/integrations", { method: "POST", cookie: admin, body: JSON.stringify({ email: read.email }) });
    const status = (await api("/api/admin/integrations", { cookie: admin })).data as { ready: Record<string, boolean>; keys: Record<string, string> };
    expect(status.ready.email).toBe(true);
    expect(status.keys.SMTP_PASS).toBe("admin");

    // A test email goes out through the saved server, straight away.
    const sent = await api("/api/admin/integrations", { method: "POST", cookie: admin, body: JSON.stringify({ tab: "email", to: "owner@example.com" }) });
    expect(sent.res.status, JSON.stringify(sent.data)).toBe(200);
    await expect.poll(() => smtp.messages.length).toBeGreaterThan(0);
    expect(smtp.messages[0]).toContain("Subject: Test email from your Sabina Edge site");
    expect(smtp.messages[0]).toContain("From: Sabina Edge <hello@example.com>");

    // Nobody else can read or change the keys.
    const student = await account("student", "Nosy", "Student");
    expect((await api("/api/cms/globals/integrations", { cookie: student.cookie })).res.status).toBe(403);
    expect((await api("/api/admin/integrations", { cookie: student.cookie })).res.status).toBe(403);
    expect((await api("/api/cms/globals/integrations")).res.status).toBe(403);
  } finally {
    await api("/api/cms/globals/integrations", { method: "POST", cookie: admin, body: JSON.stringify({ email: { smtpHost: "", smtpPort: "", smtpUser: "", smtpPass: "", fromAddress: "", fromName: "" } }) });
    smtp.close();
  }
});
