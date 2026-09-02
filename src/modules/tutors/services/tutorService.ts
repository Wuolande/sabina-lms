/**
 * Tutor Service — Active Tutor Business Logic
 * -----------------------------------------------------------------------
 * All admin operations on active tutor profiles:
 *   - Suspend / Reactivate
 *   - Update hourly rate
 *   - Toggle Featured / Super Tutor badge
 *   - Get 360° profile with all metrics
 *
 * All mutations are logged to the immutable audit_logs table.
 *
 * Migration note: Uses get_tutor_360_aggregate PG function (migration 006)
 * and admin_stats_view (migration 007).
 * -----------------------------------------------------------------------
 */

import { tutorRepository } from '../repositories/tutorRepository';
import { Tutor360Aggregate } from '../domain/types';
import { NotFoundError, ValidationError } from '@/src/shared/errors';
import { auditRepository } from '@/src/shared/audit/auditRepository';
import { UserContext } from '@/src/shared/permissions/rbac';
import { getPlatformPolicies } from '@/src/shared/config/platformPolicies';

export class TutorService {
  /**
   * List tutors with pagination and filters.
   */
  async listTutors(options: {
    status?: string;
    search?: string;
    subject?: string;
    isFeatured?: boolean;
    isSuperTutor?: boolean;
    page?: number;
    limit?: number;
  }) {
    return tutorRepository.findAll(options);
  }

  /**
   * Get the full Tutor 360° aggregate.
   * Uses the get_tutor_360_aggregate PG function for single-round-trip efficiency.
   */
  async getTutor360(id: string): Promise<Tutor360Aggregate> {
    const tutor = await tutorRepository.getTutor360(id);
    if (!tutor) {
      throw new NotFoundError('Tutor Profile', id);
    }
    return tutor;
  }

