const BASE = "http://localhost:3088";

async function fetchRoute(path) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    },
  });
  const text = await res.text();
  return { status: res.status, headers: Object.fromEntries(res.headers.entries()), text, url };
}

async function runAudit() {
  console.log("=== BEGINNING COMPREHENSIVE LIVE SSR & SEO AUDIT ===");
  const results = [];

  // 1. Fetch Sitemap to extract live dynamic URLs
  const sitemapRes = await fetchRoute("/sitemap.xml");
  let sampleTutorSlug = "";
  let sampleSubjectSlug = "";
  let sampleBlogSlug = "";

  if (sitemapRes.status === 200) {
    const tutorMatches = sitemapRes.text.match(/<loc>[^<]+\/tutors\/([^<]+)<\/loc>/);
    if (tutorMatches) sampleTutorSlug = tutorMatches[1];

    const subjectMatches = sitemapRes.text.match(/<loc>[^<]+\/subjects\/([^<]+)<\/loc>/);
    if (subjectMatches) sampleSubjectSlug = subjectMatches[1];

    const blogMatches = sitemapRes.text.match(/<loc>[^<]+\/blog\/([^<]+)<\/loc>/);
    if (blogMatches) sampleBlogSlug = blogMatches[1];
  }

  console.log(`Sample URLs extracted from sitemap:`);
  console.log(`- Tutor: ${sampleTutorSlug || "(none)"}`);
  console.log(`- Subject: ${sampleSubjectSlug || "(none)"}`);
  console.log(`- Blog: ${sampleBlogSlug || "(none)"}`);

  const routesToTest = [
    { path: "/", type: "html", name: "Homepage" },
    { path: "/find-tutors", type: "html", name: "Find Tutors Marketplace" },
    { path: "/subjects", type: "html", name: "Subjects Directory" },
    { path: "/blog", type: "html", name: "Blog Listing" },
    { path: "/about", type: "html", name: "About Us" },
    { path: "/how-it-works", type: "html", name: "How It Works" },
    { path: "/become-a-tutor", type: "html", name: "Become a Tutor" },
    { path: "/contact", type: "html", name: "Contact Helpdesk" },
    { path: "/pricing", type: "html", name: "Pricing & Guarantee" },
    { path: "/terms", type: "html", name: "Terms of Service" },
    { path: "/privacy", type: "html", name: "Privacy Policy" },
    { path: "/refund-policy", type: "html", name: "Refund Policy" },
    { path: "/cookies", type: "html", name: "Cookie Policy" },
    { path: "/rss.xml", type: "xml", name: "RSS 2.0 Feed" },
    { path: "/feed.xml", type: "xml", name: "Feed Alias" },
    { path: "/sitemap.xml", type: "xml", name: "XML Sitemap" },
    { path: "/robots.txt", type: "txt", name: "Robots.txt" },
  ];

  if (sampleSubjectSlug) {
    routesToTest.push({ path: `/subjects/${sampleSubjectSlug}`, type: "html", name: `Subject: ${sampleSubjectSlug}` });
  }
  if (sampleTutorSlug) {
    routesToTest.push({ path: `/tutors/${sampleTutorSlug}`, type: "html", name: `Tutor: ${sampleTutorSlug}` });
  }
  if (sampleBlogSlug) {
    routesToTest.push({ path: `/blog/${sampleBlogSlug}`, type: "html", name: `Blog Post: ${sampleBlogSlug}` });
  }

  let totalPassed = 0;
  let totalFailed = 0;

  for (const r of routesToTest) {
    try {
      const res = await fetchRoute(r.path);
      const is200 = res.status === 200;
      const sizeKb = (res.text.length / 1024).toFixed(1);

      let seoChecks = [];
      let passed = is200;

      if (r.type === "html") {
        const hasTitle = res.text.includes("<title>") && !res.text.includes("<title></title>");
        const hasDescription = res.text.includes('name="description"');
        const hasJsonLd = res.text.includes('application/ld+json');
        const hasCanonical = res.text.includes('rel="canonical"');
        const hasRssLink = res.text.includes('type="application/rss+xml"');
        const hasNoInternalError = !res.text.includes("Application error: a client-side exception has occurred");

        seoChecks.push(hasTitle ? "✓ Title" : "✗ Missing Title");
        seoChecks.push(hasDescription ? "✓ MetaDesc" : "✗ Missing MetaDesc");
        seoChecks.push(hasCanonical ? "✓ Canonical" : "✗ Missing Canonical");
        seoChecks.push(hasRssLink ? "✓ RSS-Link" : "✗ Missing RSS-Link");
        if (hasJsonLd) seoChecks.push("✓ JSON-LD Schema");

        if (!hasTitle || !hasNoInternalError) passed = false;
      } else if (r.type === "xml") {
        const isXml = res.headers["content-type"]?.includes("xml");
        const hasRss = res.text.includes("<rss") || res.text.includes("<urlset");
        seoChecks.push(isXml ? "✓ XML Header" : "✗ Not XML Header");
        seoChecks.push(hasRss ? "✓ Valid XML Body" : "✗ Missing XML Root");
        if (!isXml || !hasRss) passed = false;
      } else if (r.type === "txt") {
        const lower = res.text.toLowerCase();
        const hasRobots = lower.includes("user-agent:") && lower.includes("sitemap:");
        seoChecks.push(hasRobots ? "✓ Valid Robots Directives" : "✗ Invalid Robots");
        if (!hasRobots) passed = false;
      }

      if (passed) {
        totalPassed++;
        console.log(`[PASS] ${r.path.padEnd(30)} ${res.status} (${sizeKb.padStart(5)} KB) | ${seoChecks.join(" | ")}`);
      } else {
        totalFailed++;
        console.error(`[FAIL] ${r.path.padEnd(30)} ${res.status} (${sizeKb.padStart(5)} KB) | ${seoChecks.join(" | ")}`);
      }
    } catch (err) {
      totalFailed++;
      console.error(`[ERROR] ${r.path}:`, err.message);
    }
  }

  console.log("\n==========================================");
  console.log(`AUDIT SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED out of ${routesToTest.length} routes.`);
  console.log("==========================================");

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error("Audit runner exception:", err);
  process.exit(1);
});
