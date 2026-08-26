const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cgppcryxlyerofydivnq.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncHBjcnl4bHllcm9meWRpdm5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2MTg5NTksImV4cCI6MjEwMzE5NDk1OX0.fFHB6qrZNq689JbpjYEOgtJxuVvXLX2WAEVykjAf2Rc';

const supabase = createClient(supabaseUrl, anonKey);

async function testAuth() {
  console.log('==================================================');
  console.log('🔐 TESTING REAL SUPABASE AUTHENTICATION (3 ACCOUNTS)');
  console.log('==================================================');

  const testAccounts = [
    { role: 'SUPERADMIN', email: 'admin@sabinaedge.com', pass: 'Admin@123456' },
    { role: 'TUTOR', email: 'tutor@sabinaedge.com', pass: 'Tutor@123456' },
    { role: 'STUDENT', email: 'student@sabinaedge.com', pass: 'Student@123456' },
  ];

  for (const acc of testAccounts) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: acc.email,
      password: acc.pass,
    });

    if (error) {
      console.log(`❌ [${acc.role}] ${acc.email} FAILED:`, error.message);
    } else {
      console.log(`✅ [${acc.role}] ${acc.email} SIGNED IN! Access Token generated, User ID: ${data.user.id}`);
    }
  }
}

testAuth();
