/**
 * User Service — User Management & RBAC Business Logic
 * -----------------------------------------------------------------------
 * Manages user accounts, suspension/reactivation, role assignments,
 * and immutable audit logging.
 * -----------------------------------------------------------------------
 */

import { userRepository } from '../repositories/userRepository';
import { User360Aggregate, UserAccountStatus } from '../domain/types';
import { UserRoleType } from '@/src/shared/permissions/roles';
import { NotFoundError, ValidationError } from '@/src/shared/errors';
import { auditRepository } from '@/src/shared/audit/auditRepository';
import { UserContext } from '@/src/shared/permissions/rbac';

export class UserService {
  /**
   * List users with filters.
   */
  async listUsers(options: {
    role?: string;
    status?: string;
    search?: string;
    country?: string;
    page?: number;
    limit?: number;
  }) {
    return userRepository.findAll(options);
  }

  /**
   * Get User 360 Aggregate with student and tutor profiles.
   */
  async getUser360(userId: string): Promise<User360Aggregate> {
    const user = await userRepository.getUser360(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }
    return user;
  }

  /**
   * Suspend a user account.
   */
  async suspendUser(
    userId: string,
    admin: UserContext,
    reason: string,
    meta: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<void> {
    if (!reason || reason.trim().length < 5) {
      throw new ValidationError('A detailed suspension reason is required (minimum 5 characters).');
    }

    const user = await this.getUser360(userId);

    if (user.status === 'SUSPENDED') {
      throw new ValidationError('This user account is already suspended.');
    }

    await userRepository.updateProfile(userId, { status: 'SUSPENDED' });

    await auditRepository.record({
      actorUserId: admin.id,
      actorName: admin.displayName,
      actorRole: admin.roles[0],
      action: 'USER_SUSPENDED',
      entityType: 'USER',
      entityId: userId,
      details: `Suspended user ${user.displayName} (${user.email}). Reason: ${reason.trim()}`,
      beforeState: { status: user.status },
      afterState: { status: 'SUSPENDED', reason: reason.trim() },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  }

  /**
   * Reactivate a suspended user account.
   */
  async reactivateUser(
    userId: string,
    admin: UserContext,
    meta: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<void> {
    const user = await this.getUser360(userId);

    if (user.status === 'ACTIVE') {
      throw new ValidationError('This user account is already active.');
    }

    await userRepository.updateProfile(userId, { status: 'ACTIVE' });

    await auditRepository.record({
      actorUserId: admin.id,
      actorName: admin.displayName,
      actorRole: admin.roles[0],
      action: 'USER_REACTIVATED',
      entityType: 'USER',
      entityId: userId,
      details: `Reactivated user account for ${user.displayName}. Full platform access restored.`,
      beforeState: { status: user.status },
      afterState: { status: 'ACTIVE' },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  }

  /**
   * Update roles assigned to a user.
   */
  async updateUserRoles(
    userId: string,
    roles: UserRoleType[],
    admin: UserContext,
    meta: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<void> {
    if (!roles || roles.length === 0) {
      throw new ValidationError('At least one platform role must be assigned.');
    }

    const user = await this.getUser360(userId);

    await userRepository.setRoles(userId, roles, admin.id);

    await auditRepository.record({
      actorUserId: admin.id,
      actorName: admin.displayName,
      actorRole: admin.roles[0],
      action: 'USER_ROLES_UPDATED',
      entityType: 'USER',
      entityId: userId,
      details: `Updated roles for ${user.displayName}: [${user.roles.join(', ')}] → [${roles.join(', ')}]`,
      beforeState: { roles: user.roles },
      afterState: { roles },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  }

  /**
   * Update user general profile details.
   */
  async updateUserProfile(
    userId: string,
    updates: {
      displayName?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      country?: string;
      timezone?: string;
      preferredLanguage?: string;
    },
    admin: UserContext,
    meta: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<void> {
    const user = await this.getUser360(userId);

    await userRepository.updateProfile(userId, updates);

    await auditRepository.record({
      actorUserId: admin.id,
      actorName: admin.displayName,
      actorRole: admin.roles[0],
      action: 'USER_PROFILE_UPDATED',
      entityType: 'USER',
      entityId: userId,
      details: `Updated profile details for ${user.displayName}.`,
      beforeState: { displayName: user.displayName, country: user.country, timezone: user.timezone },
      afterState: updates,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  }

  /**
   * Create a new user manually from admin console.
   */
  async createUser(
    data: {
      email: string;
      displayName: string;
      country?: string;
      timezone?: string;
      roles?: UserRoleType[];
    },
    admin: UserContext,
    meta: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<string> {
    if (!data.email || !data.email.includes('@')) {
      throw new ValidationError('A valid email address is required.');
    }
    if (!data.displayName || data.displayName.trim().length < 2) {
      throw new ValidationError('Display name must be at least 2 characters.');
    }

    const newUserId = await userRepository.createUser(data, admin.id);

    await auditRepository.record({
      actorUserId: admin.id,
      actorName: admin.displayName,
      actorRole: admin.roles[0],
      action: 'USER_CREATED',
      entityType: 'USER',
      entityId: newUserId,
      details: `Created new user ${data.displayName} (${data.email}) with roles [${(data.roles || ['STUDENT']).join(', ')}].`,
      afterState: { email: data.email, displayName: data.displayName, roles: data.roles || ['STUDENT'] },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return newUserId;
  }
}

export const userService = new UserService();
