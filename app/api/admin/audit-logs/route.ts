import { NextRequest, NextResponse } from 'next/server';
import { auditRepository } from '@/src/shared/audit/auditRepository';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;
    const entityType = searchParams.get('entityType') || undefined;
    const action = searchParams.get('action') || undefined;

    const result = await auditRepository.query({ page, limit, entityType, action });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
