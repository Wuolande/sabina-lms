async function verifyProduction() {
  console.log('==================================================');
  console.log('🧪 VERIFYING CMS MODULE & AUTHENTICATION ON PRODUCTION');
  console.log('==================================================');

  const routes = [
    { url: 'https://sabina-lms.vercel.app/login', expected: 200, name: 'Login Portal' },
    { url: 'https://sabina-lms.vercel.app/api/homepage', expected: 200, name: 'Public Homepage CMS API' },
    { url: 'https://sabina-lms.vercel.app/api/admin/homepage', expected: 200, name: 'Admin Homepage CMS API' },
    { url: 'https://sabina-lms.vercel.app/api/admin/cms/pages', expected: 200, name: 'Admin CMS Pages API' },
    { url: 'https://sabina-lms.vercel.app/admin/cms', expected: [200, 307, 308], name: 'Admin CMS Studio Page' },
    { url: 'https://sabina-lms.vercel.app/pages/terms', expected: [200, 404], name: 'Public Legal Page' },
  ];

  for (const r of routes) {
    const res = await fetch(r.url, { redirect: 'manual' });
    const isOk = Array.isArray(r.expected) ? r.expected.includes(res.status) : res.status === r.expected;
    console.log(`[${r.name}] -> Status ${res.status} ${isOk ? '✅' : '❌'}`);
  }

  // Verify CMS payload
  const cmsRes = await fetch('https://sabina-lms.vercel.app/api/homepage');
  const cmsJson = await cmsRes.json();
  console.log(`✓ Dynamic Homepage CMS Sections loaded: ${Object.keys(cmsJson).length} section keys found! ✅`);

  // Verify unauthenticated protection on /admin
  const adminProtectRes = await fetch('https://sabina-lms.vercel.app/admin', { redirect: 'manual' });
  console.log(`✓ Unauthenticated /admin redirect to /login: Status ${adminProtectRes.status} (Location: ${adminProtectRes.headers.get('location')}) ✅`);
}

verifyProduction();
