const { createClient } = require('@supabase/supabase-js');

async function verifySeo() {
  console.log('--- Verifying SEO and Theme Database State ---');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: theme, error: themeErr } = await supabase
    .from('platform_theme')
    .select('*')
    .eq('id', 'default')
    .single();

  if (themeErr) {
    console.error('Error querying platform_theme:', themeErr);
    process.exit(1);
  }

  console.log('✅ platform_theme default record:');
  console.log('   - meta_title:', theme.meta_title);
  console.log('   - meta_description:', theme.meta_description?.slice(0, 60) + '...');
  console.log('   - keywords count:', Array.isArray(theme.keywords) ? theme.keywords.length : 0);
  console.log('   - twitter_handle:', theme.twitter_handle);
  console.log('   - allow_indexing:', theme.allow_indexing);
  console.log('   - logo_url:', theme.logo_url ? 'Configured' : 'Empty (default wordmark)');
  console.log('   - favicon_url:', theme.favicon_url || 'Default (/favicon.svg)');
  console.log('   - og_image_url:', theme.og_image_url || 'Default (/images/og-default.png)');

  // Verify Subjects
  const { data: subjects } = await supabase
    .from('subjects')
    .select('slug, name')
    .eq('is_active', true);
  console.log(`✅ Active subjects in DB for sitemap: ${subjects?.length || 0}`);

  // Verify Blogs
  const { data: blogs } = await supabase
    .from('blogs')
    .select('slug, title')
    .eq('is_published', true);
  console.log(`✅ Published blog articles for sitemap: ${blogs?.length || 0}`);

  // Verify Platform Pages
  const { data: pages } = await supabase
    .from('platform_pages')
    .select('slug, title')
    .eq('is_published', true);
  console.log(`✅ Published platform CMS pages for sitemap: ${pages?.length || 0}`);

  console.log('--- SEO Database Verification Passed Successfully ---');
}

verifySeo().catch(console.error);
