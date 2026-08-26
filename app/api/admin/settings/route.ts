/**
 * API Route: GET & PUT /api/admin/settings
 * -----------------------------------------------------------------------
 * Platform Policy Settings, Take-Rate, Cancellation Windows, and Limits.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await adminSupabase
      .from('platform_policy_settings')
      .select('*')
      .eq('id', 'default')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    const defaultPolicies = {
      platformFeePercent: Number(data?.platform_fee_percent) || 18.0,
      cancellationRefundHours: data?.cancellation_refund_hours || 24,
      classroomEarlyJoinMinutes: data?.classroom_early_join_minutes || 15,
      tutorMinHourlyRate: Number(data?.tutor_min_hourly_rate) || 15.0,
      tutorMaxHourlyRate: Number(data?.tutor_max_hourly_rate) || 250.0,
      instantBookingEnabled: data?.instant_booking_enabled ?? true,
      autoApproveVerifiedTutors: data?.auto_approve_verified_tutors ?? false,
      trialLessonDiscountPercent: Number(data?.trial_lesson_discount_percent) || 30.0,
    };

    return NextResponse.json(defaultPolicies);
  } catch (error: any) {
    console.error('[GET /api/admin/settings]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const { data, error } = await adminSupabase.rpc('update_platform_policies_atomic', {
      p_platform_fee_percent: body.platformFeePercent,
      p_cancellation_refund_hours: body.cancellationRefundHours,
      p_classroom_early_join_minutes: body.classroomEarlyJoinMinutes,
      p_tutor_min_hourly_rate: body.tutorMinHourlyRate,
      p_tutor_max_hourly_rate: body.tutorMaxHourlyRate,
      p_instant_booking_enabled: body.instantBookingEnabled,
      p_auto_approve_verified_tutors: body.autoApproveVerifiedTutors,
      p_trial_lesson_discount_percent: body.trialLessonDiscountPercent,
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[PUT /api/admin/settings]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
