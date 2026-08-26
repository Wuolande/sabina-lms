/**
 * Permission Constants — Sabina LMS RBAC
 * -----------------------------------------------------------------------
 * All permission strings used across the application.
 * These are seeded into public.permissions table via migration 005.
 *
 * Migration note: If you add a new permission here, also add a corresponding
 * INSERT to migration 005 (or a new patch migration) so the DB stays in sync.
 * -----------------------------------------------------------------------
 */

export const Permissions = {
  // ── Tutor Directory Management ──────────────────────────────────────
  /** View tutor directory, profiles, and analytics */
  TUTORS_VIEW: 'tutors.view',
  /** Modify tutor public profile, pricing, and settings */
  TUTORS_UPDATE: 'tutors.update',
  /** Suspend tutor accounts and restrict platform access */
  TUTORS_SUSPEND: 'tutors.suspend',
  /** Reactivate suspended tutor accounts */
  TUTORS_REACTIVATE: 'tutors.reactivate',
  /** Toggle featured flag on tutor profiles */
  TUTORS_FEATURE: 'tutors.feature',
  /** Toggle Super Tutor designation */
  TUTORS_SUPER_BADGE: 'tutors.super_badge',
  /** Override hourly rate for a tutor */
  TUTORS_RATE_EDIT: 'tutors.rate_edit',

  // ── Tutor Applications ─────────────────────────────────────────────
  /** Inspect submitted tutor applications */
  TUTOR_APPLICATIONS_VIEW: 'tutor_applications.view',
  /** Start review and assign reviewer to applications */
  TUTOR_APPLICATIONS_REVIEW: 'tutor_applications.review',
  /** Request amendments or additional documents from applicants */
  TUTOR_APPLICATIONS_REQUEST_CHANGES: 'tutor_applications.request_changes',
  /** Approve tutor application and provision active tutor profile */
  TUTOR_APPLICATIONS_APPROVE: 'tutor_applications.approve',
  /** Reject tutor application with stated reason */
  TUTOR_APPLICATIONS_REJECT: 'tutor_applications.reject',
  /** Re-open a rejected application for re-review */
  TUTOR_APPLICATIONS_REOPEN: 'tutor_applications.reopen',

  // ── Document Verification ──────────────────────────────────────────
  /** Mark application documents as verified or rejected */
  DOCUMENTS_VERIFY: 'documents.verify',

  // ── Audit ──────────────────────────────────────────────────────────
  /** Inspect immutable administrative audit trail */
  AUDIT_VIEW: 'audit.view',
} as const;

export type PermissionType = (typeof Permissions)[keyof typeof Permissions];
