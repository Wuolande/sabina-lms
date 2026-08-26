/**
 * Booking Domain Types
 * -----------------------------------------------------------------------
 * Booking parameters, status transitions, aggregates, and payloads.
 * -----------------------------------------------------------------------
 */

import { BookingStatus, PaymentStatus } from '@/types';

export interface BookingListItem {
  id: string;
  bookingRef: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentAvatar?: string;
  tutorId: string;
  tutorName: string;
  tutorAvatar?: string;
  subjectName: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  price: number;
  currency: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  videoRoomId: string;
  meetingLink?: string;
  createdAt: string;
}

export interface Booking360Aggregate {
  id: string;
  bookingRef: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  price: number;
  currency: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  videoRoomId: string;
  meetingLink?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  studentNotes?: string;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl?: string;
    country: string;
    timezone: string;
  };
  tutor: {
    id: string;
    slug: string;
    headline: string;
    hourlyRate: number;
    currency: string;
    displayName: string;
    email: string;
    avatarUrl?: string;
  };
  subject: {
    id?: string;
    name: string;
  };
  lesson?: {
    id: string;
    status: string;
    scheduledStart: string;
    scheduledEnd: string;
    actualStart?: string;
    actualEnd?: string;
    lessonNotes?: string;
    studentFeedback?: string;
    privateTutorNotes?: string;
    hasStudentReviewed: boolean;
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
    createdAt: string;
  };
}

export interface CreateBookingPayload {
  studentId: string;
  tutorId: string;
  subjectId?: string;
  subjectName?: string;
  startTime: string;
  durationMinutes: number;
  price: number;
  currency?: string;
  paymentMethod?: string;
  studentNotes?: string;
}
