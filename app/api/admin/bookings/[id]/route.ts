/**
 * API Route: GET /api/admin/bookings/[id]
 * -----------------------------------------------------------------------
 * Returns full Booking 360 aggregate with student, tutor, lesson, review, materials.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainBookingService } from '@/src/modules/bookings/services/bookingService';
import { getAdminContext } from '@/src/shared/auth/authService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getAdminContext(req);

    const booking360 = await domainBookingService.getBooking360(id);
    return NextResponse.json(booking360);

  } catch (error: any) {
    console.error('[GET /api/admin/bookings/[id]]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}
