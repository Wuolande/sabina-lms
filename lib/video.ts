/** Turn a YouTube / Vimeo / Cloudflare Stream link into an embeddable player URL (or null). */
export function videoEmbedUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtube.com" && u.searchParams.get("v")) return `https://www.youtube-nocookie.com/embed/${u.searchParams.get("v")}`;
    if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`;
    if (host === "vimeo.com") return `https://player.vimeo.com/video/${u.pathname.split("/").filter(Boolean)[0]}`;
    if (host === "player.vimeo.com") return url;
    if (host.endsWith("cloudflarestream.com") || host === "iframe.videodelivery.net") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return host === "iframe.videodelivery.net" ? url : `https://${host}/${id}/iframe`;
    }
  } catch {
    /* not a URL */
  }
  return null;
}
