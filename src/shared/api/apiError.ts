/**
 * Shared API error response helper
 * -----------------------------------------------------------------------
 * Converts AppError (and subclasses like UnauthorizedError, ForbiddenError,
 * NotFoundError, ValidationError) to the correct HTTP status code.
 *
 * Usage in route handlers:
 *   } catch (error: any) {
 *     return apiErrorResponse(error);
 *   }
 */

import { NextResponse } from 'next/server';

/**
 * Returns a NextResponse JSON error using the error's statusCode if available
 * (i.e. for AppError subclasses), otherwise defaults to 500.
 */
export function apiErrorResponse(error: unknown): NextResponse {
  const err = error as any;
  const status: number = typeof err?.statusCode === 'number' ? err.statusCode : 500;
  const message: string = err?.message || 'Internal Server Error';
  return NextResponse.json({ error: message }, { status });
}
