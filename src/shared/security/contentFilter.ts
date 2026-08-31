/**
 * Content Safety & Anti-Circumvention Filter
 * -----------------------------------------------------------------------
 * Protects users from scams, phishing, and prevents fee disintermediation
 * by detecting and sanitizing direct contact info / payment links in chat.
 * -----------------------------------------------------------------------
 */

export interface ContentFilterResult {
  hasViolation: boolean;
  sanitizedContent: string;
  violations: string[];
}

// Regex patterns for sensitive off-platform contact information
const PHONE_PATTERN = /(\+?[0-9]{1,4}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/g;
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
const TELEGRAM_WHATSAPP_PATTERN = /(https?:\/\/)?(t\.me|wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com)\/[a-zA-Z0-9_+%-]+/gi;
const EXTERNAL_MEETING_PATTERN = /(https?:\/\/)?([a-zA-Z0-9-]+\.)?(zoom\.us|meet\.google\.com|teams\.microsoft\.com|skype\.com|webex\.com)\/[a-zA-Z0-9_?&=%-]+/gi;
const PAYMENT_HANDLE_PATTERN = /(paypal\.me\/[a-zA-Z0-9_]+|\$[a-zA-Z0-9_]{3,20}|venmo\.com\/[a-zA-Z0-9_-]+)/gi;

/**
 * Checks and optionally sanitizes message content to prevent off-platform disintermediation.
 */
export function sanitizeMessageContent(
  text: string,
  options: {
    filterEnabled?: boolean;
    redactSensitiveInfo?: boolean;
    allowEmails?: boolean;
  } = {}
): ContentFilterResult {
  const {
    filterEnabled = true,
    redactSensitiveInfo = true,
    allowEmails = false,
  } = options;

  if (!filterEnabled || !text) {
    return {
      hasViolation: false,
      sanitizedContent: text,
      violations: [],
    };
  }

  let sanitized = text;
  const violations: string[] = [];

  // 1. Check for Telegram / WhatsApp Direct Links
  if (TELEGRAM_WHATSAPP_PATTERN.test(text)) {
    violations.push('External messaging link detected (WhatsApp / Telegram)');
    if (redactSensitiveInfo) {
      sanitized = sanitized.replace(TELEGRAM_WHATSAPP_PATTERN, '[Link hidden for security]');
    }
  }

  // 2. Check for External Meeting Links (Zoom, Google Meet, Teams)
  if (EXTERNAL_MEETING_PATTERN.test(text)) {
    violations.push('External meeting link detected (Use Sabina LiveKit Video Classroom)');
    if (redactSensitiveInfo) {
      sanitized = sanitized.replace(EXTERNAL_MEETING_PATTERN, '[Video link hidden — Please use Sabina Classroom]');
    }
  }

  // 3. Check for Direct Payment Handles
  if (PAYMENT_HANDLE_PATTERN.test(text)) {
    violations.push('Direct payment handle detected (PayPal / CashApp / Venmo)');
    if (redactSensitiveInfo) {
      sanitized = sanitized.replace(PAYMENT_HANDLE_PATTERN, '[Payment handle hidden for buyer protection]');
    }
  }

  // 4. Check for Phone numbers (minimum 8 continuous/formatted digits)
  const phoneMatches = text.match(PHONE_PATTERN);
  if (phoneMatches) {
    const validPhones = phoneMatches.filter((p) => {
      const digitsOnly = p.replace(/\D/g, '');
      return digitsOnly.length >= 8 && digitsOnly.length <= 15;
    });

    if (validPhones.length > 0) {
      violations.push('Phone number detected');
      if (redactSensitiveInfo) {
        validPhones.forEach((p) => {
          sanitized = sanitized.replace(p, '[Phone number hidden]');
        });
      }
    }
  }

  // 5. Check for Email Addresses (if not permitted)
  if (!allowEmails && EMAIL_PATTERN.test(text)) {
    violations.push('Email address detected');
    if (redactSensitiveInfo) {
      sanitized = sanitized.replace(EMAIL_PATTERN, '[Email address hidden]');
    }
  }

  return {
    hasViolation: violations.length > 0,
    sanitizedContent: sanitized,
    violations,
  };
}
