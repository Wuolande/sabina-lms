/**
 * Lesson Repository — Supabase Data Access for Lessons, Materials, Reviews & Availability
 * -----------------------------------------------------------------------
 */

import { adminSupabase } from '@/src/shared/database/supabase';
import {
  Lesson360Aggregate,
  LessonListItem,
  TutorAvailabilityRuleItem,
  TutorAvailabilityExceptionItem,
} from '../domain/types';
import { LessonStatus } from '@/types';

export class LessonRepository {
  /**
   * List lessons for a student or tutor.
   */
  async findLessons(options: {
    studentId?: string;
    tutorId?: string;
    status?: string;
    limit?: number;
  }): Promise<LessonListItem[]> {
    let query = adminSupabase
      .from('lessons')
      .select(`
        id, booking_id, scheduled_start, scheduled_end, actual_start, actual_end,
        status, video_room_id, lesson_notes, student_feedback, private_tutor_notes,
        has_student_reviewed,
        booking:bookings!booking_id(booking_ref, subject_name),
        student:users!student_id(id, display_name, email, avatar_url),
        tutor:tutor_profiles!tutor_id(id, slug, headline, user:users!user_id(display_name, avatar_url)),
        materials:lesson_materials(id)
      `);

    if (options.studentId) {
      query = query.eq('student_id', options.studentId);
    }
    if (options.tutorId) {
      query = query.eq('tutor_id', options.tutorId);
    }
    if (options.status && options.status !== 'ALL') {
      query = query.eq('status', options.status);
    }

    const { data, error } = await query
      .order('scheduled_start', { ascending: false })
      .limit(options.limit || 50);

    if (error) {
      throw new Error(`[LessonRepository.findLessons] ${error.message}`);
    }

    return (data || []).map((l: any) => ({
      id: l.id,
      bookingId: l.booking_id,
      bookingRef: l.booking?.booking_ref,
      studentId: l.student?.id,
      studentName: l.student?.display_name || 'Student',
      studentEmail: l.student?.email,
      studentAvatar: l.student?.avatar_url,
      tutorId: l.tutor?.id,
      tutorName: l.tutor?.user?.display_name || 'Tutor',
      tutorAvatar: l.tutor?.user?.avatar_url,
      subjectName: l.booking?.subject_name || 'General Tutoring',
      scheduledStart: l.scheduled_start,
      scheduledEnd: l.scheduled_end,
      actualStart: l.actual_start,
      actualEnd: l.actual_end,
      status: l.status as LessonStatus,
      videoRoomId: l.video_room_id,
      lessonNotes: l.lesson_notes,
      studentFeedback: l.student_feedback,
      privateTutorNotes: l.private_tutor_notes,
      hasStudentReviewed: l.has_student_reviewed || false,
      materialsCount: (l.materials || []).length,
    }));
  }

