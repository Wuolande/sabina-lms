/**
 * Booking Service — Business Logic, RBAC & Audit Trail for Bookings
 * -----------------------------------------------------------------------
 */

import { bookingRepository } from '../repositories/bookingRepository';
import { Booking360Aggregate, CreateBookingPayload } from '../domain/types';
import { NotFoundError, ValidationError } from '@/src/shared/errors';
import { auditRepository } from '@/src/shared/audit/auditRepository';
import { UserContext } from '@/src/shared/permissions/rbac';
import { getPlatformPolicies } from '@/src/shared/config/platformPolicies';
import { adminSupabase } from '@/src/shared/database/supabase';

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

    const policies = await getPlatformPolicies();
    
    // Validate price based on tutor's hourly rate and possible trial discount
    const tutorProfile = await adminSupabase
      .from('tutor_profiles')
      .select('hourly_rate')
      .eq('id', payload.tutorId)
      .single();
      
    if (tutorProfile.data) {
      const baseRate = Number(tutorProfile.data.hourly_rate);
      // The platform standard is that the "base rate" covers a 50 minute lesson.
      // 25 mins = baseRate / 2
      // 50 mins = baseRate
      // 80 mins = baseRate * 1.6
      let expectedPrice = 0;
      if (payload.durationMinutes === 25) expectedPrice = baseRate / 2;
      else if (payload.durationMinutes === 50) expectedPrice = baseRate;
      else if (payload.durationMinutes === 80) expectedPrice = (baseRate * 8) / 5;
      else expectedPrice = (baseRate * payload.durationMinutes) / 50; // Fallback for custom durations
      
      // If client marked this as a trial, apply platform trial discount
      const requestedPrice = Number(payload.price);
      const trialDiscountedPrice = expectedPrice * (1 - policies.trialLessonDiscountPercent / 100);
      
      const margin = 0.5; // Allow small rounding error (cents)
      if (Math.abs(requestedPrice - expectedPrice) > margin && Math.abs(requestedPrice - trialDiscountedPrice) > margin) {
         // The requested price is neither the full price nor the exact trial price
         console.warn(`[BookingService] Client requested price ${requestedPrice} but expected ${expectedPrice} or trial ${trialDiscountedPrice}. Accepting as custom price but logging.`);
      }
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
