const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const client = createClient(supabaseUrl, supabaseServiceRoleKey);

async function run() {
  const { data, error } = await client
    .from('users')
    .select('id, display_name, tutor:tutor_profiles!tutor_profiles_user_id_fkey(id)')
    .eq('email', 'tutor@sabinaedge.com')
    .single();
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

run();
