import { NextResponse } from 'next/server';
import { getPlatformPolicies } from '@/src/shared/config/platformPolicies';

export async function GET() {
  try {
    const policies = await getPlatformPolicies();
    return NextResponse.json(policies);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch policies' },
      { status: 500 }
    );
  }
}
