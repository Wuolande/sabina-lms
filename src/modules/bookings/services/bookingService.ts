/**
 * Booking Service — Business Logic, RBAC & Audit Trail for Bookings
 * -----------------------------------------------------------------------
 */

import { bookingRepository } from '../repositories/bookingRepository';
import { Booking360Aggregate, CreateBookingPayload } from '../domain/types';
import { NotFoundError, ValidationError } from '@/src/shared/errors';
import { auditRepository } from '@/src/shared/audit/auditRepository';
import { UserContext } from '@/src/shared/permissions/rbac';

export class BookingService {
  async listBookings(options: {
    status?: string;
    studentId?: string;
    tutorId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    return bookingRepository.findAll(options);
  }

  async getBooking360(bookingId: string): Promise<Booking360Aggregate> {
    const booking = await bookingRepository.getBooking360(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking', bookingId);
    }
    return booking;
  }

  async createBooking(payload: CreateBookingPayload, actor: { id: string; displayName: string; role?: string }) {
    if (!payload.studentId || !payload.tutorId) {
      throw new ValidationError('Student and Tutor IDs are required to schedule a booking.');
    }
    if (!payload.startTime) {
      throw new ValidationError('A valid start time is required.');
    }

    const result = await bookingRepository.createBookingAtomic(payload);

    await auditRepository.record({
      actorUserId: actor.id,
      actorName: actor.displayName,
      actorRole: actor.role || 'STUDENT',
      action: 'BOOKING_CREATED',
      entityType: 'BOOKING',
      entityId: result.bookingId,
      details: `Created booking ${result.bookingRef} with tutor ID ${payload.tutorId}. Start: ${payload.startTime}. Duration: ${payload.durationMinutes}m.`,
      afterState: { bookingId: result.bookingId, lessonId: result.lessonId, videoRoomId: result.videoRoomId },
    });

    return result;
  }

  async cancelBooking(bookingId: string, reason: string, user: UserContext) {
    if (!reason || reason.trim().length < 4) {
      throw new ValidationError('A cancellation reason is required.');
    }

    const booking = await this.getBooking360(bookingId);

    if (booking.status === 'CANCELLED') {
      throw new ValidationError('This booking is already cancelled.');
    }

    await bookingRepository.cancelBooking(bookingId, reason, user.id);

    await auditRepository.record({
      actorUserId: user.id,
      actorName: user.displayName,
      actorRole: user.roles[0],
      action: 'BOOKING_CANCELLED',
      entityType: 'BOOKING',
      entityId: bookingId,
      details: `Cancelled booking ${booking.bookingRef}. Reason: ${reason.trim()}`,
      beforeState: { status: booking.status },
      afterState: { status: 'CANCELLED', reason: reason.trim() },
    });
  }
}

export const domainBookingService = new BookingService();
