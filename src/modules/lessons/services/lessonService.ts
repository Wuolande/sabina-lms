/**
 * Lesson Service — Business Logic for Lessons, Materials, Reviews & Schedule
 * -----------------------------------------------------------------------
 */

import { lessonRepository } from '../repositories/lessonRepository';
import { Lesson360Aggregate, TutorAvailabilityRuleItem, TutorLesson360 } from '../domain/types';
import { NotFoundError, ValidationError } from '@/src/shared/errors';
import { auditRepository } from '@/src/shared/audit/auditRepository';

export class LessonService {
  async getStudentLessons(studentUserId: string, status?: string) {
    return lessonRepository.findLessons({ studentId: studentUserId, status });
  }

  async getTutorLessons(tutorProfileId: string, status?: string) {
    return lessonRepository.findLessons({ tutorId: tutorProfileId, status });
  }

  async getLessonById(lessonId: string): Promise<Lesson360Aggregate> {
    const lesson = await lessonRepository.getLessonById(lessonId);
    if (!lesson) {
      throw new NotFoundError('Lesson', lessonId);
    }
    return lesson;
  }

  async completeLesson(
    lessonId: string,
    studentFeedback?: string,
    privateNotes?: string,
    actor?: { id: string; displayName: string; role?: string }
  ) {
    const res = await lessonRepository.completeLessonAtomic(lessonId, studentFeedback, privateNotes);

    if (actor) {
      await auditRepository.record({
        actorUserId: actor.id,
        actorName: actor.displayName,
        actorRole: actor.role || 'TUTOR',
        action: 'LESSON_COMPLETED',
        entityType: 'LESSON',
        entityId: lessonId,
        details: `Completed lesson ${lessonId}. Hours credited: ${res.durationHours}h.`,
        afterState: { status: 'COMPLETED', actualEnd: new Date().toISOString() },
      });
    }

    return res;
  }

  async uploadMaterial(
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
    if (!material.url) {
      throw new ValidationError('Material file URL is required.');
    }
    return lessonRepository.attachMaterial(lessonId, material);
  }

  async submitReview(
    lessonId: string,
    studentUserId: string,
    tutorProfileId: string,
    rating: number,
    comment?: string
  ) {
    if (!rating || rating < 1 || rating > 5) {
      throw new ValidationError('A rating between 1 and 5 stars is required.');
    }
    return lessonRepository.submitReview(lessonId, studentUserId, tutorProfileId, rating, comment);
  }

  async getTutorAvailability(tutorProfileId: string): Promise<TutorAvailabilityRuleItem[]> {
    return lessonRepository.getTutorAvailability(tutorProfileId);
  }

  async saveTutorAvailability(
    tutorProfileId: string,
    rules: Array<{ dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }>
  ): Promise<void> {
    await lessonRepository.saveTutorAvailability(tutorProfileId, rules);
  }

  async getTutorSchedule360(tutorProfileId: string) {
    return lessonRepository.getTutorSchedule360(tutorProfileId);
  }

  async saveScheduleSettings(
    tutorProfileId: string,
    settings: { bufferMinutes?: number; minNoticeHours?: number; maxAdvanceDays?: number; defaultLessonDuration?: number }
  ) {
    return lessonRepository.saveScheduleSettings(tutorProfileId, settings);
  }

  async addTimeOffException(
    tutorProfileId: string,
    exception: { date: string; isBlocked?: boolean; startTime?: string; endTime?: string; reason?: string }
  ) {
    if (!exception.date) {
      throw new ValidationError('A valid exception date (YYYY-MM-DD) is required.');
    }
    return lessonRepository.addTimeOffException(tutorProfileId, exception);
  }

  async deleteTimeOffException(exceptionId: string, tutorProfileId: string) {
    return lessonRepository.deleteTimeOffException(exceptionId, tutorProfileId);
  }

