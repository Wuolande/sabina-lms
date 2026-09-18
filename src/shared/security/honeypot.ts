/**
 * Anti-Bot Honeypot Defense Utility
 * -----------------------------------------------------------------------
 * Detects and intercepts automated spam bots that blindly populate hidden form fields.
 * Validates hidden honeypot fields like `_hp_company`, `_hp_website`, etc.
 * -----------------------------------------------------------------------
 */

const HONEYPOT_FIELD_NAMES = ['_hp_company', '_hp_website', '_hp_fax', '_hp_phone_alt'];

export interface HoneypotCheckResult {
  isBot: boolean;
  fieldTriggered?: string;
}

/**
 * Inspects a request payload (JSON object or FormData) for filled honeypot fields.
 * Returns isBot = true if any hidden trap field has non-empty content.
 */
export function checkHoneypot(payload: Record<string, any> | FormData | null | undefined): HoneypotCheckResult {
  if (!payload) {
    return { isBot: false };
  }

  if (typeof FormData !== 'undefined' && payload instanceof FormData) {
    for (const name of HONEYPOT_FIELD_NAMES) {
      const val = payload.get(name);
      if (val && typeof val === 'string' && val.trim().length > 0) {
        return { isBot: true, fieldTriggered: name };
      }
    }
    return { isBot: false };
  }

  for (const name of HONEYPOT_FIELD_NAMES) {
    const val = (payload as any)[name];
    if (val && typeof val === 'string' && val.trim().length > 0) {
      return { isBot: true, fieldTriggered: name };
    }
  }

  return { isBot: false };
}
