/**
 * Lesson & Availability Domain Types
 * -----------------------------------------------------------------------
 */

import { LessonStatus } from '@/types';

export interface LessonListItem {
  id: string;
  bookingId: string;
  bookingRef?: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  studentEmail?: string;
  tutorId: string;
  tutorName: string;
  tutorAvatar?: string;
  subjectName: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  status: LessonStatus;
  videoRoomId: string;
  lessonNotes?: string;
  studentFeedback?: string;
  privateTutorNotes?: string;
  hasStudentReviewed: boolean;
  materialsCount: number;
  curriculumTopic?: string;
  homeworkAssigned?: string;
  homeworkDueDate?: string;
  studentHomeworkNotes?: string;
  studentHomeworkSubmittedAt?: string;
  durationMinutes?: number;
  reviewRating?: number;
  hasReview?: boolean;
  tutorHasReplied?: boolean;
}

export interface Lesson360Aggregate {
  id: string;
  bookingId: string;
  bookingRef: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  durationMinutes?: number;
  price?: number;
  currency?: string;
  status: LessonStatus;
  videoRoomId: string;
  lessonNotes?: string;
  studentFeedback?: string;
  privateTutorNotes?: string;
  curriculumTopic?: string;
  homeworkAssigned?: string;
  homeworkDueDate?: string;
  studentHomeworkNotes?: string;
  studentHomeworkSubmittedAt?: string;
  hasStudentReviewed?: boolean;
  createdAt?: string;
  student: {
    id: string;
    displayName: string;
    email?: string;
    avatarUrl?: string;
    country?: string;
    timezone?: string;
  };
  tutor: {
    id: string;
    slug?: string;
    headline?: string;
    hourlyRate?: number;
    currency?: string;
    displayName: string;
    avatarUrl?: string;
    country?: string;
    timezone?: string;
    averageRating?: number;
    reviewCount?: number;
  };
  subject: {
    id?: string;
    name: string;
  };
  materials: Array<{
    id: string;
    name: string;
    sizeBytes: number;
    fileType: string;
    url: string;
    uploadedByRole: string;
    createdAt: string;
  }>;
  review?: {
    id: string;
    rating: number;
    comment?: string;
    tutorReply?: string;
    tutorRepliedAt?: string;
    createdAt: string;
  };
  goals?: Array<{
    id: string;
    title: string;
    subjectName?: string;
    targetDate?: string;
    progressPercent?: number;
    status?: string;
  }>;
}

export interface TutorLesson360 {
  id: string;
  bookingId: string;
  bookingRef: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  status: LessonStatus;
  videoRoomId: string;
  price: number;
  currency: string;
  subjectName: string;
  curriculumTopic?: string;
  homeworkAssigned?: string;
  homeworkDueDate?: string;
  lessonNotes?: string;
  studentFeedback?: string;
  privateTutorNotes?: string;
  hasStudentReviewed: boolean;
  createdAt: string;
  student: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    country?: string;
    timezone?: string;
    joinedAt?: string;
  };
  materials: Array<{
    id: string;
    name: string;
    sizeBytes: number;
    fileType: string;
    url: string;
    uploadedByRole: string;
    createdAt: string;
  }>;
  review?: {
    id: string;
    rating: number;
    comment?: string;
    tutorReply?: string;
    tutorRepliedAt?: string;
    createdAt: string;
  };
  learningGoals: Array<{
    id: string;
    subjectName: string;
    targetGoal: string;
    targetScore?: string;
    targetDate?: string;
    progressPct: number;
    status: string;
  }>;
  pastLessons: Array<{
    id: string;
    scheduledStart: string;
    scheduledEnd: string;
    status: string;
    curriculumTopic?: string;
    lessonNotes?: string;
  }>;
}

export interface UpdateTutorLessonWorkspacePayload {
  curriculumTopic?: string;
  homeworkAssigned?: string;
  homeworkDueDate?: string;
  privateTutorNotes?: string;
  studentFeedback?: string;
}

export interface TutorAvailabilityRuleItem {
  id?: string;
  tutorId: string;
  dayOfWeek: number; // 0=Sun .. 6=Sat
  startTime: string; // "09:00:00"
  endTime: string;   // "18:00:00"
  isActive: boolean;
}

export interface TutorAvailabilityExceptionItem {
  id?: string;
  tutorId: string;
  date: string;
  isBlocked: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
  createdAt?: string;
}

export interface TutorScheduleSettings {
  bufferMinutes: number;
  minNoticeHours: number;
  maxAdvanceDays: number;
  defaultLessonDuration: number;
}

export interface TutorSchedule360 {
  tutorId: string;
  settings: TutorScheduleSettings;
  rules: TutorAvailabilityRuleItem[];
  exceptions: TutorAvailabilityExceptionItem[];
  upcomingLessons: Array<{
    id: string;
    bookingId: string;
    bookingRef: string;
    studentId: string;
    studentName: string;
    studentEmail?: string;
    studentAvatar?: string;
    subjectName: string;
    scheduledStart: string;
    scheduledEnd: string;
    status: string;
    videoRoomId: string;
    lessonNotes?: string;
  }>;
}
