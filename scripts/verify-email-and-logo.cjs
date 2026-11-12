const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// 1. Read environment variables
const env = {};
if (fs.existsSync('.env.local')) {
  fs.readFileSync('.env.local', 'utf8').split('\n').forEach((l) => {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  });
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || 'https://cgppcryxlyerofydivnq.supabase.co';
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function runVerification() {
  console.log('===============================================================');
  console.log('🧪 VERIFYING EMAIL FUNCTIONALITY & ADMIN LOGO MANAGEMENT');
  console.log('===============================================================');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
    }
  }

  // ── TEST 1: Database Migration & email_provider_config Persistence ──
  console.log('\n--- Test 1: Database email_provider_config Schema & Persistence ---');
  const { data: selectData, error: selectErr } = await supabase
    .from('platform_policy_settings')
    .select('id, email_provider_config')
    .eq('id', 'default')
    .single();

  assert(!selectErr, `Queried platform_policy_settings without SQL error`);
  assert(
    selectData && typeof selectData.email_provider_config === 'object',
    `email_provider_config is present and structured as JSONB object`
  );
  assert(
    selectData?.email_provider_config?.activeProvider === 'resend',
    `activeProvider defaults to 'resend'`
  );

  // ── TEST 2: Update email_provider_config in DB ──
  console.log('\n--- Test 2: email_provider_config Mutation & Reading ---');
  const updatedEmailConfig = {
    ...selectData.email_provider_config,
    fromName: 'Sabina Global Academy',
    fromEmail: 'admissions@sabina.education',
    activeProvider: 'resend',
  };

  const { error: updateErr } = await supabase
    .from('platform_policy_settings')
    .update({ email_provider_config: updatedEmailConfig })
    .eq('id', 'default');

  assert(!updateErr, `Successfully updated email_provider_config in database`);

  const { data: verifiedConfig } = await supabase
    .from('platform_policy_settings')
    .select('email_provider_config')
    .eq('id', 'default')
    .single();

  assert(
    verifiedConfig?.email_provider_config?.fromName === 'Sabina Global Academy',
    `Persisted fromName updated to 'Sabina Global Academy'`
  );
  assert(
    verifiedConfig?.email_provider_config?.fromEmail === 'admissions@sabina.education',
    `Persisted fromEmail updated to 'admissions@sabina.education'`
  );

  // Restore default
  await supabase
    .from('platform_policy_settings')
    .update({
      email_provider_config: {
        ...selectData.email_provider_config,
        fromName: 'Sabina LMS',
        fromEmail: 'notifications@sabina.education',
      },
    })
    .eq('id', 'default');

  // ── TEST 3: platform_theme Logo Storage & Persistence ──
  console.log('\n--- Test 3: platform_theme Logo Storage & Branding ---');
  const testLogoUrl = 'https://res.cloudinary.com/vtjhrq1w/image/upload/v1/sabina/branding/logo_demo.png';
  const { error: themeErr } = await supabase
    .from('platform_theme')
    .upsert({
      id: 'default',
      primary_color: '#14209C',
      secondary_color: '#F9C31C',
      logo_url: testLogoUrl,
      updated_at: new Date().toISOString(),
    });

  assert(!themeErr, `Upserted brand theme with logo_url`);

  const { data: themeData } = await supabase
    .from('platform_theme')
    .select('*')
    .eq('id', 'default')
    .single();

  assert(
    themeData?.logo_url === testLogoUrl,
    `Retrieved logo_url matches active brand asset: ${themeData?.logo_url}`
  );

  // ── TEST 4: Supabase Public Storage 'branding' Bucket ──
  console.log('\n--- Test 4: Supabase Storage Branding Bucket ---');
  const { data: buckets } = await supabase.storage.listBuckets();
  const brandingBucket = (buckets || []).find((b) => b.name === 'branding');
  assert(!!brandingBucket, `Supabase storage bucket 'branding' exists`);
  assert(brandingBucket?.public === true, `Storage bucket 'branding' is publicly readable for emails & web`);

  // ── TEST 5: Email HTML Rendering with Logo Compatibility ──
  console.log('\n--- Test 5: Branded HTML Email Template Formatting ---');
  // Dynamic import of TypeScript module via compiled or evaluated logic
  const { renderBrandedEmailHtml, formatEmailBodyHtml } = require('../src/modules/communications/templates/emailTemplates.ts');

  const renderedHtml = renderBrandedEmailHtml({
    title: 'Booking Confirmed - Mathematics',
    bodyHtml: formatEmailBodyHtml('Hello Alex,\n\nYour lesson is confirmed!\n\n• Date: Oct 12\n• Time: 10:00 AM\n\n👉 Join Classroom: https://sabina.education/lessons/123'),
    logoUrl: testLogoUrl,
    primaryColor: '#14209C',
  });

  assert(renderedHtml.includes('width="180"'), `Email HTML contains explicit width="180" for Outlook desktop`);
  assert(renderedHtml.includes(testLogoUrl), `Email HTML contains exact absolute logo URL`);
  assert(renderedHtml.includes('background-color:#ffffff;padding:8px 18px'), `Email logo is wrapped in high-contrast white card`);
  assert(renderedHtml.includes('<![if mso]>') || renderedHtml.includes('<!--[if mso]>'), `Email HTML includes Outlook MSO font declarations`);
  assert(renderedHtml.includes('Join Classroom &rarr;'), `Body renderer converted CTA bullet into branded action button`);

  // ── Summary ──
  console.log('\n===============================================================');
  console.log(`🏁 VERIFICATION COMPLETE: ${passed} / ${total} TESTS PASSED`);
  console.log('===============================================================');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal Verification Error:', err);
  process.exit(1);
});
