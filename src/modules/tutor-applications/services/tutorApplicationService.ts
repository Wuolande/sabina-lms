/**
 * Tutor Application Service — Business Logic Layer
 * -----------------------------------------------------------------------
 * Orchestrates all tutor application lifecycle transitions:
 *   DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED/REQUESTED_CHANGES
 *   REJECTED → UNDER_REVIEW (admin re-open)
 *
 * All state transitions are validated by TutorApplicationStateMachine.
 * All admin actions write to the immutable audit_logs table.
 * Approval provisions the tutor profile via the atomic PostgreSQL function
 * provision_tutor_from_application() (migration 006).
 *
 * Migration note: The provision_tutor_from_application PG function handles
 * the atomic tutor profile creation — no in-memory side effects.
 * -----------------------------------------------------------------------
 */

import { tutorApplicationRepository } from '../repositories/tutorApplicationRepository';
import { TutorApplicationStateMachine } from '../domain/stateMachine';
import { TutorApplication } from '../domain/types';
import { NotFoundError, ValidationError } from '@/src/shared/errors';
import { auditRepository } from '@/src/shared/audit/auditRepository';
import { UserContext } from '@/src/shared/permissions/rbac';
import { adminSupabase } from '@/src/shared/database/supabase';

export class TutorApplicationService {
  /**
   * List applications with optional filters and pagination.
   */
  async listApplications(options: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    submittedFrom?: string;
    submittedTo?: string;
  }) {
    return tutorApplicationRepository.findAll(options);
  }

  /**
   * Get a single application with all related data.
   */
  async getApplication(id: string): Promise<TutorApplication> {
    const app = await tutorApplicationRepository.findById(id);
    if (!app) {
      throw new NotFoundError('Tutor Application', id);
    }
    return app;
  }

  /**
   * Move an application to UNDER_REVIEW status.
   */
  async startReview(
    id: string,
    admin: UserContext,
    meta: { notes?: string; ipAddress?: string; userAgent?: string } = {}
  ): Promise<TutorApplication> {
    const app = await this.getApplication(id);
    TutorApplicationStateMachine.validateTransition(app.status, 'UNDER_REVIEW');

    const updated = await tutorApplicationRepository.update(id, {
      status: 'UNDER_REVIEW',
      reviewerUserId: admin.id,
      reviewedAt: new Date().toISOString(),
    });

    await auditRepository.record({
      actorUserId: admin.id,
      actorName: admin.displayName,
      actorRole: admin.roles[0],
      action: 'TUTOR_APPLICATION_REVIEW_STARTED',
      entityType: 'TUTOR_APPLICATION',
      entityId: id,
      details: `Started review for applicant ${app.applicantName}.${meta.notes ? ' Notes: ' + meta.notes : ''}`,
      beforeState: { status: app.status },
      afterState: { status: 'UNDER_REVIEW' },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return updated!;
  }

  /**
   * Request changes from the applicant before approval.
   */
  async requestChanges(
    id: string,
    admin: UserContext,
    requestedChanges: string,
    meta: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<TutorApplication> {
    if (!requestedChanges || requestedChanges.trim().length < 5) {
      throw new ValidationError('Detailed instructions for requested changes are required (minimum 5 characters).');
    }

    const app = await this.getApplication(id);
    TutorApplicationStateMachine.validateTransition(app.status, 'REQUESTED_CHANGES');

    const updated = await tutorApplicationRepository.update(id, {
      status: 'REQUESTED_CHANGES',
      requestedChanges: requestedChanges.trim(),
      reviewerUserId: admin.id,
      reviewedAt: new Date().toISOString(),
    });

    await auditRepository.record({
      actorUserId: admin.id,
      actorName: admin.displayName,
      actorRole: admin.roles[0],
      action: 'TUTOR_APPLICATION_CHANGES_REQUESTED',
      entityType: 'TUTOR_APPLICATION',
      entityId: id,
      details: `Requested amendments for ${app.applicantName}: ${requestedChanges.trim()}`,
      beforeState: { status: app.status },
      afterState: { status: 'REQUESTED_CHANGES', requestedChanges },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return updated!;
  }

  /**
   * Reject a tutor application with a stated reason.
   */
  async reject(
    id: string,
    admin: UserContext,
    rejectionReason: string,
    meta: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<TutorApplication> {
    if (!rejectionReason || rejectionReason.trim().length < 5) {
      throw new ValidationError('A valid rejection reason is required (minimum 5 characters).');
    }

    const app = await this.getApplication(id);
    TutorApplicationStateMachine.validateTransition(app.status, 'REJECTED');

    const updated = await tutorApplicationRepository.update(id, {
      status: 'REJECTED',
      rejectionReason: rejectionReason.trim(),
      reviewerUserId: admin.id,
      reviewedAt: new Date().toISOString(),
    });

    await auditRepository.record({
      actorUserId: admin.id,
      actorName: admin.displayName,
      actorRole: admin.roles[0],
      action: 'TUTOR_APPLICATION_REJECTED',
      entityType: 'TUTOR_APPLICATION',
      entityId: id,
      details: `Rejected application for ${app.applicantName}. Reason: ${rejectionReason.trim()}`,
      beforeState: { status: app.status },
      afterState: { status: 'REJECTED', rejectionReason },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return updated!;
  }

  /**
   * Approve a tutor application and atomically provision their active profile.
   *
   * Calls the provision_tutor_from_application() PostgreSQL function (migration 006)
   * which atomically:
   *  1. Creates the tutor_profiles row
   *  2. Copies education, experience, subjects, languages from application tables
   *  3. Assigns TUTOR role to the user
   *
   * Returns the application and the new tutor profile ID.
   */
  async approve(
    id: string,
    admin: UserContext,
    options: { approvalNotes?: string; ipAddress?: string; userAgent?: string } = {}
  ): Promise<{ application: TutorApplication; tutorProfileId: string }> {
    const app = await this.getApplication(id);
    TutorApplicationStateMachine.validateTransition(app.status, 'APPROVED');

    // Step 1: Update application status
    await tutorApplicationRepository.update(id, {
      status: 'APPROVED',
      approvalNotes: options.approvalNotes || null,
      reviewerUserId: admin.id,
      reviewedAt: new Date().toISOString(),
    });

    // Step 2: Atomically provision the tutor profile via PG function
    const { data: tutorProfileId, error: provisionError } = await adminSupabase.rpc(
      'provision_tutor_from_application',
      {
        p_application_id: id,
        p_admin_id: admin.id,
      }
    );

    if (provisionError) {
      // Rollback application status on provisioning failure
      await tutorApplicationRepository.update(id, { status: app.status }).catch(() => {});
      throw new Error(
        `[TutorApplicationService.approve] Failed to provision tutor profile: ${provisionError.message}`
      );
    }

    await auditRepository.record({
      actorUserId: admin.id,
      actorName: admin.displayName,
      actorRole: admin.roles[0],
      action: 'TUTOR_APPLICATION_APPROVED',
      entityType: 'TUTOR_APPLICATION',
      entityId: id,
      details: `Approved application for ${app.applicantName}. Provisioned active tutor profile ID: ${tutorProfileId}.${options.approvalNotes ? ' Notes: ' + options.approvalNotes : ''}`,
      beforeState: { status: app.status },
      afterState: { status: 'APPROVED', tutorProfileId, approvalNotes: options.approvalNotes },
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
    });

    // Also record audit against the new tutor profile
    await auditRepository.record({
      actorUserId: admin.id,
      actorName: admin.displayName,
      actorRole: admin.roles[0],
      action: 'TUTOR_PROFILE_CREATED',
      entityType: 'TUTOR_PROFILE',
      entityId: tutorProfileId,
      details: `Tutor profile provisioned from application ${id} for ${app.applicantName}.`,
      afterState: { applicationId: id, accountStatus: 'ACTIVE' },
      ipAddress: options.ipAddress,
    });

    const updatedApp = await this.getApplication(id);
    return { application: updatedApp, tutorProfileId };
  }

  /**
   * Re-open a rejected application for re-review.
   * Only admins with TUTOR_APPLICATIONS_REOPEN permission can do this.
   */
  async reopenApplication(
    id: string,
    admin: UserContext,
    notes: string,
    meta: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<TutorApplication> {
    if (!notes || notes.trim().length < 5) {
      throw new ValidationError('A reason for reopening the application is required.');
    }

    const app = await this.getApplication(id);
    TutorApplicationStateMachine.validateTransition(app.status, 'UNDER_REVIEW');

    const updated = await tutorApplicationRepository.update(id, {
      status: 'UNDER_REVIEW',
      rejectionReason: null,
      reviewerUserId: admin.id,
      reviewedAt: new Date().toISOString(),
    });

    await auditRepository.record({
      actorUserId: admin.id,
      actorName: admin.displayName,
      actorRole: admin.roles[0],
      action: 'TUTOR_APPLICATION_REOPENED',
      entityType: 'TUTOR_APPLICATION',
      entityId: id,
      details: `Reopened rejected application for ${app.applicantName}. Reason: ${notes.trim()}`,
      beforeState: { status: app.status },
      afterState: { status: 'UNDER_REVIEW' },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return updated!;
  }

  /**
   * Verify or reject a specific document on an application.
   */
  async verifyDocument(
    applicationId: string,
    documentId: string,
    admin: UserContext,
    status: 'VERIFIED' | 'REJECTED',
    notes?: string,
    meta: { ipAddress?: string; userAgent?: string } = {}
  ) {
    const document = await tutorApplicationRepository.verifyDocument(
      documentId,
      admin.id,
      status,
      notes
    );

    await auditRepository.record({
      actorUserId: admin.id,
      actorName: admin.displayName,
      actorRole: admin.roles[0],
      action: `DOCUMENT_${status}`,
      entityType: 'TUTOR_APPLICATION',
      entityId: applicationId,
      details: `Document "${document.title}" marked as ${status}.${notes ? ' Notes: ' + notes : ''}`,
      afterState: { documentId, verificationStatus: status, notes },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return document;
  }

  /**
   * Get application status counts for admin dashboard widget.
   */
  async getStatusCounts(): Promise<Record<string, number>> {
    return tutorApplicationRepository.countByStatus();
  }
}

export const tutorApplicationService = new TutorApplicationService();
