import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  const { data: users, error: uErr } = await adminSupabase.from('users').select('id, display_name, roles:user_roles!user_id(role_id)');
  console.log('Users:', users?.length, uErr?.message);

  const { data: stats, error: sErr } = await adminSupabase.from('admin_stats_view').select('*');
  console.log('Stats:', stats, sErr?.message);
}

test();
