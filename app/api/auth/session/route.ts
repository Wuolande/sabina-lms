/**
 * API Route: GET /api/auth/session
 * -----------------------------------------------------------------------
 * Enterprise Session Inspection & Health Check.
 * Returns authenticated identity, roles, and validity status.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminContext, getStudentContext, getTutorContext } from '@/src/shared/auth/authService';

export async function GET(req: NextRequest) {
  try {
    const roleParam = req.nextUrl.searchParams.get('role');

    if (roleParam === 'ADMIN') {
      const admin = await getAdminContext(req);
      return NextResponse.json({
        authenticated: true,
        user: {
          id: admin.id,
          email: admin.email,
          displayName: admin.displayName,
          roles: admin.roles,
        },
      });
    }

    if (roleParam === 'TUTOR') {
      const tutor = await getTutorContext(req);
      return NextResponse.json({
        authenticated: !!tutor.userId,
        user: {
          id: tutor.userId,
          tutorProfileId: tutor.tutorProfileId,
          displayName: tutor.displayName,
          role: 'TUTOR',
        },
      });
    }

    // Default to student
    const student = await getStudentContext(req);
    return NextResponse.json({
      authenticated: !!student.userId,
      user: {
        id: student.userId,
        email: student.email,
        displayName: student.displayName,
        role: 'STUDENT',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { authenticated: false, error: error.message || 'Unauthorized' },
      { status: 401 }
    );
  }
}
