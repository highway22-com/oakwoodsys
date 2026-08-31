#!/usr/bin/env node

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const WP_BASE_URL = 'https://oakwoodsystemsgroup.com';
const GRAPHQL_URL = `${WP_BASE_URL}/graphql`;

const BLOG_SLUGS_QUERY = `query GetSlugsForPrerender {
  blog: genContentCategory(id: "blog", idType: SLUG) {
    genContents(first: 500) { nodes { slug } }
  }
  caseStudy: genContentCategory(id: "case-study", idType: SLUG) {
    genContents(first: 500) { nodes { slug } }
  }
}`;

// Slugs de páginas WordPress que SÍ se prerenderizan en build.
// Vacío = ninguna se prerenderiza (todas se sirven por SSR bajo demanda).
// Agrega aquí los slugs que quieras hornear estáticos (cada uno pesa ~MBs).
const PRERENDER_WP_SLUGS = [
  'ai-application-innovation-engagements',
  'ai-application-development',
  'ai-governance',
  'api-development-and-integration-services',
  'application-modernization-services',
  'azure-arc-for-hybrid-cloud-environments',
  'azure-backup-disaster-recovery-services',
  'azure-cloud-security-2'

];

const SERVICE_SLUGS = [
  'data-ai-solutions',
  'cloud-and-infrastructure',
  'application-innovation',
  'high-performance-computing-hpc',
  'modern-work',
  'managed-services',
];

const STRUCTURED_SLUGS = [
  'sql-server-migration-to-azure',
  'microsoft-fabric-poc',
  'data-readiness-assessment-for-ai',
  'unified-data-estate-migration',
  'ai-agent-in-a-day-workshop',
  'ai-application-modernization-assessment',
  'copilot-extensibility-workshop',
  'custom-copilot-development',
  'application-migration-to-azure',
  'sentinel-security-essentials-poc',
  'teams-voice-in-a-box',
  'vmware-migrations',
  'azure-hpc-core-poc',
  'azure-hpc-migration-assessment',
  'azure-hpc-max-poc',
  'azure-hpc-pro-poc',
];

async function fetchGraphQLSlugs() {
  try {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: BLOG_SLUGS_QUERY }),
    });
    const json = await res.json();
    const blog = json?.data?.blog?.genContents?.nodes ?? [];
    const caseStudy = json?.data?.caseStudy?.genContents?.nodes ?? [];
    return {
      blog: blog.map((n) => n?.slug).filter(Boolean),
      caseStudy: caseStudy.map((n) => n?.slug).filter(Boolean),
    };
  } catch (e) {
    console.warn('[prerender-routes] GraphQL fetch failed:', e.message);
    return { blog: [], caseStudy: [] };
  }
}

function getSlugsFromJson(filePath, key, slugKey = 'slug') {
  try {
    const fullPath = join(ROOT, filePath);
    if (!existsSync(fullPath)) return [];
    const data = JSON.parse(readFileSync(fullPath, 'utf8'));
    const obj = data?.[key] ?? data;
    if (!obj || typeof obj !== 'object') return [];
    return Object.values(obj).map((v) => v?.[slugKey]).filter(Boolean);
  } catch (e) {
    console.warn('[prerender-routes] JSON read failed:', filePath, e.message);
    return [];
  }
}

/**
 * Vanity /solutions/{category}/{slug} URLs from navbar-content.json — mirrors
 * getSolutionCategoryRouteSegment / getSolutionHref in app-navbar.ts so the sitemap
 * lists the same URL the mega-menu actually links to (the real canonical per
 * isSolutionsVanityPath in wordpress-page.seo.ts), not WordPress's flat slug.
 * Returns the vanity paths plus the flat slugs they cover, so those flat WP page
 * duplicates can be left out of the sitemap.
 */
