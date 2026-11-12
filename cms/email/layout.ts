import { BRAND_COLOURS } from "../brand";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const siteUrl = () => (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");

/**
 * Branded transactional email: table layout and inline styles so it renders in every client
 * (Gmail, Outlook, Apple Mail). `body` paragraphs are plain text and escaped.
 */
export function emailLayout({
  preheader,
  heading,
  body,
  cta,
  footnote,
}: {
  preheader: string;
  heading: string;
  body: string[];
  cta?: { label: string; href: string };
  footnote?: string;
}) {
  const c = BRAND_COLOURS;
  const p = body.map((t) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155">${esc(t)}</p>`).join("");
  const button = cta
    ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:8px 0 24px"><tr><td style="border-radius:999px;background:${c.primary}">
        <a href="${esc(cta.href)}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px">${esc(cta.label)}</a>
      </td></tr></table>
      <p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:#64748b">Or paste this link into your browser:<br><a href="${esc(cta.href)}" style="color:${c.primary};word-break:break-all">${esc(cta.href)}</a></p>`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(heading)}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Plus Jakarta Sans',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<span style="display:none;max-height:0;overflow:hidden">${esc(preheader)}</span>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 16px"><tr><td align="center">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px">
    <tr><td style="padding:0 8px 20px;font-size:22px;font-weight:700;color:${c.primaryDark};letter-spacing:-0.02em">Sabina<span style="color:${c.accentDark}">.</span></td></tr>
    <tr><td style="background:#ffffff;border-radius:20px;padding:36px 32px;border-top:6px solid ${c.primary}">
      <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#0f172a">${esc(heading)}</h1>
      ${p}${button}
      ${footnote ? `<p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#94a3b8">${esc(footnote)}</p>` : ""}
    </td></tr>
    <tr><td style="padding:20px 8px;font-size:12px;line-height:1.5;color:#94a3b8;text-align:center">Sabina Education · Learn from verified tutors, live.<br><a href="${siteUrl()}" style="color:#94a3b8">${esc(siteUrl().replace(/^https?:\/\//, ""))}</a></td></tr>
  </table>
</td></tr></table></body></html>`;
}
