/**
 * Cloudflare R2 (S3-compatible) for every uploaded file.
 *
 * Two buckets:
 *  - R2_BUCKET          public files (avatars, blog images, course thumbnails), served from R2_PUBLIC_URL
 *  - R2_PRIVATE_BUCKET  private files (tutor ID documents, certificates, lesson materials), only ever
 *                       served through Payload, which checks access on every request
 *
 * In development, when the R2 variables are missing, Payload stores files on local disk instead.
 */
const env = process.env;

export const r2Ready = () =>
  Boolean(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET);

export const r2Endpoint = () => env.R2_ENDPOINT || (env.R2_ACCOUNT_ID ? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined);

/** S3 client settings for @payloadcms/storage-s3. */
export const r2Config = () => ({
  endpoint: r2Endpoint(),
  region: "auto",
  forcePathStyle: true,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID || "", secretAccessKey: env.R2_SECRET_ACCESS_KEY || "" },
});

export const r2PublicBase = () => String(env.R2_PUBLIC_URL || "").replace(/\/+$/, "");

/** Public address of a file in the public bucket (prefix = the collection's folder). */
export function r2PublicUrl(filename: string, prefix?: string) {
  const key = `${prefix ? `${prefix}/` : ""}${filename}`;
  return `${r2PublicBase()}/${key.split("/").map(encodeURIComponent).join("/")}`;
}