function buildSolutionsPaths() {
  try {
    const fullPath = join(ROOT, 'public', 'navbar-content.json');
    if (!existsSync(fullPath)) return { paths: [], flatSlugs: new Set() };
    const data = JSON.parse(readFileSync(fullPath, 'utf8'));
    const solutions = data?.content?.solutions;
    if (!solutions || typeof solutions !== 'object') return { paths: [], flatSlugs: new Set() };

    const paths = [];
    const flatSlugs = new Set();

    for (const [category, items] of Object.entries(solutions)) {
      if (!Array.isArray(items)) continue;
      const categorySegment = category === 'dataAndAnalytics' ? 'data-analytics' : category;
      for (const item of items) {
        const raw = (item?.link ?? item?.slug ?? '').trim();
        const normalized = raw.replace(/^\/+|\/+$/g, '');
        if (!normalized) continue;
        const segments = normalized.split('/').filter(Boolean);
        const linkSegment = segments[segments.length - 1] ?? normalized;
        paths.push(`/solutions/${categorySegment}/${linkSegment}`);
        flatSlugs.add(linkSegment);
      }
    }
    return { paths, flatSlugs };
  } catch (e) {
    console.warn('[prerender-routes] navbar-content.json read failed:', e.message);
    return { paths: [], flatSlugs: new Set() };
  }
}

const BLOG_SLUGS_FALLBACK = [
  'oakwood-systems-group-achieves-microsoft-advanced-specialization-for-ai-applications-on-azure',
  'oakwood-recognized-by-microsoft-for-excellence-in-support-services',
  'azure-for-ai-ready-data',
  'migrate-to-innovate',
  'microsofts-new-commerce-experience-nce-updates-for-csp-april-2025',
  'modernizing-applications-with-ai',
  'ai-fatigue-is-real-thats-not-a-bad-thing',
  'time-to-rethink-your-linux-footprint',
  'azure-hpc-for-manufacturing',
  'why-data-is-the-new-backbone-for-innovation',
  'breaking-data-silos-to-build-better-customer-experiences',
  'how-unified-platforms-and-ai-are-redefining-modern-banking',
  'microsoft-licensing-is-changing',
  'the-excitement-and-hesitation-around-ai-adoption',
  'the-ai-revolution-has-an-expensive-entry-fee-unless-youre-ready',
  'copilot-for-every-organization',
  'microsoft-365-price-increases-coming-july-2026',
  'unify-your-data-estate-for-ai',
  'the-key-to-a-secure-cloud-migration',
];

/** Slugs reservados en la raíz del sitio Angular; no deben redirigirse a /blog/{slug}. */
const RESERVED_ROOT_SLUGS = new Set([
  'about',
  'blog',
  'careers',
  'contact-success',
  'contact-us',
  'edit',
  'events',
  'home',
  'industries',
  'microsoft-licensing',
  'privacy-policy',
  'resources',
  'services',
  'structured-engagement',
  'technology-partners',
  '404',
  'admin',
  'api',
  'wp-admin',
  'sitemap.xml',
  'robots.txt',
]);

function buildNetlifyRedirects(blogSlugs) {
  const lines = [
    '# Auto-generated by scripts/prerender-routes.mjs — legacy WordPress / bloq URLs → Angular routes',
  ];

  for (const slug of blogSlugs) {
    if (!slug || RESERVED_ROOT_SLUGS.has(slug)) continue;
    const target = `/blog/${slug}`;
    lines.push(`/${slug}    ${target}    301`);
    lines.push(`/${slug}/   ${target}    301`);
    lines.push(`/bloq/${slug}    ${target}    301`);
    lines.push(`/bloq/${slug}/   ${target}    301`);
    lines.push(`/gen-content/${slug}    ${target}    301`);
    lines.push(`/gen-content/${slug}/   ${target}    301`);
  }

  return lines.join('\n') + '\n';
}

const CASE_STUDY_SLUGS_FALLBACK = [
  'sharepoint-online-intranet-modernization',
  'power-bi-report-development',
  'strategic-applications-architecture-roadmap',
  'data-and-power-bi-enablement',
  'sql-server-and-database-platform-modernization',
  'ai-sales-agent-development',
  'microsoft-intune-deployment',
  'simplifying-complex-data-security-with-fabric',
  'transforming-hpc-strategy-with-the-amd-hpc-innovation-lab',
  'secure-azure-research-environment-architecture',
  'enterprise-reporting-and-data-roadmap-development',
];

