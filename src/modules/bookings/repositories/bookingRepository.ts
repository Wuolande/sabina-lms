/**
 * Booking Repository — Data Access for Bookings & PostgreSQL Transactions
 * -----------------------------------------------------------------------
 */

import { adminSupabase } from '@/src/shared/database/supabase';
import { Booking360Aggregate, BookingListItem, CreateBookingPayload } from '../domain/types';
import { BookingStatus } from '@/types';

export class BookingRepository {
  /**
   * Find bookings with status filter, date range, search, and pagination.
   */
  async findAll(options: {
    status?: string;
    studentId?: string;
    tutorId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: BookingListItem[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(options.limit || 20, 100);
    const offset = (page - 1) * limit;

    let query = adminSupabase
      .from('bookings')
      .select(
        `
        id, booking_ref, start_time, end_time, duration_minutes, price, currency,
        status, payment_status, payment_method, video_room_id, meeting_link, created_at,
        subject_name,
        student:users!student_id(id, display_name, email, avatar_url),
        tutor:tutor_profiles!tutor_id(id, user:users!user_id(display_name, avatar_url))
      `,
        { count: 'exact' }
      );

    if (options.status && options.status !== 'ALL') {
      query = query.eq('status', options.status);
    }
    if (options.studentId) {
      query = query.eq('student_id', options.studentId);
    }
    if (options.tutorId) {
      query = query.eq('tutor_id', options.tutorId);
    }
    if (options.search) {
      const q = options.search.trim();
      query = query.or(`booking_ref.ilike.%${q}%,subject_name.ilike.%${q}%`);
    }

    const { data, count, error } = await query
      .order('start_time', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`[BookingRepository.findAll] ${error.message}`);
    }

    const mapped: BookingListItem[] = (data || []).map((b: any) => ({
      id: b.id,
      bookingRef: b.booking_ref,
      studentId: b.student?.id,
      studentName: b.student?.display_name || 'Student',
      studentEmail: b.student?.email || '',
      studentAvatar: b.student?.avatar_url,
      tutorId: b.tutor?.id,
      tutorName: b.tutor?.user?.display_name || 'Tutor',
      tutorAvatar: b.tutor?.user?.avatar_url,
      subjectName: b.subject_name || 'General',
      startTime: b.start_time,
      endTime: b.end_time,
      durationMinutes: b.duration_minutes,
      price: Number(b.price),
      currency: b.currency || 'USD',
      status: b.status as BookingStatus,
      paymentStatus: b.payment_status,
      paymentMethod: b.payment_method,
      videoRoomId: b.video_room_id,
      meetingLink: b.meeting_link,
      createdAt: b.created_at,
    }));

    return {
      data: mapped,
      total: count || mapped.length,
      page,
      limit,
    };
  }

  /**
   * Get full Booking 360° aggregate via get_booking_360_aggregate PG function.
   */
  async getBooking360(bookingId: string): Promise<Booking360Aggregate | null> {
    const { data, error } = await adminSupabase.rpc('get_booking_360_aggregate', {
      p_booking_id: bookingId,
    });

    if (error) {
      throw new Error(`[BookingRepository.getBooking360] ${error.message}`);
    }
    if (!data) return null;

    return data as Booking360Aggregate;
  }

  /**
   * Atomically create both a booking and corresponding scheduled lesson.
   */
  async createBookingAtomic(payload: CreateBookingPayload): Promise<{
    bookingId: string;
    lessonId: string;
    bookingRef: string;
    videoRoomId: string;
  }> {
    const { data, error } = await adminSupabase.rpc('create_booking_atomic', {
      p_student_id: payload.studentId,
      p_tutor_id: payload.tutorId,
      p_subject_id: payload.subjectId || null,
      p_subject_name: payload.subjectName || 'General Tutoring',
      p_start_time: payload.startTime,
      p_duration_minutes: payload.durationMinutes,
      p_price: payload.price,
      p_currency: payload.currency || 'USD',
      p_payment_method: payload.paymentMethod || 'card',
      p_student_notes: payload.studentNotes || null,
    });

    if (error || !data) {
      throw new Error(`[BookingRepository.createBookingAtomic] ${error?.message || 'Atomic creation failed'}`);
    }

    return data as any;
  }

  /**
   * Cancel booking and its lesson.
   */
  async cancelBooking(bookingId: string, reason: string, cancelledByUserId: string): Promise<void> {
    // 1. Update Booking
    const { error: bError } = await adminSupabase
      .from('bookings')
      .update({
        status: 'CANCELLED',
        cancellation_reason: reason,
        cancelled_by: cancelledByUserId,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (bError) throw new Error(`[BookingRepository.cancelBooking] ${bError.message}`);

    // 2. Update Lesson
    await adminSupabase
      .from('lessons')
      .update({
        status: 'CANCELLED',
        updated_at: new Date().toISOString(),
      })
      .eq('booking_id', bookingId);
  }
}

export const bookingRepository = new BookingRepository();
