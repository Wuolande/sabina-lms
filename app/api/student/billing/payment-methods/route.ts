/**
 * API Route: POST   /api/student/billing/payment-methods
 *           DELETE /api/student/billing/payment-methods
 *           PATCH  /api/student/billing/payment-methods
 * -----------------------------------------------------------------------
 * Add, remove, or set default payment methods for student.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { domainStudentService } from '@/src/modules/students/services/studentService';
import { getStudentContext } from '@/src/shared/auth/authService';

export async function POST(req: NextRequest) {
  try {
    const student = await getStudentContext(req);
    const body = await req.json();

    const data = await domainStudentService.addPaymentMethod(student.userId, {
      cardBrand: body.cardBrand || 'Visa',
      last4: body.last4 || '4242',
      expMonth: Number(body.expMonth) || 12,
      expYear: Number(body.expYear) || 2028,
      isDefault: Boolean(body.isDefault),
    });

    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    console.error('[POST /api/student/billing/payment-methods]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const student = await getStudentContext(req);
    const { searchParams } = new URL(req.url);
    const methodId = searchParams.get('id');

    if (!methodId) {
      return NextResponse.json({ error: 'Missing payment method id' }, { status: 400 });
    }

    const data = await domainStudentService.deletePaymentMethod(student.userId, methodId);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[DELETE /api/student/billing/payment-methods]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const student = await getStudentContext(req);
    const body = await req.json();

    if (!body.methodId) {
      return NextResponse.json({ error: 'Missing methodId' }, { status: 400 });
    }

    const data = await domainStudentService.setDefaultPaymentMethod(student.userId, body.methodId);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[PATCH /api/student/billing/payment-methods]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}
