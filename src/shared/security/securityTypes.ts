/**
 * Security & reCAPTCHA Domain Types
 * -----------------------------------------------------------------------
 * Types for Google reCAPTCHA v2/v3, anti-abuse safeguards, rate limiters,
 * content filters, and platform security policies.
 * -----------------------------------------------------------------------
 */

export type RecaptchaVersion = 'v3' | 'v2_checkbox' | 'v2_invisible';

export interface ProtectedFormsConfig {
  login: boolean;
  register: boolean;
  forgotPassword: boolean;
  resetPassword: boolean;
  contactUs: boolean;
  tutorApplication: boolean;
  reviewSubmission: boolean;
  bookingCheckout: boolean;
}

export interface SecuritySettings {
  // Google reCAPTCHA Configuration
  recaptchaEnabled: boolean;
  recaptchaVersion: RecaptchaVersion;
  recaptchaSiteKey: string;
  recaptchaSecretKey: string;
  recaptchaMinScore: number; // 0.0 to 1.0 (default: 0.5)
  protectedForms: ProtectedFormsConfig;

  // Rate Limiting & Brute Force Defense
  rateLimitingEnabled: boolean;
  maxLoginAttempts: number; // e.g. 5 attempts before lockout
  lockoutDurationMinutes: number; // e.g. 15 minutes
  maxResetAttemptsPerHour: number; // e.g. 3 attempts

  // Abuse & Content Safety
  antiSpamChatFilter: boolean; // Auto-redacts phone numbers & off-platform payment links
  blockExternalVideoLinksInChat: boolean; // Blocks Zoom, Skype, Google Meet links in pre-booking chats
  ipBlacklist: string[]; // List of blocked IP addresses/CIDRs
  ipWhitelist: string[]; // Whitelisted IPs (e.g. office/admin network)

  // Account & Session Hardening
  sessionInactivityTimeoutMinutes: number; // Auto logout after inactivity (default: 120 min)
  enforce2FAForAdmins: boolean; // Require MFA for Admin and Staff roles
  requireEmailVerificationToBook: boolean; // Require verified email before purchasing lessons
  suspiciousLoginAlertsEnabled: boolean; // Send email when new device/IP logs in
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  recaptchaEnabled: false,
  recaptchaVersion: 'v3',
  recaptchaSiteKey: '',
  recaptchaSecretKey: '',
  recaptchaMinScore: 0.5,
  protectedForms: {
    login: true,
    register: true,
    forgotPassword: true,
    resetPassword: true,
    contactUs: true,
    tutorApplication: true,
    reviewSubmission: false,
    bookingCheckout: false,
  },
  rateLimitingEnabled: true,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 15,
  maxResetAttemptsPerHour: 3,
  antiSpamChatFilter: true,
  blockExternalVideoLinksInChat: true,
  ipBlacklist: [],
  ipWhitelist: [],
  sessionInactivityTimeoutMinutes: 120,
  enforce2FAForAdmins: false,
  requireEmailVerificationToBook: true,
  suspiciousLoginAlertsEnabled: true,
};
