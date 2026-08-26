/**
 * Student Repository — Student Learning & Progress Data Access
 * -----------------------------------------------------------------------
 * Connects to student_profiles, student_learning_goals, student_favorite_tutors,
 * and student_tutor_enrollments in Supabase.
 * -----------------------------------------------------------------------
 */

import { adminSupabase } from '@/src/shared/database/supabase';
import { Student360Aggregate, LearningGoalItem, StudentProfileUpdatePayload } from '../domain/types';

export class StudentRepository {
  /**
   * Fetch full Student 360 Aggregate using get_student_360_aggregate PG function.
   */
  async getStudent360(studentUserId: string): Promise<Student360Aggregate | null> {
    const { data, error } = await adminSupabase.rpc('get_student_360_aggregate', {
      p_student_id: studentUserId,
    });

    if (error) {
      throw new Error(`[StudentRepository.getStudent360] ${error.message}`);
    }
    if (!data) return null;

    return data as Student360Aggregate;
  }

  /**
   * Upsert or update a student profile record.
   */
  async upsertProfile(studentUserId: string, updates: StudentProfileUpdatePayload): Promise<void> {
    // 1. Update basic user table info if provided
    const userUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (updates.displayName) userUpdates.display_name = updates.displayName;
    if (updates.country) userUpdates.country = updates.country;
    if (updates.timezone) userUpdates.timezone = updates.timezone;
    if (updates.preferredLanguage) userUpdates.preferred_language = updates.preferredLanguage;
    if (updates.phone) userUpdates.phone = updates.phone;

    if (Object.keys(userUpdates).length > 1) {
      await adminSupabase.from('users').update(userUpdates).eq('id', studentUserId);
    }

    // 2. Upsert student_profiles row
    const profileUpdates: Record<string, any> = {
      user_id: studentUserId,
      updated_at: new Date().toISOString(),
    };
    if (updates.targetExam !== undefined) profileUpdates.target_exam = updates.targetExam;
    if (updates.currentLevel !== undefined) profileUpdates.current_level = updates.currentLevel;
    if (updates.weeklyStudyHoursTarget !== undefined) profileUpdates.weekly_study_hours_target = updates.weeklyStudyHoursTarget;

    const { error } = await adminSupabase
      .from('student_profiles')
      .upsert(profileUpdates, { onConflict: 'user_id' });

    if (error) {
      throw new Error(`[StudentRepository.upsertProfile] ${error.message}`);
    }
  }

  /**
   * Add a new learning goal for a student.
   */
  async addLearningGoal(studentUserId: string, goal: {
    title: string;
    description?: string;
    subjectId?: string;
    subjectName?: string;
    targetDate?: string;
  }): Promise<LearningGoalItem> {
    const { data, error } = await adminSupabase
      .from('student_learning_goals')
      .insert({
        student_id: studentUserId,
        title: goal.title.trim(),
        description: goal.description?.trim() || null,
        subject_id: goal.subjectId || null,
        subject_name: goal.subjectName || 'General Learning',
        target_date: goal.targetDate || null,
        progress_percent: 0,
        status: 'IN_PROGRESS',
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`[StudentRepository.addLearningGoal] ${error?.message || 'Insert failed'}`);
    }

    return {
      id: data.id,
      studentId: data.student_id,
      subjectId: data.subject_id,
      subjectName: data.subject_name || 'General',
      title: data.title,
      description: data.description,
      targetDate: data.target_date,
      progressPercent: data.progress_percent,
      status: data.status,
      createdAt: data.created_at,
    };
  }

