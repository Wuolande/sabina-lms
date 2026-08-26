/**
 * Tutor Repository — Active Tutor Profile Data Access
 * -----------------------------------------------------------------------
 * All data access for tutor_profiles and related tables.
 * Uses adminSupabase (service role) for all server-side queries.
 *
 * Tables queried:
 *   public.tutor_profiles      (migration 004)
 *   public.tutor_subjects      (migration 004)
 *   public.tutor_languages     (migration 004)
 *   public.tutor_educations    (migration 004)
 *   public.tutor_certifications(migration 004)
 *   public.tutor_experiences   (migration 004)
 *   public.users               (migration 001)
 *   public.audit_logs          (migration 002) — via get_tutor_360_aggregate()
 *
 * The get_tutor_360_aggregate(tutor_id) PostgreSQL function (migration 006)
 * returns a single JSONB document joining all 9 sections in one DB round-trip.
 *
 * Migration note: Only .env.local keys need to change when migrating projects.
 * -----------------------------------------------------------------------
 */

import { adminSupabase } from '@/src/shared/database/supabase';
import { Tutor360Aggregate, TutorAccountStatus } from '../domain/types';

export interface TutorListItem {
  id: string;
  userId: string;
  slug: string;
  headline: string;
  hourlyRate: number;
  currency: string;
  averageRating: number;
  reviewCount: number;
  totalLessons: number;
  totalStudents: number;
  accountStatus: TutorAccountStatus;
  isFeatured: boolean;
  isSuperTutor: boolean;
  subjects: Array<{ name: string; isPrimary: boolean }>;
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    country?: string;
  };
}

export interface TutorListResult {
  data: TutorListItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export class TutorRepository {
  /**
   * List active tutors with pagination, status and search filters.
   */
  async findAll(options: {
    status?: string;
    search?: string;
    subject?: string;
    isFeatured?: boolean;
    isSuperTutor?: boolean;
    page?: number;
    limit?: number;
  }): Promise<TutorListResult> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(options.limit || 20, 100);
    const offset = (page - 1) * limit;

    let query = adminSupabase
      .from('tutor_profiles')
      .select(
        `
        id, user_id, slug, headline, hourly_rate, currency,
        average_rating, review_count, total_lessons, total_students,
        account_status, is_featured, is_super_tutor,
        user:users!user_id(id, email, display_name, avatar_url, country),
        subjects:tutor_subjects(
          is_primary,
          subject:subjects(name)
        )
      `,
        { count: 'exact' }
      );

    if (options.status) {
      query = query.eq('account_status', options.status);
    }
    if (options.isFeatured !== undefined) {
      query = query.eq('is_featured', options.isFeatured);
    }
    if (options.isSuperTutor !== undefined) {
      query = query.eq('is_super_tutor', options.isSuperTutor);
    }
    if (options.search) {
      const q = options.search.trim();
      query = query.or(`headline.ilike.%${q}%,bio.ilike.%${q}%`);
    }

    const { data, count, error } = await query
      .order('is_featured', { ascending: false })
      .order('average_rating', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`[TutorRepository.findAll] ${error.message}`);
    }

    const mapped: TutorListItem[] = (data || []).map((d: any) => ({
      id: d.id,
      userId: d.user_id,
      slug: d.slug,
      headline: d.headline,
      hourlyRate: Number(d.hourly_rate),
      currency: d.currency,
      averageRating: Number(d.average_rating),
      reviewCount: d.review_count || 0,
      totalLessons: d.total_lessons || 0,
      totalStudents: d.total_students || 0,
      accountStatus: d.account_status,
      isFeatured: Boolean(d.is_featured),
      isSuperTutor: Boolean(d.is_super_tutor),
      subjects: (d.subjects || []).map((s: any) => ({
        name: s.subject?.name || 'Subject',
        isPrimary: Boolean(s.is_primary),
      })),
      user: {
        id: d.user?.id,
        email: d.user?.email || '',
        displayName: d.user?.display_name || 'Tutor',
        avatarUrl: d.user?.avatar_url || undefined,
        country: d.user?.country || undefined,
      },
    }));

