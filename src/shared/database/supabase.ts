/**
 * Supabase Client Configuration
 * -----------------------------------------------------------------------
 * TWO-CLIENT ARCHITECTURE:
 *  - `supabase`       → Anon key. Browser-safe. Subject to RLS policies.
 *                       Use for client-side reads by authenticated users.
 *  - `adminSupabase`  → Service Role key. SERVER-ONLY. Bypasses RLS.
 *                       Use ONLY in Next.js API routes (never expose to browser).
 * -----------------------------------------------------------------------
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://bgfpmbvucrzqyqlxbsdy.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZnBtYnZ1Y3J6cXlxbHhic2R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDM0OTEsImV4cCI6MjEwMDExOTQ5MX0.Bn3Xa1KaPXUtHc0nTtxvpHcPgAfC7LbdE-WVSBFv2gw';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_ANON_KEY;

// ─── Browser-safe anon client (RLS enforced) ──────────────────────────────────
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// ─── Server-only admin client (bypasses RLS) ─────────────────────────────────
let _adminSupabase: SupabaseClient | null = null;

export function getAdminSupabaseClient(): SupabaseClient {
  if (!_adminSupabase) {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseServiceRoleKey || supabaseAnonKey;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl;
    _adminSupabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return _adminSupabase;
}

// Proxy getter for adminSupabase so it always resolves with active client
export const adminSupabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getAdminSupabaseClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export const getSupabaseClient = () => supabase;
