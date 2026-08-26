/**
 * API Route: POST /api/admin/bookings/[id]/cancel
 * -----------------------------------------------------------------------
 * Cancels a booking and its corresponding scheduled lesson with audit trail.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainBookingService } from '@/src/modules/bookings/services/bookingService';
import { getAdminContext } from '@/src/shared/auth/authService';
import { z } from 'zod';

const CancelSchema = z.object({
  reason: z.string().min(4, 'Cancellation reason must be at least 4 characters.'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await getAdminContext(req);
    const body = await req.json();
    const parsed = CancelSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid cancellation reason' }, { status: 400 });
    }

    await domainBookingService.cancelBooking(id, parsed.data.reason, admin);
    return NextResponse.json({ success: true, message: 'Booking cancelled.' });

  } catch (error: any) {
    console.error('[POST /api/admin/bookings/[id]/cancel]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}
