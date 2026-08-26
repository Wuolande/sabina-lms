/**
 * API Route: GET /api/student/billing
 *           PUT /api/student/billing
 * -----------------------------------------------------------------------
 * GET — Returns full student billing 360 aggregate (invoices, spend summary,
 *       saved cards, and tax/billing profile).
 * PUT — Updates student billing profile details (tax ID, address, billing name).
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainStudentService } from '@/src/modules/students/services/studentService';
import { getStudentContext } from '@/src/shared/auth/authService';

export async function GET(req: NextRequest) {
  try {
    const student = await getStudentContext(req);
    const data = await domainStudentService.getStudentBilling360(student.userId);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[GET /api/student/billing]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const student = await getStudentContext(req);
    const body = await req.json();

    const data = await domainStudentService.updateBillingProfile(student.userId, {
      billingName: body.billingName || student.displayName,
      billingEmail: body.billingEmail || student.email,
      taxId: body.taxId || '',
      addressLine1: body.addressLine1 || '',
      city: body.city || '',
      postalCode: body.postalCode || '',
      country: body.country || 'United States',
    });

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[PUT /api/student/billing]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}