  /**
   * Suspend a tutor account.
   * Requires a detailed reason (minimum 5 characters).
   */
  async suspendTutor(
    id: string,
    admin: UserContext,
    reason: string,
    meta: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<void> {
    if (!reason || reason.trim().length < 5) {
      throw new ValidationError('A detailed suspension reason is required (minimum 5 characters).');
    }

    const tutor = await this.getTutor360(id);

    if (tutor.accountStatus === 'SUSPENDED') {
      throw new ValidationError('This tutor account is already suspended.');
    }

    await tutorRepository.updateStatus(id, 'SUSPENDED', reason.trim(), admin.id);

    await auditRepository.record({
      actorUserId: admin.id,
      actorName: admin.displayName,
      actorRole: admin.roles[0],
      action: 'TUTOR_SUSPENDED',
      entityType: 'TUTOR_PROFILE',
      entityId: id,
      details: `Suspended tutor ${tutor.user.displayName}. Reason: ${reason.trim()}`,
      beforeState: { accountStatus: tutor.accountStatus },
      afterState: { accountStatus: 'SUSPENDED', suspensionReason: reason.trim() },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  }

  /**
   * Reactivate a suspended tutor account.
   */
  async reactivateTutor(
    id: string,
    admin: UserContext,
    meta: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<void> {
    const tutor = await this.getTutor360(id);

    if (tutor.accountStatus === 'ACTIVE') {
      throw new ValidationError('This tutor account is already active.');
    }

    await tutorRepository.updateStatus(id, 'ACTIVE');

    await auditRepository.record({
      actorUserId: admin.id,
      actorName: admin.displayName,
      actorRole: admin.roles[0],
      action: 'TUTOR_REACTIVATED',
      entityType: 'TUTOR_PROFILE',
      entityId: id,
      details: `Reactivated tutor ${tutor.user.displayName}. Full platform access restored.`,
      beforeState: { accountStatus: tutor.accountStatus, suspensionReason: tutor.suspensionReason },
      afterState: { accountStatus: 'ACTIVE' },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  }

  /**
   * Update a tutor's hourly rate.
   */
  async updateTutorRate(
    id: string,
    admin: UserContext,
    newRate: number,
    meta: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<void> {
    if (newRate < 1 || newRate > 10000) {
      throw new ValidationError('Hourly rate must be between $1 and $10,000.');
    }

    const tutor = await this.getTutor360(id);

    await tutorRepository.updateProfile(id, { hourlyRate: newRate });

    await auditRepository.record({
      actorUserId: admin.id,
      actorName: admin.displayName,
      actorRole: admin.roles[0],
      action: 'TUTOR_RATE_UPDATED',
      entityType: 'TUTOR_PROFILE',
      entityId: id,
      details: `Updated hourly rate for ${tutor.user.displayName}: $${tutor.hourlyRate}/hr → $${newRate}/hr`,
      beforeState: { hourlyRate: tutor.hourlyRate },
      afterState: { hourlyRate: newRate },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  }

  /**
   * Toggle the Featured flag on a tutor profile.
   */
  async toggleFeatured(
    id: string,
    admin: UserContext,
    meta: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<boolean> {
    const tutor = await this.getTutor360(id);
    const newValue = !tutor.isFeatured;

    await tutorRepository.updateProfile(id, { isFeatured: newValue });

    await auditRepository.record({
      actorUserId: admin.id,
      actorName: admin.displayName,
      actorRole: admin.roles[0],
      action: newValue ? 'TUTOR_FEATURED' : 'TUTOR_UNFEATURED',
      entityType: 'TUTOR_PROFILE',
      entityId: id,
      details: `${newValue ? 'Added' : 'Removed'} Featured badge for ${tutor.user.displayName}.`,
      beforeState: { isFeatured: tutor.isFeatured },
      afterState: { isFeatured: newValue },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return newValue;
  }

  /**
   * Toggle the Super Tutor badge on a tutor profile.
   */
  async toggleSuperTutor(
    id: string,
    admin: UserContext,
    meta: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<boolean> {
    const tutor = await this.getTutor360(id);
    const newValue = !tutor.isSuperTutor;

    await tutorRepository.updateProfile(id, { isSuperTutor: newValue });

    await auditRepository.record({
      actorUserId: admin.id,
      actorName: admin.displayName,
      actorRole: admin.roles[0],
      action: newValue ? 'TUTOR_SUPER_BADGE_GRANTED' : 'TUTOR_SUPER_BADGE_REVOKED',
      entityType: 'TUTOR_PROFILE',
      entityId: id,
      details: `${newValue ? 'Granted' : 'Revoked'} Super Tutor badge for ${tutor.user.displayName}.`,
      beforeState: { isSuperTutor: tutor.isSuperTutor },
      afterState: { isSuperTutor: newValue },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return newValue;
  }

  /**
   * Get full public profile aggregate by slug or ID.
   */
  async getPublicProfile(slugOrId: string) {
    const profile = await tutorRepository.getPublicProfile(slugOrId);
    if (!profile) {
      throw new NotFoundError('Tutor Public Profile', slugOrId);
    }
    return profile;
  }

  /**
   * Atomically update public profile and user information.
   */
  async updatePublicProfile(tutorProfileId: string, payload: any) {
    if (payload.hourlyRate !== undefined) {
      const policies = await getPlatformPolicies();
      if (payload.hourlyRate < policies.tutorMinHourlyRate || payload.hourlyRate > policies.tutorMaxHourlyRate) {
        throw new ValidationError(`Hourly rate must be between $${policies.tutorMinHourlyRate} and $${policies.tutorMaxHourlyRate}.`);
      }
    }
    return tutorRepository.updatePublicProfileAtomic(tutorProfileId, payload);
  }

  /**
   * Get tutor settings 360 aggregate.
   */
  async getSettings(tutorProfileId: string) {
    const settings = await tutorRepository.getSettings(tutorProfileId);
    if (!settings) {
      throw new NotFoundError('Tutor Settings', tutorProfileId);
    }
    return settings;
  }

  /**
   * Update tutor settings, rates, discounts, and payouts.
   */
  async updateSettings(tutorProfileId: string, payload: any) {
    if (payload.hourlyRate !== undefined) {
      const policies = await getPlatformPolicies();
      if (payload.hourlyRate < policies.tutorMinHourlyRate || payload.hourlyRate > policies.tutorMaxHourlyRate) {
        throw new ValidationError(`Hourly rate must be between $${policies.tutorMinHourlyRate} and $${policies.tutorMaxHourlyRate}.`);
      }
    }
    return tutorRepository.updateSettingsAtomic(tutorProfileId, payload);
  }

  /**
   * Deactivate tutor account.
   */
  async deactivateAccount(tutorProfileId: string, reason: string) {
    return tutorRepository.deactivateAccount(tutorProfileId, reason || 'User requested deactivation');
  }

  /**
   * Permanently delete tutor account under GDPR Right to Erasure.
   */
  async deleteAccountGdpr(tutorProfileId: string, reason: string) {
    return tutorRepository.deleteAccountGdpr(tutorProfileId, reason || 'User requested permanent erasure');
  }

  /**
   * Export all tutor data under GDPR Right to Access.
   */
  async exportGdprData(tutorProfileId: string) {
    return tutorRepository.exportGdprData(tutorProfileId);
  }

  /**
   * Get tutor dashboard 360 executive aggregate.
   */
  async getDashboard360(tutorProfileId: string) {
    const data = await tutorRepository.getDashboard360(tutorProfileId);
    if (!data) {
      throw new NotFoundError('Tutor Dashboard', tutorProfileId);
    }
    return data;
  }

  /**
   * Get live admin dashboard stats.
   */
  async getAdminStats() {
    return tutorRepository.getAdminStats();
  }
}

export const tutorService = new TutorService();
