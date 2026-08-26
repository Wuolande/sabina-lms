/**
 * User Repository — Global User Identity & RBAC Data Access
 * -----------------------------------------------------------------------
 * Manages users, user_roles, and single-roundtrip User 360 aggregate.
 * -----------------------------------------------------------------------
 */

import { adminSupabase } from '@/src/shared/database/supabase';
import { User360Aggregate, UserListItem, UserListResult, UserAccountStatus } from '../domain/types';
import { UserRoleType } from '@/src/shared/permissions/roles';

export class UserRepository {
  /**
   * List users with pagination, role filter, status filter, and search.
   */
  async findAll(options: {
    role?: string;
    status?: string;
    search?: string;
    country?: string;
    page?: number;
    limit?: number;
  }): Promise<UserListResult> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(options.limit || 20, 100);
    const offset = (page - 1) * limit;

    let query = adminSupabase
      .from('users')
      .select(
        `
        id, email, first_name, last_name, display_name, avatar_url, phone, country,
        timezone, preferred_language, status, created_at, updated_at,
        roles:user_roles!user_id(role_id),
        student_profiles:student_profiles!user_id(completed_lessons, total_hours_learned, learning_streak_days),
        tutor_profiles:tutor_profiles!user_id(id, slug, headline, hourly_rate, average_rating, account_status)
      `,
        { count: 'exact' }
      );

    if (options.status) {
      query = query.eq('status', options.status);
    }
    if (options.country) {
      query = query.eq('country', options.country);
    }
    if (options.search) {
      const q = options.search.trim();
      query = query.or(`display_name.ilike.%${q}%,email.ilike.%${q}%`);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`[UserRepository.findAll] ${error.message}`);
    }

    let mapped: UserListItem[] = (data || []).map((u: any) => {
      const stuProf = Array.isArray(u.student_profiles) ? u.student_profiles[0] : u.student_profiles;
      const tutProf = Array.isArray(u.tutor_profiles) ? u.tutor_profiles[0] : u.tutor_profiles;

      return {
        id: u.id,
        email: u.email,
        firstName: u.first_name || undefined,
        lastName: u.last_name || undefined,
        displayName: u.display_name || 'User',
        avatarUrl: u.avatar_url || undefined,
        phone: u.phone || undefined,
        country: u.country || 'Global',
        timezone: u.timezone || 'UTC',
        preferredLanguage: u.preferred_language || 'English',
        status: u.status || 'ACTIVE',
        roles: (u.roles || []).map((r: any) => r.role_id as UserRoleType),
        createdAt: u.created_at,
        updatedAt: u.updated_at,
        studentProfile: stuProf ? {
          completedLessons: Number(stuProf.completed_lessons) || 0,
          totalHoursLearned: Number(stuProf.total_hours_learned) || 0,
          learningStreakDays: Number(stuProf.learning_streak_days) || 0,
        } : undefined,
        tutorProfile: tutProf ? {
          id: tutProf.id,
          slug: tutProf.slug,
          headline: tutProf.headline,
          hourlyRate: Number(tutProf.hourly_rate) || 0,
          averageRating: Number(tutProf.average_rating) || 5.0,
          accountStatus: tutProf.account_status,
        } : undefined,
      };
    });

    // Filter by role if requested
    if (options.role && options.role !== 'ALL') {
      mapped = mapped.filter((u) => u.roles.includes(options.role as UserRoleType));
    }

    return {
      data: mapped,
      total: count || mapped.length,
      page,
      limit,
      hasMore: offset + limit < (count || mapped.length),
    };
  }

  /**
   * Get full User 360° aggregate via the PostgreSQL function get_user_360_aggregate.
   */
  async getUser360(userId: string): Promise<User360Aggregate | null> {
    const { data, error } = await adminSupabase.rpc('get_user_360_aggregate', {
      p_user_id: userId,
    });

    if (error) {
      throw new Error(`[UserRepository.getUser360] ${error.message}`);
    }
    if (!data) return null;

    return data as User360Aggregate;
  }

  /**
   * Update user basic profile information.
   */
  async updateProfile(
    userId: string,
    updates: {
      firstName?: string;
      lastName?: string;
      displayName?: string;
      phone?: string;
      country?: string;
      timezone?: string;
      preferredLanguage?: string;
      status?: UserAccountStatus;
    }
  ): Promise<void> {
    const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() };

    if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
    if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
    if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.country !== undefined) dbUpdates.country = updates.country;
    if (updates.timezone !== undefined) dbUpdates.timezone = updates.timezone;
    if (updates.preferredLanguage !== undefined) dbUpdates.preferred_language = updates.preferredLanguage;
    if (updates.status !== undefined) dbUpdates.status = updates.status;

    const { error } = await adminSupabase
      .from('users')
      .update(dbUpdates)
      .eq('id', userId);

    if (error) {
      throw new Error(`[UserRepository.updateProfile] ${error.message}`);
    }
  }

  /**
   * Assign or sync roles for a user.
   */
  async setRoles(userId: string, roles: UserRoleType[], assignedByAdminId?: string): Promise<void> {
    // Delete existing roles
    const { error: delError } = await adminSupabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (delError) throw new Error(`[UserRepository.setRoles delete] ${delError.message}`);

    if (roles.length === 0) return;

    // Insert new roles
    const toInsert = roles.map((r) => ({
      user_id: userId,
      role_id: r,
      assigned_by: assignedByAdminId || null,
    }));

    const { error: insError } = await adminSupabase
      .from('user_roles')
      .insert(toInsert);

    if (insError) throw new Error(`[UserRepository.setRoles insert] ${insError.message}`);
  }

  /**
   * Create a new user manually from admin console.
   */
  async createUser(data: {
    email: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    country?: string;
    timezone?: string;
    roles?: UserRoleType[];
  }, adminId?: string): Promise<string> {
    const { data: newUser, error } = await adminSupabase
      .from('users')
      .insert({
        email: data.email.toLowerCase().trim(),
        display_name: data.displayName.trim(),
        first_name: data.firstName || data.displayName.split(' ')[0],
        last_name: data.lastName || data.displayName.split(' ').slice(1).join(' '),
        country: data.country || 'United States',
        timezone: data.timezone || 'America/New_York',
        status: 'ACTIVE',
      })
      .select('id')
      .single();

    if (error || !newUser) {
      throw new Error(`[UserRepository.createUser] ${error?.message || 'Failed to create user'}`);
    }

    const roles = data.roles && data.roles.length > 0 ? data.roles : ['STUDENT' as UserRoleType];
    await this.setRoles(newUser.id, roles, adminId);

    // If STUDENT role is assigned, create initial student_profile
    if (roles.includes('STUDENT' as UserRoleType)) {
      try {
        await adminSupabase.from('student_profiles').insert({
          user_id: newUser.id,
        });
      } catch {}
    }

    return newUser.id;
  }
}

export const userRepository = new UserRepository();
