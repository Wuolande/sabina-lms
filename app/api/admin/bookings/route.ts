/**
 * API Route: GET /api/admin/bookings
 * -----------------------------------------------------------------------
 * List all marketplace bookings with status filter, search, and pagination.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainBookingService } from '@/src/modules/bookings/services/bookingService';
import { getAdminContext } from '@/src/shared/auth/authService';

export async function GET(req: NextRequest) {
  try {
    await getAdminContext(req);
    const { searchParams } = new URL(req.url);

    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;

    const result = await domainBookingService.listBookings({ status, search, page, limit });

    const res = NextResponse.json(result.data);
    res.headers.set('X-Total-Count', String(result.total));
    res.headers.set('X-Page', String(result.page));
    res.headers.set('X-Limit', String(result.limit));
    return res;

  } catch (error: any) {
    console.error('[GET /api/admin/bookings]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}
