import "server-only";

/**
 * Cloudflare Stream: tutors upload intro videos straight from the browser with a one-time
 * "direct creator upload" URL, so files never pass through our server. Stream encodes the video
 * and serves it from its player at customer-<code>.cloudflarestream.com/<uid>/iframe.
 */
export const streamConfigured = () => Boolean(process.env.CLOUDFLARE_STREAM_ACCOUNT_ID && process.env.CLOUDFLARE_STREAM_API_TOKEN && process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE);

export async function createDirectUpload(opts: { name: string; maxDurationSeconds: number; creator: string }) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_STREAM_ACCOUNT_ID}/stream/direct_upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_STREAM_API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ maxDurationSeconds: opts.maxDurationSeconds, creator: opts.creator, meta: { name: opts.name }, expiry: new Date(Date.now() + 60 * 60_000).toISOString() }),
    cache: "no-store",
  });
  const d = (await res.json()) as { success?: boolean; result?: { uploadURL: string; uid: string }; errors?: { message: string }[] };
  if (!res.ok || !d.success || !d.result) throw new Error(`Stream: ${d.errors?.[0]?.message ?? res.status}`);
  return { uploadURL: d.result.uploadURL, uid: d.result.uid, watchUrl: `https://customer-${process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE}.cloudflarestream.com/${d.result.uid}/iframe` };
}
