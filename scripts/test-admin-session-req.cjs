async function testAuthenticatedAdmin() {
  console.log('Testing Admin API with authenticated cookie...');
  const res = await fetch('https://sabina-lms.vercel.app/api/admin/homepage', {
    headers: {
      'Cookie': 'sb-access-token=demo-auth-admin'
    }
  });
  console.log(`Authenticated /api/admin/homepage: Status ${res.status} ${res.status === 200 ? '✅' : '❌'}`);
  const data = await res.json();
  console.log(`Hero pretitle: "${data.heroSection?.pretitle}"`);

  const pagesRes = await fetch('https://sabina-lms.vercel.app/api/admin/cms/pages', {
    headers: {
      'Cookie': 'sb-access-token=demo-auth-admin'
    }
  });
  console.log(`Authenticated /api/admin/cms/pages: Status ${pagesRes.status} ${pagesRes.status === 200 ? '✅' : '❌'}`);
}

testAuthenticatedAdmin();
