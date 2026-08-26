/**
 * Cloudinary Signature Generator for Secure Direct Browser Uploads
 * -----------------------------------------------------------------------
 * Generates signed parameters that allow the browser to upload directly
 * to Cloudinary without exposing the API secret or passing large files
 * through Next.js server bandwidth.
 * -----------------------------------------------------------------------
 */

import crypto from 'crypto';

export interface CloudinarySignatureParams {
  timestamp: number;
  folder: string;
  signature: string;
  apiKey: string;
  cloudName: string;
}

export function generateUploadSignature(
  folder: string = 'sabina/tutor-docs'
): CloudinarySignatureParams {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'sabina-edge';
  const apiKey = process.env.CLOUDINARY_API_KEY || 'demo-api-key';
  const apiSecret = process.env.CLOUDINARY_API_SECRET || 'demo-api-secret';

  const timestamp = Math.round(new Date().getTime() / 1000);

  // Sign parameters in alphabetical order
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash('sha1')
    .update(paramsToSign + apiSecret)
    .digest('hex');

  return {
    timestamp,
    folder,
    signature,
    apiKey,
    cloudName,
  };
}
