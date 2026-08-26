/**
 * API Route: GET /api/student/bookings
 *           POST /api/student/bookings
 * -----------------------------------------------------------------------
 * GET  — Lists student's bookings.
 * POST — Creates a new booking & lesson atomically.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainBookingService } from '@/src/modules/bookings/services/bookingService';
import { getStudentContext } from '@/src/shared/auth/authService';
import { z } from 'zod';

const BookingSchema = z.object({
  tutorId: z.string().min(1),
  subjectId: z.string().optional(),
  subjectName: z.string().optional(),
  startTime: z.string().min(1),
  durationMinutes: z.number().default(50),
  price: z.number().min(0),
  currency: z.string().default('USD'),
  paymentMethod: z.string().default('card'),
  studentNotes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const student = await getStudentContext(req);
    const result = await domainBookingService.listBookings({ studentId: student.userId });
    return NextResponse.json(result.data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const student = await getStudentContext(req);
    const body = await req.json();
    const parsed = BookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid booking data', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await domainBookingService.createBooking(
      {
        studentId: student.userId,
        tutorId: parsed.data.tutorId,
        subjectId: parsed.data.subjectId,
        subjectName: parsed.data.subjectName,
        startTime: parsed.data.startTime,
        durationMinutes: parsed.data.durationMinutes,
        price: parsed.data.price,
        currency: parsed.data.currency,
        paymentMethod: parsed.data.paymentMethod,
        studentNotes: parsed.data.studentNotes,
      },
      { id: student.userId, displayName: student.displayName, role: 'STUDENT' }
    );

    return NextResponse.json(result, { status: 201 });

  } catch (error: any) {
    console.error('[POST /api/student/bookings]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}
