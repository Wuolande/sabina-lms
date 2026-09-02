import { adminSupabase } from '../database/supabase';

export interface PlatformPolicies {
  platformFeePercent: number;
  cancellationRefundHours: number;
  classroomEarlyJoinMinutes: number;
  tutorMinHourlyRate: number;
  tutorMaxHourlyRate: number;
  instantBookingEnabled: boolean;
  autoApproveVerifiedTutors: boolean;
  trialLessonDiscountPercent: number;
}

const DEFAULT_POLICIES: PlatformPolicies = {
  platformFeePercent: 18.0,
  cancellationRefundHours: 24,
  classroomEarlyJoinMinutes: 15,
  tutorMinHourlyRate: 15.0,
  tutorMaxHourlyRate: 250.0,
  instantBookingEnabled: true,
  autoApproveVerifiedTutors: false,
  trialLessonDiscountPercent: 30.0,
};

export async function getPlatformPolicies(): Promise<PlatformPolicies> {
  try {
    const { data, error } = await adminSupabase
      .from('platform_policy_settings')
      .select('*')
      .eq('id', 'default')
      .single();

    if (error) {
      console.warn('[getPlatformPolicies] Failed to fetch policies, using defaults:', error.message);
      return DEFAULT_POLICIES;
    }

    return {
      platformFeePercent: Number(data.platform_fee_percent) || DEFAULT_POLICIES.platformFeePercent,
      cancellationRefundHours: Number(data.cancellation_refund_hours) || DEFAULT_POLICIES.cancellationRefundHours,
      classroomEarlyJoinMinutes: Number(data.classroom_early_join_minutes) || DEFAULT_POLICIES.classroomEarlyJoinMinutes,
      tutorMinHourlyRate: Number(data.tutor_min_hourly_rate) || DEFAULT_POLICIES.tutorMinHourlyRate,
      tutorMaxHourlyRate: Number(data.tutor_max_hourly_rate) || DEFAULT_POLICIES.tutorMaxHourlyRate,
      instantBookingEnabled: data.instant_booking_enabled ?? DEFAULT_POLICIES.instantBookingEnabled,
      autoApproveVerifiedTutors: data.auto_approve_verified_tutors ?? DEFAULT_POLICIES.autoApproveVerifiedTutors,
      trialLessonDiscountPercent: Number(data.trial_lesson_discount_percent) || DEFAULT_POLICIES.trialLessonDiscountPercent,
    };
  } catch (err) {
    console.error('[getPlatformPolicies] Exception fetching policies:', err);
    return DEFAULT_POLICIES;
  }
}
