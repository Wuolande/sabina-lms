/**
 * API Route: GET /api/admin/users/[id]
 *           PATCH /api/admin/users/[id]
 * -----------------------------------------------------------------------
 * GET  — Returns full User 360 aggregate (identity, student profile, tutor profile, roles, audit trail).
 * PATCH — Update user details or assign/revoke platform roles.
 * Requires ADMIN role.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/src/modules/users/services/userService';
import { getAdminContext } from '@/src/shared/auth/authService';
import { z } from 'zod';

const UpdateUserSchema = z.object({
  displayName: z.string().min(2).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),
  preferredLanguage: z.string().optional(),
  roles: z.array(z.enum(['SUPER_ADMIN', 'ADMIN', 'TUTOR', 'STUDENT'])).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await getAdminContext(req);

    const user360 = await userService.getUser360(id);
    return NextResponse.json(user360);

  } catch (error: any) {
    console.error('[GET /api/admin/users/[id]]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await getAdminContext(req);
    const body = await req.json();
    const parsed = UpdateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid update payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const meta = {
      ipAddress: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    };

    if (parsed.data.roles) {
      await userService.updateUserRoles(id, parsed.data.roles, admin, meta);
    }

    const { roles, ...profileUpdates } = parsed.data;
    if (Object.keys(profileUpdates).length > 0) {
      await userService.updateUserProfile(id, profileUpdates, admin, meta);
    }

    return NextResponse.json({ success: true, message: 'User updated successfully.' });

  } catch (error: any) {
    console.error('[PATCH /api/admin/users/[id]]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}
