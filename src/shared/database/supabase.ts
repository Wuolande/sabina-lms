/**
 * Supabase Client Configuration
 * -----------------------------------------------------------------------
 * TWO-CLIENT ARCHITECTURE:
 *  - `supabase`       → Anon key. Browser-safe. Subject to RLS policies.
 *                       Use for client-side reads by authenticated users.
 *  - `adminSupabase`  → Service Role key. SERVER-ONLY. Bypasses RLS.
 *                       Use ONLY in Next.js API routes (never expose to browser).
 *
 * Migration note: When moving to a new Supabase project, update:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 * in your .env.local / deployment environment variables.
 * -----------------------------------------------------------------------
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl) {
  throw new Error('[Supabase] NEXT_PUBLIC_SUPABASE_URL is not defined in environment variables.');
}
if (!supabaseAnonKey) {
  throw new Error('[Supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined in environment variables.');
}

// ─── Browser-safe anon client (RLS enforced) ──────────────────────────────────
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// ─── Server-only admin client (bypasses RLS) ─────────────────────────────────
// IMPORTANT: Only import/use this in server-side code (API routes, server actions).
// Never pass this client or its key to the browser.
let _adminSupabase: SupabaseClient | null = null;

export function getAdminSupabaseClient(): SupabaseClient {
  if (!_adminSupabase) {
    const key = supabaseServiceRoleKey || supabaseAnonKey; // Fallback to anon in dev
    if (!supabaseServiceRoleKey && process.env.NODE_ENV === 'production') {
      console.error('[Supabase] WARNING: SUPABASE_SERVICE_ROLE_KEY is not set. Admin operations may fail in production.');
    }
    _adminSupabase = createClient(supabaseUrl, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return _adminSupabase;
}

// Convenience export for server-side use
export const adminSupabase = getAdminSupabaseClient();

export const getSupabaseClient = () => supabase;
