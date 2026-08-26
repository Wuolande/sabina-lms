/**
 * Booking Service — Client-Side HTTP Layer
 * -----------------------------------------------------------------------
 * Connects UI components to live Supabase bookings API routes.
 * -----------------------------------------------------------------------
 */

import { Booking, BookingStatus } from "@/types";
import { Booking360Aggregate, BookingListItem } from "@/src/modules/bookings/domain/types";

export const bookingService = {
  /**
   * List bookings for the current student.
   */
  async getStudentBookings(): Promise<Booking[]> {
    try {
      const res = await fetch('/api/student/bookings');
      if (!res.ok) return [];
      const data: BookingListItem[] = await res.json();

      return data.map((b) => ({
        id: b.id,
        studentId: b.studentId,
        student: {
          id: b.studentId,
          email: b.studentEmail,
          role: 'STUDENT',
          firstName: b.studentName.split(' ')[0],
          lastName: b.studentName.split(' ').slice(1).join(' '),
          displayName: b.studentName,
          avatarUrl: b.studentAvatar,
          country: 'Global',
          timezone: 'UTC',
          preferredLanguage: 'English',
          status: 'ACTIVE',
          createdAt: b.createdAt,
          updatedAt: b.createdAt,
        },
        tutorId: b.tutorId,
        tutor: {
          id: b.tutorId,
          userId: 'usr-tutor',
          slug: 'tutor',
          headline: 'Verified Educator',
          bio: '',
          hourlyRate: b.price,
          currency: b.currency,
          yearsExperience: 5,
          teachingStyle: 'Interactive',
          verificationStatus: 'APPROVED',
          averageRating: 5.0,
          reviewCount: 1,
          totalLessons: 10,
          totalStudents: 5,
          subjects: [],
          languages: [],
          education: [],
          certifications: [],
          availabilityRules: [],
          exceptions: [],
          user: {
            id: 'usr-tutor',
            email: 'tutor@example.com',
            role: 'TUTOR',
            firstName: b.tutorName.split(' ')[0],
            lastName: b.tutorName.split(' ').slice(1).join(' '),
            displayName: b.tutorName,
            avatarUrl: b.tutorAvatar,
            country: 'Global',
            timezone: 'UTC',
            preferredLanguage: 'English',
            status: 'ACTIVE',
            createdAt: b.createdAt,
            updatedAt: b.createdAt,
          },
          createdAt: b.createdAt,
          updatedAt: b.createdAt,
        },
        subjectId: 'sub-1',
        subject: { id: 'sub-1', name: b.subjectName, slug: 'subject', description: '', category: 'Test Prep', iconName: 'BookOpen' },
        startTime: b.startTime,
        endTime: b.endTime,
        durationMinutes: b.durationMinutes,
        price: b.price,
        currency: b.currency,
        status: b.status,
        paymentStatus: b.paymentStatus,
        videoRoomId: b.videoRoomId,
        meetingLink: b.meetingLink,
        createdAt: b.createdAt,
        updatedAt: b.createdAt,
      }));
    } catch {
      return [];
    }
  },

  /**
   * List all bookings for admin dashboard.
   */
  async getAllBookings(options?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<BookingListItem[]> {
    const params = new URLSearchParams();
    if (options?.status && options.status !== 'ALL') params.set('status', options.status);
    if (options?.search) params.set('search', options.search);
    if (options?.page) params.set('page', String(options.page));
    if (options?.limit) params.set('limit', String(options.limit));

    const res = await fetch(`/api/admin/bookings?${params.toString()}`);
    if (!res.ok) return [];
    return res.json();
  },

  /**
   * Get Booking 360 aggregate for admin inspection.
   */
  async getBooking360(id: string): Promise<Booking360Aggregate | null> {
    const res = await fetch(`/api/admin/bookings/${id}`);
    if (!res.ok) return null;
    return res.json();
  },

  /**
   * Create a new booking atomically.
   */
  async createBooking(data: {
    tutorId: string;
    subjectId?: string;
    subjectName?: string;
    startTime: string;
    durationMinutes: number;
    price?: number;
    currency?: string;
    paymentMethod: string;
    studentNotes?: string;
  }): Promise<{ bookingId: string; lessonId: string; bookingRef: string; videoRoomId: string }> {
    const res = await fetch('/api/student/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tutorId: data.tutorId,
        subjectId: data.subjectId,
        subjectName: data.subjectName,
        startTime: data.startTime,
        durationMinutes: data.durationMinutes,
        price: data.price || 40,
        currency: data.currency || 'USD',
        paymentMethod: data.paymentMethod,
        studentNotes: data.studentNotes,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Failed to create booking.');
    }
    return json;
  },

  /**
   * Cancel a booking.
   */
  async cancelBooking(id: string, reason: string): Promise<boolean> {
    const res = await fetch(`/api/admin/bookings/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    return res.ok;
  },
};
