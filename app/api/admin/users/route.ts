/**
 * API Route: GET /api/admin/users
 *           POST /api/admin/users
 * -----------------------------------------------------------------------
 * GET  — List users with pagination, role filter, status, country, search.
 * POST — Create/invite new user with role assignment.
 * Requires ADMIN role.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/src/modules/users/services/userService';
import { getAdminContext } from '@/src/shared/auth/authService';
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2),
  country: z.string().optional(),
  timezone: z.string().optional(),
  roles: z.array(z.enum(['SUPER_ADMIN', 'ADMIN', 'TUTOR', 'STUDENT'])).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminContext(req);
    const { searchParams } = new URL(req.url);

    const role = searchParams.get('role') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const country = searchParams.get('country') || undefined;
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;

    const result = await userService.listUsers({ role, status, search, country, page, limit });

    const res = NextResponse.json(result.data);
    res.headers.set('X-Total-Count', String(result.total));
    res.headers.set('X-Page', String(result.page));
    res.headers.set('X-Limit', String(result.limit));
    return res;

  } catch (error: any) {
    console.error('[GET /api/admin/users]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminContext(req);
    const body = await req.json();
    const parsed = CreateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid user data', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const newUserId = await userService.createUser(parsed.data, admin, {
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true, userId: newUserId });

  } catch (error: any) {
    console.error('[POST /api/admin/users]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}