/**
 * WordPress pages marked noindex in Yoast ("Allow search engines to show this content in
 * search results?" -> No) shouldn't be submitted to Google via the sitemap — listing a
 * noindexed URL is a contradictory signal search engines explicitly warn against. The
 * pages endpoint used above doesn't expose this per-page Yoast flag, so it's fetched here
 * via the same rendered-page endpoint the app itself uses (see oakwood_page_builder_get_seo_meta
 * in the WP plugin), with limited concurrency to avoid tripping the CMS's rate limit (see
 * cms-throttle.interceptor.ts for the same concern on the app side).
 */
async function fetchNoindexedSlugs(slugs, concurrency = 5) {
  const noindexed = new Set();
  let cursor = 0;

  async function worker() {
    while (cursor < slugs.length) {
      const slug = slugs[cursor++];
      try {
        const url = `${WP_BASE_URL}/wp-json/oakwood/v1/rendered-page?path=${encodeURIComponent(slug)}&lite=true`;
        const res = await fetch(url);
        if (!res.ok) continue;
        const data = await res.json();
        if (data?.seo?.noindex === true) {
          noindexed.add(slug);
        }
      } catch (e) {
        console.warn(`[prerender-routes] noindex check failed for "${slug}":`, e.message);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, slugs.length) }, worker));
  return noindexed;
}

async function fetchWordPressPageSlugs() {
  const slugs = [];
  let page = 1;
  const perPage = 100;

  try {
    while (true) {
      const url = `${WP_BASE_URL}/wp-json/wp/v2/pages?per_page=${perPage}&page=${page}&status=publish&_fields=slug`;
      const res = await fetch(url);
      if (!res.ok) break;
      const batch = await res.json();
      if (!Array.isArray(batch) || batch.length === 0) break;
      for (const item of batch) {
        const slug = item?.slug;
        if (typeof slug === 'string' && slug && !RESERVED_ROOT_SLUGS.has(slug)) {
          slugs.push(slug);
        }
      }
      if (batch.length < perPage) break;
      page += 1;
    }
  } catch (e) {
    console.warn('[prerender-routes] WordPress pages fetch failed:', e.message);
  }

  return slugs;
}

