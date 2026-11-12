const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const client = createClient(supabaseUrl, supabaseServiceRoleKey);

async function run() {
  const { data, error } = await client.from('users').select('id, email, display_name');
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

run();