  /**
   * Generates standard RFC 5545 iCalendar (.ics) string for upcoming classes.
   */
  async generateIcsFeed(tutorProfileId: string): Promise<string> {
    const data = await lessonRepository.getTutorSchedule360(tutorProfileId);
    const lessons = data.upcomingLessons || [];

    const formatIcsDate = (isoStr: string) => {
      const d = new Date(isoStr);
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Sabina LMS//Tutor Teaching Schedule//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Sabina LMS Teaching Schedule',
      'X-WR-TIMEZONE:UTC',
    ];

    for (const l of lessons) {
      ics.push(
        'BEGIN:VEVENT',
        `UID:${l.id}@sabina.education`,
        `DTSTAMP:${formatIcsDate(new Date().toISOString())}`,
        `DTSTART:${formatIcsDate(l.scheduledStart)}`,
        `DTEND:${formatIcsDate(l.scheduledEnd)}`,
        `SUMMARY:1-on-1 Class with ${l.studentName} (${l.subjectName})`,
        `DESCRIPTION:Booking Ref: ${l.bookingRef}\\nStudent: ${l.studentName}\\nFocus: ${l.lessonNotes || 'Curriculum session'}`,
        `LOCATION:LiveKit Video Classroom (${l.videoRoomId})`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      );
    }

    ics.push('END:VCALENDAR');
    return ics.join('\r\n');
  }

  /**
   * Generate RFC 5545 iCalendar feed for student scheduled lessons.
   */
  async generateStudentIcsFeed(studentId: string): Promise<string> {
    const lessons = await lessonRepository.getStudentLessonsList(studentId);
    const upcoming = (lessons || []).filter(
      (l) => l.status === 'SCHEDULED' || l.status === 'CONFIRMED' || l.status === 'IN_PROGRESS'
    );

    const formatIcsDate = (isoStr: string) => {
      const d = new Date(isoStr);
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Sabina LMS//Student Learning Timetable//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Sabina LMS Learning Timetable',
      'X-WR-TIMEZONE:UTC',
    ];

    for (const l of upcoming) {
      ics.push(
        'BEGIN:VEVENT',
        `UID:${l.id}@sabina.education`,
        `DTSTAMP:${formatIcsDate(new Date().toISOString())}`,
        `DTSTART:${formatIcsDate(l.scheduledStart)}`,
        `DTEND:${formatIcsDate(l.scheduledEnd)}`,
        `SUMMARY:1-on-1 Class with ${l.tutorName} (${l.subjectName})`,
        `DESCRIPTION:Booking Ref: ${l.bookingRef}\\nInstructor: ${l.tutorName}\\nTopic: ${l.curriculumTopic || 'Curriculum session'}\\nHomework: ${l.homeworkAssigned || 'None'}`,
        `LOCATION:LiveKit Video Classroom (${l.videoRoomId})`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      );
    }

    ics.push('END:VCALENDAR');
    return ics.join('\r\n');
  }

  async getTutorLesson360(lessonId: string, tutorProfileId: string): Promise<TutorLesson360> {
    const lesson = await lessonRepository.getTutorLesson360(lessonId, tutorProfileId);
    if (!lesson) {
      throw new NotFoundError('Tutor Lesson Workspace', lessonId);
    }
    return lesson;
  }

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
    return lessonRepository.updateLessonWorkspace(lessonId, tutorProfileId, payload);
  }

  async deleteMaterial(materialId: string, lessonId: string) {
    return lessonRepository.deleteMaterial(materialId, lessonId);
  }

  async getTutorReviews360(tutorProfileId: string) {
    return lessonRepository.getTutorReviews360(tutorProfileId);
  }

  async replyToReviewAtomic(reviewId: string, tutorProfileId: string, reply: string) {
    if (!reply || reply.trim().length < 2) {
      throw new ValidationError('A response message is required.');
    }
    return lessonRepository.replyToReviewAtomic(reviewId, tutorProfileId, reply);
  }

  async replyToReview(lessonId: string, reply: string) {
    if (!reply || reply.trim().length < 2) {
      throw new ValidationError('A response message is required.');
    }
    return lessonRepository.replyToReview(lessonId, reply);
  }

  async getStudentLessonsList(studentId: string) {
    return lessonRepository.getStudentLessonsList(studentId);
  }

  async getStudentLesson360(lessonId: string, studentId: string) {
    const lesson = await lessonRepository.getStudentLesson360(lessonId, studentId);
    if (!lesson) {
      throw new NotFoundError('Student Lesson', lessonId);
    }
    return lesson;
  }

  async submitStudentHomeworkNotes(lessonId: string, studentId: string, notes: string) {
    if (!notes || !notes.trim()) {
      throw new ValidationError('Homework notes or response cannot be empty.');
    }
    return lessonRepository.submitStudentHomeworkNotes(lessonId, studentId, notes.trim());
  }
}

export const domainLessonService = new LessonService();