  /**
   * Get single lesson with materials and review details.
   */
  async getLessonById(lessonId: string): Promise<Lesson360Aggregate | null> {
    const { data, error } = await adminSupabase
      .from('lessons')
      .select(`
        id, booking_id, scheduled_start, scheduled_end, actual_start, actual_end,
        status, video_room_id, lesson_notes, student_feedback, private_tutor_notes,
        has_student_reviewed, created_at,
        booking:bookings!booking_id(booking_ref, subject_name),
        student:users!student_id(id, display_name, email, avatar_url, country, timezone),
        tutor:tutor_profiles!tutor_id(id, slug, headline, hourly_rate, currency, user:users!user_id(display_name, avatar_url)),
        materials:lesson_materials(id, name, size_bytes, file_type, url, uploaded_by_role, created_at),
        review:lesson_reviews(id, rating, comment, created_at)
      `)
      .eq('id', lessonId)
      .single();

    if (error || !data) return null;

    const reviewObj = Array.isArray(data.review) ? data.review[0] : data.review;

    return {
      id: data.id,
      bookingId: data.booking_id,
      bookingRef: (data.booking as any)?.booking_ref || 'BK-LIVE',
      scheduledStart: data.scheduled_start,
      scheduledEnd: data.scheduled_end,
      actualStart: data.actual_start,
      actualEnd: data.actual_end,
      status: data.status as LessonStatus,
      videoRoomId: data.video_room_id,
      lessonNotes: data.lesson_notes,
      studentFeedback: data.student_feedback,
      privateTutorNotes: data.private_tutor_notes,
      hasStudentReviewed: data.has_student_reviewed || false,
      createdAt: data.created_at,
      student: {
        id: (data.student as any)?.id,
        displayName: (data.student as any)?.display_name || 'Student',
        email: (data.student as any)?.email,
        avatarUrl: (data.student as any)?.avatar_url,
        country: (data.student as any)?.country,
        timezone: (data.student as any)?.timezone,
      },
      tutor: {
        id: (data.tutor as any)?.id,
        slug: (data.tutor as any)?.slug,
        headline: (data.tutor as any)?.headline,
        hourlyRate: Number((data.tutor as any)?.hourly_rate) || 0,
        currency: (data.tutor as any)?.currency || 'USD',
        displayName: (data.tutor as any)?.user?.display_name || 'Tutor',
        avatarUrl: (data.tutor as any)?.user?.avatar_url,
      },
      subject: {
        name: (data.booking as any)?.subject_name || 'General',
      },
      materials: (data.materials || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        sizeBytes: Number(m.size_bytes) || 0,
        fileType: m.file_type || 'file',
        url: m.url,
        uploadedByRole: m.uploaded_by_role,
        createdAt: m.created_at,
      })),
      review: reviewObj ? {
        id: reviewObj.id,
        rating: reviewObj.rating,
        comment: reviewObj.comment,
        createdAt: reviewObj.created_at,
      } : undefined,
    };
  }

  /**
   * Complete lesson atomically with stats incrementation.
   */
  async completeLessonAtomic(
    lessonId: string,
    studentFeedback?: string,
    privateNotes?: string
  ): Promise<any> {
    const { data, error } = await adminSupabase.rpc('complete_lesson_atomic', {
      p_lesson_id: lessonId,
      p_actual_end: new Date().toISOString(),
      p_student_feedback: studentFeedback || null,
      p_private_notes: privateNotes || null,
    });

    if (error) {
      throw new Error(`[LessonRepository.completeLessonAtomic] ${error.message}`);
    }

    return data;
  }

  /**
   * Upload and attach material to a lesson.
   */
  async attachMaterial(
    lessonId: string,
    material: {
      name: string;
      sizeBytes?: number;
      fileType?: string;
      url: string;
      uploadedByUserId: string;
      uploadedByRole: 'TUTOR' | 'STUDENT' | 'ADMIN';
    }
  ) {
    const { data, error } = await adminSupabase
      .from('lesson_materials')
      .insert({
        lesson_id: lessonId,
        name: material.name,
        size_bytes: material.sizeBytes || 0,
        file_type: material.fileType || 'application/octet-stream',
        url: material.url,
        uploaded_by_user_id: material.uploadedByUserId,
        uploaded_by_role: material.uploadedByRole,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`[LessonRepository.attachMaterial] ${error?.message || 'Upload failed'}`);
    }

    return data;
  }

  /**
   * Submit post-lesson review from student.
   */
  async submitReview(
    lessonId: string,
    studentId: string,
    tutorId: string,
    rating: number,
    comment?: string
  ) {
    const { data, error } = await adminSupabase
      .from('lesson_reviews')
      .insert({
        lesson_id: lessonId,
        student_id: studentId,
        tutor_id: tutorId,
        rating: Math.min(5, Math.max(1, rating)),
        comment: comment?.trim() || null,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`[LessonRepository.submitReview] ${error.message}`);
    }

    // Mark lesson as reviewed
    await adminSupabase
      .from('lessons')
      .update({ has_student_reviewed: true })
      .eq('id', lessonId);

    // Recalculate tutor's average rating
    const { data: reviews } = await adminSupabase
      .from('lesson_reviews')
      .select('rating')
      .eq('tutor_id', tutorId);

    if (reviews && reviews.length > 0) {
      const avg = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
      await adminSupabase
        .from('tutor_profiles')
        .update({
          average_rating: Math.round(avg * 10) / 10,
          review_count: reviews.length,
        })
        .eq('id', tutorId);
    }

    return data;
  }

  /**
   * Fetch tutor's availability rules.
   */
  async getTutorAvailability(tutorProfileId: string): Promise<TutorAvailabilityRuleItem[]> {
    const { data, error } = await adminSupabase
      .from('tutor_availability_rules')
      .select('*')
      .eq('tutor_id', tutorProfileId)
      .order('day_of_week', { ascending: true });

    if (error) {
      throw new Error(`[LessonRepository.getTutorAvailability] ${error.message}`);
    }

    return (data || []).map((r: any) => ({
      id: r.id,
      tutorId: r.tutor_id,
      dayOfWeek: r.day_of_week,
      startTime: r.start_time,
      endTime: r.end_time,
      isActive: r.is_active,
    }));
  }

  /**
   * Save recurring weekly availability rules for a tutor.
   */
  /**
   * Save recurring weekly availability rules for a tutor atomically with multi-slot support.
   */
  async saveTutorAvailability(
    tutorProfileId: string,
    rules: Array<{ dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }>
  ): Promise<void> {
    const { error } = await adminSupabase.rpc('save_tutor_availability_atomic', {
      p_tutor_id: tutorProfileId,
      p_rules: rules as any,
    });

    if (error) {
      throw new Error(`[LessonRepository.saveTutorAvailability] ${error.message}`);
    }
  }

  /**
   * Get full Tutor Schedule 360 aggregate using get_tutor_schedule_360 PG function.
   */
  async getTutorSchedule360(tutorProfileId: string) {
    const { data, error } = await adminSupabase.rpc('get_tutor_schedule_360', {
      p_tutor_id: tutorProfileId,
    });

    if (error) {
      throw new Error(`[LessonRepository.getTutorSchedule360] ${error.message}`);
    }
    return data;
  }

  /**
   * Save buffer minutes, notice hours, and advance booking window.
   */
  async saveScheduleSettings(
    tutorProfileId: string,
    settings: {
      bufferMinutes?: number;
      minNoticeHours?: number;
      maxAdvanceDays?: number;
      defaultLessonDuration?: number;
    }
  ): Promise<void> {
    const payload: Record<string, any> = {
      tutor_id: tutorProfileId,
      updated_at: new Date().toISOString(),
    };
    if (settings.bufferMinutes !== undefined) payload.buffer_minutes = settings.bufferMinutes;
    if (settings.minNoticeHours !== undefined) payload.min_notice_hours = settings.minNoticeHours;
    if (settings.maxAdvanceDays !== undefined) payload.max_advance_days = settings.maxAdvanceDays;
    if (settings.defaultLessonDuration !== undefined) payload.default_lesson_duration = settings.defaultLessonDuration;

    const { error } = await adminSupabase
      .from('tutor_schedule_settings')
      .upsert(payload, { onConflict: 'tutor_id' });

    if (error) {
      throw new Error(`[LessonRepository.saveScheduleSettings] ${error.message}`);
    }
  }

  /**
   * Add a date-specific vacation or time-off exception.
   */
  async addTimeOffException(
    tutorProfileId: string,
    exception: {
      date: string;
      isBlocked?: boolean;
      startTime?: string;
      endTime?: string;
      reason?: string;
    }
  ) {
    const { data, error } = await adminSupabase
      .from('tutor_availability_exceptions')
      .insert({
        tutor_id: tutorProfileId,
        date: exception.date,
        is_blocked: exception.isBlocked !== false,
        start_time: exception.startTime || null,
        end_time: exception.endTime || null,
        reason: exception.reason?.trim() || null,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`[LessonRepository.addTimeOffException] ${error?.message || 'Insert failed'}`);
    }

    return data;
  }

  /**
   * Delete a time-off exception.
   */
  async deleteTimeOffException(exceptionId: string, tutorProfileId: string): Promise<void> {
    const { error } = await adminSupabase
      .from('tutor_availability_exceptions')
      .delete()
      .eq('id', exceptionId)
      .eq('tutor_id', tutorProfileId);

    if (error) {
      throw new Error(`[LessonRepository.deleteTimeOffException] ${error.message}`);
    }
  }

  /**
   * Get full Tutor Lesson 360 aggregate.
   */
  async getTutorLesson360(lessonId: string, tutorProfileId: string) {
    const { data, error } = await adminSupabase.rpc('get_tutor_lesson_360', {
      p_lesson_id: lessonId,
      p_tutor_id: tutorProfileId,
    });

    if (error) {
      throw new Error(`[LessonRepository.getTutorLesson360] ${error.message}`);
    }
    return data;
  }

  /**
   * Update lesson curriculum topic, homework, private notes, and student feedback.
   */
  async updateLessonWorkspace(
    lessonId: string,
    tutorProfileId: string,
    payload: {
      curriculumTopic?: string;
      homeworkAssigned?: string;
      homeworkDueDate?: string;
      privateTutorNotes?: string;
      studentFeedback?: string;
    }
  ) {
    const updateData: Record<string, any> = {};
    if (payload.curriculumTopic !== undefined) updateData.curriculum_topic = payload.curriculumTopic;
    if (payload.homeworkAssigned !== undefined) updateData.homework_assigned = payload.homeworkAssigned;
    if (payload.homeworkDueDate !== undefined) updateData.homework_due_date = payload.homeworkDueDate || null;
    if (payload.privateTutorNotes !== undefined) updateData.private_tutor_notes = payload.privateTutorNotes;
    if (payload.studentFeedback !== undefined) updateData.student_feedback = payload.studentFeedback;

    const { data, error } = await adminSupabase
      .from('lessons')
      .update(updateData)
      .eq('id', lessonId)
      .eq('tutor_id', tutorProfileId)
      .select('*')
      .single();

    if (error) {
      throw new Error(`[LessonRepository.updateLessonWorkspace] ${error.message}`);
    }
    return data;
  }

  /**
   * Delete attached lesson material.
   */
  async deleteMaterial(materialId: string, lessonId: string) {
    const { error } = await adminSupabase
      .from('lesson_materials')
      .delete()
      .eq('id', materialId)
      .eq('lesson_id', lessonId);

    if (error) {
      throw new Error(`[LessonRepository.deleteMaterial] ${error.message}`);
    }
  }

  /**
   * Get complete tutor reviews aggregate and items list.
   */
  async getTutorReviews360(tutorProfileId: string) {
    const { data, error } = await adminSupabase.rpc('get_tutor_reviews_360', {
      p_tutor_id: tutorProfileId,
    });

    if (error) {
      throw new Error(`[LessonRepository.getTutorReviews360] ${error.message}`);
    }
    return data;
  }

  /**
   * Post tutor reply to student review atomically and generate notification.
   */
  async replyToReviewAtomic(reviewId: string, tutorProfileId: string, reply: string) {
    const { data, error } = await adminSupabase.rpc('reply_to_review_atomic', {
      p_review_id: reviewId,
      p_tutor_id: tutorProfileId,
      p_reply: reply.trim(),
    });

    if (error) {
      throw new Error(`[LessonRepository.replyToReviewAtomic] ${error.message}`);
    }
    return data;
  }

  /**
   * Post tutor reply to student review (by lessonId).
   */
  async replyToReview(lessonId: string, reply: string) {
    const { data, error } = await adminSupabase
      .from('lesson_reviews')
      .update({
        tutor_reply: reply.trim(),
        tutor_replied_at: new Date().toISOString(),
      })
      .eq('lesson_id', lessonId)
      .select('*')
      .single();

    if (error) {
      throw new Error(`[LessonRepository.replyToReview] ${error.message}`);
    }
    return data;
  }

  /**
   * Get student lessons list using get_student_lessons_list (migration 020).
   */
  async getStudentLessonsList(studentId: string): Promise<any[]> {
    const { data, error } = await adminSupabase.rpc('get_student_lessons_list', {
      p_student_id: studentId,
    });

    if (error) {
      throw new Error(`[LessonRepository.getStudentLessonsList] ${error.message}`);
    }
    return data || [];
  }

  /**
   * Get student lesson 360 using get_student_lesson_360 (migration 020).
   */
  async getStudentLesson360(lessonId: string, studentId: string): Promise<any | null> {
    const { data, error } = await adminSupabase.rpc('get_student_lesson_360', {
      p_lesson_id: lessonId,
      p_student_id: studentId,
    });

    if (error) {
      throw new Error(`[LessonRepository.getStudentLesson360] ${error.message}`);
    }
    return data;
  }

  /**
   * Submit student homework notes using submit_student_homework_notes (migration 020).
   */
  async submitStudentHomeworkNotes(lessonId: string, studentId: string, notes: string): Promise<any> {
    const { data, error } = await adminSupabase.rpc('submit_student_homework_notes', {
      p_lesson_id: lessonId,
      p_student_id: studentId,
      p_notes: notes,
    });

    if (error) {
      throw new Error(`[LessonRepository.submitStudentHomeworkNotes] ${error.message}`);
    }
    return data;
  }
}

export const lessonRepository = new LessonRepository();

