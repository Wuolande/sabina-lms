/**
 * Lesson Service — Client-Side HTTP Layer
 * -----------------------------------------------------------------------
 * Connects student & tutor dashboards to real lessons, materials, reviews,
 * and live video classroom APIs.
 * -----------------------------------------------------------------------
 */

import { Lesson, LessonMaterial, AvailabilityRule } from "@/types";
import { Lesson360Aggregate, LessonListItem, TutorAvailabilityRuleItem } from "@/src/modules/lessons/domain/types";

export const lessonService = {
  /**
   * Get student's lessons list.
   */
  async getStudentLessons(status?: string): Promise<LessonListItem[]> {
    try {
      const url = status ? `/api/student/lessons?status=${status}` : '/api/student/lessons';
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  /**
   * Get upcoming lessons for dashboard.
   */
  async getUpcomingLessons(): Promise<any[]> {
    const list = await this.getStudentLessons('SCHEDULED');
    return list.map((l) => ({
      id: l.id,
      bookingId: l.bookingId,
      scheduledStart: l.scheduledStart,
      scheduledEnd: l.scheduledEnd,
      status: l.status,
      subject: { name: l.subjectName },
      tutor: {
        headline: 'Verified Educator',
        user: { displayName: l.tutorName, avatarUrl: l.tutorAvatar },
      },
    }));
  },

  /**
   * Get next lesson for dashboard hero banner.
   */
  async getNextLesson(): Promise<any | null> {
    const list = await this.getUpcomingLessons();
    return list[0] || null;
  },

  /**
   * Get tutor's lessons list.
   */
  async getTutorLessons(status?: string): Promise<LessonListItem[]> {
    try {
      const url = status && status !== 'ALL' ? `/api/tutor/lessons?status=${status}` : '/api/tutor/lessons';
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  /**
   * Get single lesson with materials and review details.
   */
  async getLessonById(id: string): Promise<Lesson360Aggregate | null> {
    try {
      const res = await fetch(`/api/student/lessons/${id}`);
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  /**
   * Get complete tutor lesson 360 workspace.
   */
  async getTutorLesson360(id: string): Promise<any | null> {
    try {
      const res = await fetch(`/api/tutor/lessons/${id}`);
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  /**
   * Update lesson curriculum topic, homework, private notes, and student feedback.
   */
  async updateLessonWorkspace(
    id: string,
    payload: {
      curriculumTopic?: string;
      homeworkAssigned?: string;
      homeworkDueDate?: string;
      privateTutorNotes?: string;
      studentFeedback?: string;
    }
  ): Promise<boolean> {
    const res = await fetch(`/api/tutor/lessons/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  },

  /**
   * Delete attached lesson material.
   */
  async deleteMaterial(lessonId: string, materialId: string): Promise<boolean> {
    const res = await fetch(`/api/tutor/lessons/${lessonId}/materials/${materialId}`, {
      method: 'DELETE',
    });
    return res.ok;
  },

  /**
   * Reply to a student review.
   */
  async replyToReview(lessonId: string, reply: string): Promise<boolean> {
    const res = await fetch(`/api/tutor/lessons/${lessonId}/review-reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply }),
    });
    return res.ok;
  },

  /**
   * Complete lesson from live classroom or tutor dashboard.
   */
  async completeLesson(
    id: string,
    notes: { studentFeedback?: string; privateNotes?: string }
  ): Promise<boolean> {
    const res = await fetch(`/api/tutor/lessons/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notes),
    });
    return res.ok;
  },

  /**
   * Upload and attach material to a lesson.
   */
  async uploadMaterial(
    lessonId: string,
    material: { name: string; url: string; sizeBytes?: number; fileType?: string }
  ): Promise<boolean> {
    const res = await fetch(`/api/tutor/lessons/${lessonId}/materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(material),
    });
    return res.ok;
  },

  /**
   * Submit student review & rating for a completed lesson.
   */
  async submitReview(
    lessonId: string,
    tutorId: string,
    rating: number,
    comment?: string
  ): Promise<boolean> {
    const res = await fetch(`/api/student/lessons/${lessonId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tutorId, rating, comment }),
    });
    return res.ok;
  },

  /**
   * Submit student homework notes and exercise answers.
   */
  async submitStudentHomeworkNotes(
    lessonId: string,
    notes: string
  ): Promise<boolean> {
    try {
      const res = await fetch(`/api/student/lessons/${lessonId}/homework`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Get weekly availability rules for tutor.
   */
  async getTutorAvailability(): Promise<TutorAvailabilityRuleItem[]> {
    try {
      const res = await fetch('/api/tutor/availability');
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  /**
   * Save recurring weekly availability rules for tutor.
   */
  async saveTutorAvailability(rules: TutorAvailabilityRuleItem[]): Promise<boolean> {
    const res = await fetch('/api/tutor/availability', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rules }),
    });
    return res.ok;
  },

  /**
   * Get full tutor schedule 360 (settings, rules, exceptions, upcoming classes).
   */
  async getTutorSchedule360(): Promise<any | null> {
    try {
      const res = await fetch('/api/tutor/schedule');
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  /**
   * Update booking buffer, notice hours, and advance booking window.
   */
  async saveScheduleSettings(settings: {
    bufferMinutes?: number;
    minNoticeHours?: number;
    maxAdvanceDays?: number;
    defaultLessonDuration?: number;
  }): Promise<boolean> {
    const res = await fetch('/api/tutor/schedule/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.ok;
  },

  /**
   * Add a date-specific vacation or time-off exception.
   */
  async addTimeOffException(exception: {
    date: string;
    isBlocked?: boolean;
    startTime?: string;
    endTime?: string;
    reason?: string;
  }): Promise<boolean> {
    const res = await fetch('/api/tutor/schedule/exceptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exception),
    });
    return res.ok;
  },

  /**
   * Delete a date-specific vacation exception.
   */
  async deleteTimeOffException(id: string): Promise<boolean> {
    const res = await fetch(`/api/tutor/schedule/exceptions/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  },

  /**
   * Get student booking slot preview for a date and timezone.
   */
  async getSchedulePreview(date?: string, tz?: string): Promise<any | null> {
    try {
      const q = new URLSearchParams();
      if (date) q.set('date', date);
      if (tz) q.set('tz', tz);
      const res = await fetch(`/api/tutor/schedule/preview?${q.toString()}`);
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  /**
   * Get full tutor reviews aggregate, rating distribution, and reviews list.
   */
  async getTutorReviews360(): Promise<any | null> {
    try {
      const res = await fetch('/api/tutor/reviews');
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  /**
   * Reply to a student review.
   */
  async replyToTutorReview(reviewId: string, reply: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/tutor/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};

