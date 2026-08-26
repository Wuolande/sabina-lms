/**
 * API Route: GET /api/currencies
 * -----------------------------------------------------------------------
 * Public API listing supported global currencies with exchange rates.
 * -----------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/src/shared/database/supabase';

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await adminSupabase
      .from('currencies')
      .select('id, code, name, symbol, exchange_rate_to_usd, is_active, is_payout_supported')
      .eq('is_active', true)
      .order('code', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const formatted = (data || []).map((c: any) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      symbol: c.symbol,
      exchangeRateToUsd: Number(c.exchange_rate_to_usd),
      isPayoutSupported: c.is_payout_supported,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('[GET /api/currencies]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