async function main() {
  const routes = ['/', '/blog', '/resources/case-studies'];

  let { blog, caseStudy } = await fetchGraphQLSlugs();
  if (blog.length === 0) blog = BLOG_SLUGS_FALLBACK;
  if (caseStudy.length === 0) caseStudy = CASE_STUDY_SLUGS_FALLBACK;

  blog.forEach((s) => routes.push(`/blog/${s}`));
  caseStudy.forEach((s) => routes.push(`/resources/case-studies/${s}`));

  const industries = getSlugsFromJson('public/industries-content.json', 'industries');
  industries.forEach((s) => routes.push(`/industries/${s}`));

  SERVICE_SLUGS.forEach((s) => routes.push(`/services/${s}`));

  STRUCTURED_SLUGS.forEach((s) => routes.push(`/structured-engagement/${s}`));

  const wpPageSlugs = await fetchWordPressPageSlugs();
  // Every WP page slug still goes into routes/prerender-routes.txt so the flat URL stays
  // servable via SSR fallback even when noindexed — noindex is a "don't index me" signal,
  // not "don't serve me". Only the sitemap step below excludes noindexed slugs.
  wpPageSlugs.forEach((s) => routes.push(`/${s}`));
  console.log(`[prerender-routes] Added ${wpPageSlugs.length} WordPress page slugs`);

  const noindexedSlugs = await fetchNoindexedSlugs(wpPageSlugs);
  console.log(`[prerender-routes] ${noindexedSlugs.size} WordPress page(s) marked noindex — excluded from sitemap`);

  const wpPrerenderSlugs = wpPageSlugs.filter((s) => PRERENDER_WP_SLUGS.includes(s));
  writeFileSync(join(ROOT, 'wp-page-slugs.json'), JSON.stringify({ slugs: wpPrerenderSlugs }, null, 2), 'utf8');
  console.log(`[prerender-routes] WP pages a prerenderizar: ${wpPrerenderSlugs.length} de ${wpPageSlugs.length}`);

  const eventSlugs = getSlugsFromJson('public/events-content.json', 'events', 'slug');
  // Event detail URLs are SSR-only; do not add to prerender-routes.txt (see app.routes.server.ts).

  const outPath = join(ROOT, 'prerender-routes.txt');
  writeFileSync(outPath, routes.join('\n') + '\n', 'utf8');
  console.log(`[prerender-routes] Wrote ${routes.length} routes to prerender-routes.txt`);

  // JSON para getPrerenderParams (blog, case-studies)
  const slugsPath = join(ROOT, 'prerender-slugs.json');
  writeFileSync(slugsPath, JSON.stringify({ blog, caseStudy }, null, 2), 'utf8');
  console.log(
    `[prerender-routes] Wrote prerender-slugs.json (blog: ${blog.length}, caseStudy: ${caseStudy.length})`,
  );

  // Sitemap.xml con todas las rutas (para SEO; robots.txt lo referencia)
  const BASE = 'https://oakwoodsys.com';
  const staticPages = [
    '/resources',
    '/resources/events',
    '/careers',
    '/about',
    '/contact-us',
    '/industries',
    '/structured-engagement',
    '/privacy-policy',
  ];
  const eventPaths = eventSlugs.map((s) => `/resources/events/${s}`);

  const { paths: solutionsPaths, flatSlugs: solutionsFlatSlugs } = buildSolutionsPaths();
  // Drop the flat WP slug from the sitemap when a /solutions/... vanity URL covers the
  // same page — that vanity URL is the real canonical (see isSolutionsVanityPath), so
  // listing both would submit duplicate content to Google.
  const isFlatSolutionDuplicate = (route) => {
    const bare = route.replace(/^\/+/, '');
    return !bare.includes('/') && solutionsFlatSlugs.has(bare);
  };
  const isNoindexedWpPage = (route) => {
    const bare = route.replace(/^\/+/, '');
    return !bare.includes('/') && noindexedSlugs.has(bare);
  };
  const sitemapRoutes = routes.filter((r) => !isFlatSolutionDuplicate(r) && !isNoindexedWpPage(r));
  console.log(
    `[prerender-routes] Solutions vanity URLs: ${solutionsPaths.length} added, ${routes.length - sitemapRoutes.length} flat duplicates/noindexed pages dropped from sitemap`,
  );

  const allPaths = [...new Set([...sitemapRoutes, ...staticPages, ...eventPaths, ...solutionsPaths])];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPaths
      .map((path) => {
        const loc = path.startsWith('http') ? path : `${BASE}${path.startsWith('/') ? '' : '/'}${path}`;
        const priority =
          path === '/'
            ? '1.0'
            : path.includes('/blog/') ||
              path.includes('/resources/case-studies/') ||
              path.includes('/resources/events/')
              ? '0.8'
              : '0.7';
        const changefreq =
          path === '/'
            ? 'weekly'
            : path.includes('/blog/') ||
              path.includes('/resources/case-studies/') ||
              path.includes('/resources/events/')
              ? 'weekly'
              : 'monthly';
        return `  <url>
    <loc>${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
      })
      .join('\n')}
</urlset>
`;
  const sitemapPath = join(ROOT, 'public', 'sitemap.xml');
  writeFileSync(sitemapPath, sitemap, 'utf8');
  console.log(`[prerender-routes] Wrote sitemap.xml (${allPaths.length} URLs)`);

  const redirectsPath = join(ROOT, 'public', '_redirects');
  const redirects = buildNetlifyRedirects(blog);
  writeFileSync(redirectsPath, redirects, 'utf8');
  const redirectCount = redirects.split('\n').filter((l) => l && !l.startsWith('#')).length;
  console.log(`[prerender-routes] Wrote _redirects (${redirectCount} rules)`);
}

main().catch((e) => {
  console.error('[prerender-routes] Error:', e);
  process.exit(1);
});