    return {
      data: mapped,
      total: count || 0,
      page,
      limit,
      hasMore: offset + limit < (count || 0),
    };
  }

  /**
   * Get full Tutor 360° aggregate using the PostgreSQL function.
   * Joins all 9 sections (profile, user, subjects, languages, education,
   * certifications, experiences, certifications, audit trail) in ONE round-trip.
   *
   * Calls: public.get_tutor_360_aggregate(p_tutor_id) — migration 006.
   */
  async getTutor360(id: string): Promise<Tutor360Aggregate | null> {
    const { data, error } = await adminSupabase.rpc('get_tutor_360_aggregate', {
      p_tutor_id: id,
    });

    if (error) {
      throw new Error(`[TutorRepository.getTutor360] ${error.message}`);
    }
    if (!data) return null;

    // The PG function returns a JSONB object — map camelCase fields
    return data as Tutor360Aggregate;
  }

  /**
   * Update specific fields on a tutor profile.
   */
  async updateProfile(
    id: string,
    updates: {
      hourlyRate?: number;
      isFeatured?: boolean;
      isSuperTutor?: boolean;
      accountStatus?: TutorAccountStatus;
      suspensionReason?: string | null;
      suspendedAt?: string | null;
      suspendedBy?: string | null;
    }
  ): Promise<void> {
    const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() };

    if (updates.hourlyRate !== undefined) dbUpdates.hourly_rate = updates.hourlyRate;
    if (updates.isFeatured !== undefined) dbUpdates.is_featured = updates.isFeatured;
    if (updates.isSuperTutor !== undefined) dbUpdates.is_super_tutor = updates.isSuperTutor;
    if (updates.accountStatus !== undefined) dbUpdates.account_status = updates.accountStatus;
    if (updates.suspensionReason !== undefined) dbUpdates.suspension_reason = updates.suspensionReason;
    if (updates.suspendedAt !== undefined) dbUpdates.suspended_at = updates.suspendedAt;
    if (updates.suspendedBy !== undefined) dbUpdates.suspended_by = updates.suspendedBy;

    const { error } = await adminSupabase
      .from('tutor_profiles')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      throw new Error(`[TutorRepository.updateProfile] ${error.message}`);
    }
  }

  /**
   * Update account status (suspend/reactivate).
   * Kept as a specific method for clarity.
   */
  async updateStatus(
    id: string,
    status: TutorAccountStatus,
    reason?: string,
    adminId?: string
  ): Promise<void> {
    await this.updateProfile(id, {
      accountStatus: status,
      suspensionReason: status === 'SUSPENDED' ? (reason || null) : null,
      suspendedAt: status === 'SUSPENDED' ? new Date().toISOString() : null,
      suspendedBy: status === 'SUSPENDED' ? (adminId || null) : null,
    });
  }

  /**
   * Get full public profile aggregate using get_tutor_public_profile (migration 016).
   */
  async getPublicProfile(slugOrId: string): Promise<any | null> {
    const { data, error } = await adminSupabase.rpc('get_tutor_public_profile', {
      p_slug_or_id: slugOrId,
    });

    if (error) {
      throw new Error(`[TutorRepository.getPublicProfile] ${error.message}`);
    }
    return data;
  }

  /**
   * Atomically update public profile, user info, and credentials.
   */
  async updatePublicProfileAtomic(tutorProfileId: string, payload: any): Promise<any> {
    const { data, error } = await adminSupabase.rpc('update_tutor_public_profile_atomic', {
      p_tutor_id: tutorProfileId,
      p_payload: payload,
    });

    if (error) {
      throw new Error(`[TutorRepository.updatePublicProfileAtomic] ${error.message}`);
    }
    return data;
  }

  /**
   * Get full settings aggregate using get_tutor_settings_360 (migration 018).
   */
  async getSettings(tutorProfileId: string): Promise<any | null> {
    const { data, error } = await adminSupabase.rpc('get_tutor_settings_360', {
      p_tutor_id: tutorProfileId,
    });

    if (error) {
      throw new Error(`[TutorRepository.getSettings] ${error.message}`);
    }
    return data;
  }

  /**
   * Atomically update settings, pricing, package discounts, and payout preferences.
   */
  async updateSettingsAtomic(tutorProfileId: string, payload: any): Promise<any> {
    const { data, error } = await adminSupabase.rpc('update_tutor_settings_atomic', {
      p_tutor_id: tutorProfileId,
      p_payload: payload,
    });

    if (error) {
      throw new Error(`[TutorRepository.updateSettingsAtomic] ${error.message}`);
    }
    return data;
  }

  /**
   * Deactivate tutor account.
   */
  async deactivateAccount(tutorProfileId: string, reason: string): Promise<any> {
    const { data, error } = await adminSupabase.rpc('deactivate_tutor_account', {
      p_tutor_id: tutorProfileId,
      p_reason: reason,
    });

    if (error) {
      throw new Error(`[TutorRepository.deactivateAccount] ${error.message}`);
    }
    return data;
  }

  /**
   * Permanently delete account under GDPR Right to Erasure.
   */
  async deleteAccountGdpr(tutorProfileId: string, reason: string): Promise<any> {
    const { data, error } = await adminSupabase.rpc('delete_tutor_account_gdpr', {
      p_tutor_id: tutorProfileId,
      p_reason: reason,
    });

    if (error) {
      throw new Error(`[TutorRepository.deleteAccountGdpr] ${error.message}`);
    }
    return data;
  }

  /**
   * Export all tutor personal data under GDPR Right to Access.
   */
  async exportGdprData(tutorProfileId: string): Promise<any> {
    const { data, error } = await adminSupabase.rpc('export_tutor_gdpr_data', {
      p_tutor_id: tutorProfileId,
    });

    if (error) {
      throw new Error(`[TutorRepository.exportGdprData] ${error.message}`);
    }
    return data;
  }

  /**
   * Get tutor dashboard 360 executive aggregate using get_tutor_dashboard_360 (migration 019).
   */
  async getDashboard360(tutorProfileId: string): Promise<any | null> {
    const { data, error } = await adminSupabase.rpc('get_tutor_dashboard_360', {
      p_tutor_id: tutorProfileId,
    });

    if (error) {
      throw new Error(`[TutorRepository.getDashboard360] ${error.message}`);
    }
    return data;
  }

  /**
   * Get live admin stats from the admin_stats_view (migration 007).
   */
  async getAdminStats(): Promise<{
    totalUsers: number;
    totalStudents: number;
    totalTutors: number;
    activeTutors: number;
    pendingTutorApplications: number;
  }> {
    const { data, error } = await adminSupabase
      .from('admin_stats_view')
      .select('*')
      .single();

    if (error || !data) {
      return { totalUsers: 0, totalStudents: 0, totalTutors: 0, activeTutors: 0, pendingTutorApplications: 0 };
    }

    return {
      totalUsers: Number(data.total_users) || 0,
      totalStudents: Number(data.total_students) || 0,
      totalTutors: Number(data.total_tutors) || 0,
      activeTutors: Number(data.active_tutors) || 0,
      pendingTutorApplications: Number(data.pending_tutor_applications) || 0,
    };
  }
}

export const tutorRepository = new TutorRepository();
