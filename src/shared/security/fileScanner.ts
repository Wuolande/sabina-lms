/**
 * Server-Side File Security & Anti-Malware Scanner
 * -----------------------------------------------------------------------
 * Provides multi-layer security protection:
 * 1. Magic Bytes / Header Signature verification (prevents disguised executables).
 * 2. Dangerous extension blocking (.exe, .bat, .sh, .vbs, .js, .scr, .php, etc).
 * 3. Malicious content heuristic scanning (embedded script tags, shell commands).
 * 4. Strict MIME type whitelist & file size constraints.
 * -----------------------------------------------------------------------
 */

export interface SecurityScanResult {
  safe: boolean;
  detectedMime?: string;
  fileSize: number;
  error?: string;
}

const DANGEROUS_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'sh', 'bash', 'vbs', 'vbe', 'js', 'jse', 'wsf', 'wsh',
  'msc', 'msi', 'msp', 'scr', 'dll', 'sys', 'drv', 'cpl', 'jar', 'apk',
  'com', 'gadget', 'pif', 'php', 'php3', 'php4', 'php5', 'phtml', 'asp',
  'aspx', 'jsp', 'cgi', 'pl', 'py', 'rb', 'ps1', 'ps2', 'psm1', 'psd1',
]);

const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  // Videos
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
]);

/**
 * Validates magic bytes against expected file signatures.
 */
function verifyMagicBytes(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }

  // GIF: 47 49 46 38
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x48
  ) {
    return 'image/gif';
  }

  // WEBP: 52 49 46 46 ... 57 45 42 50
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  // PDF: 25 50 44 46 (%PDF)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return 'application/pdf';
  }

  // MP4 / QuickTime: ....ftyp or ....moov
  if (buffer.length >= 12) {
    const ftyp = buffer.subarray(4, 8).toString('ascii');
    if (ftyp === 'ftyp' || ftyp === 'moov') {
      return 'video/mp4';
    }
  }

  // WebM / MKV: 1A 45 DF A3
  if (
    buffer[0] === 0x1A &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xDF &&
    buffer[3] === 0xA3
  ) {
    return 'video/webm';
  }

  // DOCX / ZIP: 50 4B 03 04
  if (
    buffer[0] === 0x50 &&
    buffer[1] === 0x4B &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  ) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }

  // Plain text or SVG check
  const snippet = buffer.subarray(0, Math.min(buffer.length, 512)).toString('utf8');
  if (snippet.includes('<svg') || snippet.includes('<?xml')) {
    return 'image/svg+xml';
  }

  return null;
}

/**
 * Heuristic anti-malware inspection for malicious scripts or macros.
 */
function scanMaliciousPayloads(buffer: Buffer): string | null {
  const content = buffer.subarray(0, Math.min(buffer.length, 4096)).toString('utf8', 0, 4096).toLowerCase();

  // Executable DOS/Windows headers (MZ / PE)
  if (buffer.length >= 2 && buffer[0] === 0x4D && buffer[1] === 0x5A) {
    return 'Dangerous Windows executable / DLL binary signature detected.';
  }

  // ELF executable headers (Linux executable)
  if (buffer.length >= 4 && buffer[0] === 0x7F && buffer[1] === 0x45 && buffer[2] === 0x4C && buffer[3] === 0x46) {
    return 'Dangerous Linux ELF binary signature detected.';
  }

  // Embedded malicious script tags in non-code files
  if (content.includes('<script') || content.includes('javascript:') || content.includes('vbscript:')) {
    return 'Dangerous embedded script payload detected in file header.';
  }

  // Embedded shell invocation patterns
  if (content.includes('#!/bin/sh') || content.includes('#!/bin/bash') || content.includes('powershell.exe')) {
    return 'Dangerous script execution directive detected.';
  }

  return null;
}

/**
 * Main security scan method.
 */
export async function scanFileForMalware(
  fileBuffer: Buffer,
  filename: string,
  declaredMimeType: string,
  maxSizeBytes: number = 25 * 1024 * 1024
): Promise<SecurityScanResult> {
  const fileSize = fileBuffer.length;

  // 1. File Size Check
  if (fileSize > maxSizeBytes) {
    return {
      safe: false,
      fileSize,
      error: `File size exceeds safety limit of ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB.`,
    };
  }

  // 2. Extension Whitelist & Blacklist
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return {
      safe: false,
      fileSize,
      error: `Executable or script extension ('.${ext}') is strictly prohibited for security.`,
    };
  }

  // 3. Magic Bytes / Header Signature Inspection
  const detectedMime = verifyMagicBytes(fileBuffer);
  if (!detectedMime) {
    // If not matching a known safe binary signature, verify if it's text
    if (!declaredMimeType.startsWith('text/') && declaredMimeType !== 'image/svg+xml') {
      return {
        safe: false,
        fileSize,
        error: 'File signature could not be verified or format is not permitted.',
      };
    }
  }

  const effectiveMime = detectedMime || declaredMimeType;
  if (!ALLOWED_MIME_TYPES.has(effectiveMime)) {
    return {
      safe: false,
      fileSize,
      error: `Disallowed media format (${effectiveMime}). Only standard images, PDFs, DOCX, and videos are accepted.`,
    };
  }

  // 4. Anti-Malware / Exploit Payload Heuristic Scan
  const threatError = scanMaliciousPayloads(fileBuffer);
  if (threatError) {
    return {
      safe: false,
      fileSize,
      error: threatError,
    };
  }

  return {
    safe: true,
    detectedMime: effectiveMime,
    fileSize,
  };
}