  /**
   * Update progress percentage on a learning goal.
   */
  async updateGoalProgress(goalId: string, progressPercent: number, studentUserId?: string): Promise<void> {
    const pct = Math.min(100, Math.max(0, progressPercent));
    const status = pct === 100 ? 'COMPLETED' : 'IN_PROGRESS';

    let query = adminSupabase
      .from('student_learning_goals')
      .update({
        progress_percent: pct,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId);

    if (studentUserId) {
      query = query.eq('student_id', studentUserId);
    }

    const { error } = await query;
    if (error) {
      throw new Error(`[StudentRepository.updateGoalProgress] ${error.message}`);
    }
  }

  /**
   * Delete a learning goal.
   */
  async deleteGoal(goalId: string, studentUserId?: string): Promise<void> {
    let query = adminSupabase
      .from('student_learning_goals')
      .delete()
      .eq('id', goalId);

    if (studentUserId) {
      query = query.eq('student_id', studentUserId);
    }

    const { error } = await query;
    if (error) {
      throw new Error(`[StudentRepository.deleteGoal] ${error.message}`);
    }
  }

  /**
   * Toggle a tutor favorite for a student. Returns true if favorited, false if removed.
   */
  async toggleFavoriteTutor(studentUserId: string, tutorProfileId: string): Promise<boolean> {
    // Check if exists
    const { data: existing } = await adminSupabase
      .from('student_favorite_tutors')
      .select('student_id')
      .eq('student_id', studentUserId)
      .eq('tutor_profile_id', tutorProfileId)
      .single();

    if (existing) {
      await adminSupabase
        .from('student_favorite_tutors')
        .delete()
        .eq('student_id', studentUserId)
        .eq('tutor_profile_id', tutorProfileId);
      return false;
    } else {
      await adminSupabase
        .from('student_favorite_tutors')
        .insert({ student_id: studentUserId, tutor_profile_id: tutorProfileId });
      return true;
    }
  }

  /**
   * Get enrolled students for a tutor (used in Tutor portal).
   */
  async getStudentsForTutor(tutorProfileId: string) {
    const { data, error } = await adminSupabase
      .from('student_tutor_enrollments')
      .select(`
        total_lessons_together,
        total_hours_together,
        first_lesson_at,
        last_lesson_at,
        private_tutor_notes,
        student:users!student_id(
          id, email, display_name, avatar_url, country, timezone,
          studentProfile:student_profiles(target_exam, current_level, learning_streak_days)
        )
      `)
      .eq('tutor_id', tutorProfileId)
      .order('last_lesson_at', { ascending: false });

    if (error) {
      throw new Error(`[StudentRepository.getStudentsForTutor] ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      studentId: row.student?.id,
      displayName: row.student?.display_name || 'Student',
      email: row.student?.email,
      avatarUrl: row.student?.avatar_url,
      country: row.student?.country || 'Global',
      timezone: row.student?.timezone || 'UTC',
      targetExam: row.student?.studentProfile?.[0]?.target_exam,
      currentLevel: row.student?.studentProfile?.[0]?.current_level,
      totalLessonsTogether: row.total_lessons_together || 0,
      totalHoursTogether: Number(row.total_hours_together) || 0,
      firstLessonAt: row.first_lesson_at,
      lastLessonAt: row.last_lesson_at,
      privateTutorNotes: row.private_tutor_notes || '',
    }));
  }

  /**
   * Save private tutor notes for a student.
   */
  async updateTutorPrivateNotes(studentUserId: string, tutorProfileId: string, notes: string): Promise<void> {
    const { error } = await adminSupabase
      .from('student_tutor_enrollments')
      .update({
        private_tutor_notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq('student_id', studentUserId)
      .eq('tutor_id', tutorProfileId);

    if (error) {
      throw new Error(`[StudentRepository.updateTutorPrivateNotes] ${error.message}`);
    }
  }

  /**
   * Get full Student 360 aggregate for tutor inspection.
   */
  async getTutorStudent360(tutorProfileId: string, studentId: string) {
    const { data, error } = await adminSupabase.rpc('get_tutor_student_360', {
      p_tutor_id: tutorProfileId,
      p_student_id: studentId,
    });

    if (error) {
      throw new Error(`[StudentRepository.getTutorStudent360] ${error.message}`);
    }
    return data;
  }

  /**
   * Update enrollment notes, roadmap, and status.
   */
  async updateStudentEnrollmentFull(
    tutorProfileId: string,
    studentId: string,
    payload: {
      privateTutorNotes?: string;
      tutorRoadmap?: string;
      targetLevel?: string;
      status?: string;
    }
  ) {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (payload.privateTutorNotes !== undefined) updateData.private_tutor_notes = payload.privateTutorNotes;
    if (payload.tutorRoadmap !== undefined) updateData.tutor_roadmap = payload.tutorRoadmap;
    if (payload.targetLevel !== undefined) updateData.target_level = payload.targetLevel;
    if (payload.status !== undefined) updateData.status = payload.status;

    const { data, error } = await adminSupabase
      .from('student_tutor_enrollments')
      .update(updateData)
      .eq('tutor_id', tutorProfileId)
      .eq('student_id', studentId)
      .select('*')
      .single();

    if (error) {
      throw new Error(`[StudentRepository.updateStudentEnrollmentFull] ${error.message}`);
    }
    return data;
  }

  /**
   * Fetch full Student Billing 360 using get_student_billing_360 (Migration 021).
   */
  async getStudentBilling360(studentUserId: string) {
    const { data, error } = await adminSupabase.rpc('get_student_billing_360', {
      p_student_id: studentUserId,
    });

    if (error) {
      throw new Error(`[StudentRepository.getStudentBilling360] ${error.message}`);
    }
    return data;
  }

  /**
   * Add a payment method for student.
   */
  async addPaymentMethod(
    studentUserId: string,
    payload: {
      cardBrand: string;
      last4: string;
      expMonth: number;
      expYear: number;
      isDefault?: boolean;
    }
  ) {
    const { data, error } = await adminSupabase.rpc('add_student_payment_method', {
      p_student_id: studentUserId,
      p_card_brand: payload.cardBrand || 'Visa',
      p_last4: payload.last4 || '4242',
      p_exp_month: payload.expMonth || 12,
      p_exp_year: payload.expYear || 2028,
      p_is_default: Boolean(payload.isDefault),
    });

    if (error) {
      throw new Error(`[StudentRepository.addPaymentMethod] ${error.message}`);
    }
    return data;
  }

  /**
   * Delete a student's payment method.
   */
  async deletePaymentMethod(studentUserId: string, methodId: string) {
    const { data, error } = await adminSupabase.rpc('delete_student_payment_method', {
      p_student_id: studentUserId,
      p_method_id: methodId,
    });

    if (error) {
      throw new Error(`[StudentRepository.deletePaymentMethod] ${error.message}`);
    }
    return data;
  }

  /**
   * Set a payment method as default.
   */
  async setDefaultPaymentMethod(studentUserId: string, methodId: string) {
    const { data, error } = await adminSupabase.rpc('set_default_payment_method', {
      p_student_id: studentUserId,
      p_method_id: methodId,
    });

    if (error) {
      throw new Error(`[StudentRepository.setDefaultPaymentMethod] ${error.message}`);
    }
    return data;
  }

  /**
   * Update student's tax/invoice billing profile.
   */
  async updateBillingProfile(
    studentUserId: string,
    payload: {
      billingName: string;
      billingEmail: string;
      taxId?: string;
      addressLine1: string;
      city: string;
      postalCode: string;
      country: string;
    }
  ) {
    const { data, error } = await adminSupabase.rpc('update_student_billing_profile', {
      p_student_id: studentUserId,
      p_billing_name: payload.billingName,
      p_billing_email: payload.billingEmail,
      p_tax_id: payload.taxId || '',
      p_address_line1: payload.addressLine1,
      p_city: payload.city,
      p_postal_code: payload.postalCode,
      p_country: payload.country,
    });

    if (error) {
      throw new Error(`[StudentRepository.updateBillingProfile] ${error.message}`);
    }
    return data;
  }

  /**
   * Get Student Settings 360 using get_student_settings_360 (Migration 022).
   */
  async getStudentSettings360(studentUserId: string) {
    const { data, error } = await adminSupabase.rpc('get_student_settings_360', {
      p_student_id: studentUserId,
    });

    if (error) {
      throw new Error(`[StudentRepository.getStudentSettings360] ${error.message}`);
    }
    return data;
  }

  /**
   * Update student settings atomically using update_student_settings_atomic (Migration 022).
   */
  async updateStudentSettingsAtomic(studentUserId: string, payload: any) {
    const { data, error } = await adminSupabase.rpc('update_student_settings_atomic', {
      p_student_id: studentUserId,
      p_payload: payload,
    });

    if (error) {
      throw new Error(`[StudentRepository.updateStudentSettingsAtomic] ${error.message}`);
    }
    return data;
  }

  /**
   * Deactivate student account.
   */
  async deactivateStudentAccount(studentUserId: string, reason: string) {
    const { data, error } = await adminSupabase.rpc('deactivate_student_account', {
      p_student_id: studentUserId,
      p_reason: reason,
    });

    if (error) {
      throw new Error(`[StudentRepository.deactivateStudentAccount] ${error.message}`);
    }
    return data;
  }

  /**
   * Delete student account permanently under GDPR Right to Erasure.
   */
  async deleteStudentAccountGdpr(studentUserId: string) {
    const { data, error } = await adminSupabase.rpc('delete_student_account_gdpr', {
      p_student_id: studentUserId,
    });

    if (error) {
      throw new Error(`[StudentRepository.deleteStudentAccountGdpr] ${error.message}`);
    }
    return data;
  }

  /**
   * Export complete student learning and financial data under GDPR Right of Access.
   */
  async exportStudentGdprData(studentUserId: string) {
    const { data, error } = await adminSupabase.rpc('export_student_gdpr_data', {
      p_student_id: studentUserId,
    });

    if (error) {
      throw new Error(`[StudentRepository.exportStudentGdprData] ${error.message}`);
    }
    return data;
  }

  /**
   * Fetch full Student Dashboard 360 using get_student_dashboard_360 (Migration 023).
   */
  async getStudentDashboard360(studentUserId: string) {
    const { data, error } = await adminSupabase.rpc('get_student_dashboard_360', {
      p_student_id: studentUserId,
    });

    if (error) {
      throw new Error(`[StudentRepository.getStudentDashboard360] ${error.message}`);
    }
    return data;
  }
}

export const studentRepository = new StudentRepository();

