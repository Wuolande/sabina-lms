import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const client = createClient(supabaseUrl, supabaseAnonKey);

async function checkAdminApi() {
  const { data, error } = await client.auth.signInWithPassword({
    email: 'admin@sabinaedge.com',
    password: 'Admin@123456',
  });

  if (error) {
    console.error('Login failed:', error.message);
    return;
  }

  const token = data.session?.access_token;
  console.log('Login success, got token');

  const res = await fetch('http://localhost:3000/api/admin/stats', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  console.log('API Status:', res.status);
  const json = await res.json();
  console.log('API Response:', JSON.stringify(json, null, 2));
}

checkAdminApi();
