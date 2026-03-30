#!/usr/bin/env node
/**
 * Genera prerender-routes.txt con slugs de blog, case-studies, industries, services y structured-engagement.
 * Se ejecuta antes del build para que Angular prerenderice esas rutas con meta OG correctos.
 */
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const GRAPHQL_URL = 'https://oakwoodsystemsgroup.com/graphql';

const BLOG_SLUGS_QUERY = `query GetSlugsForPrerender {
  blog: genContentCategory(id: "blog", idType: SLUG) {
    genContents(first: 500) { nodes { slug } }
  }
  caseStudy: genContentCategory(id: "case-study", idType: SLUG) {
    genContents(first: 500) { nodes { slug } }
  }
}`;

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
  'semisol-security-essentials-poc',
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

  const outPath = join(ROOT, 'prerender-routes.txt');
  writeFileSync(outPath, routes.join('\n') + '\n', 'utf8');
  console.log(`[prerender-routes] Wrote ${routes.length} routes to prerender-routes.txt`);

  // JSON para getPrerenderParams (blog y case-studies)
  const slugsPath = join(ROOT, 'prerender-slugs.json');
  writeFileSync(slugsPath, JSON.stringify({ blog, caseStudy }, null, 2), 'utf8');
  console.log(`[prerender-routes] Wrote prerender-slugs.json (blog: ${blog.length}, caseStudy: ${caseStudy.length})`);

  // Sitemap.xml con todas las rutas (para SEO; robots.txt lo referencia)
  const BASE = 'https://oakwoodsys.com';
  const staticPages = ['/resources', '/careers', '/about', '/contact-us', '/industries', '/structured-engagement', '/privacy-policy'];
  const allPaths = [...new Set([...routes, ...staticPages])];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPaths
  .map((path) => {
    const loc = path.startsWith('http') ? path : `${BASE}${path.startsWith('/') ? '' : '/'}${path}`;
    const priority = path === '/' ? '1.0' : path.includes('/blog/') || path.includes('/resources/case-studies/') ? '0.8' : '0.7';
    const changefreq = path === '/' ? 'weekly' : path.includes('/blog/') || path.includes('/resources/case-studies/') ? 'weekly' : 'monthly';
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
}

main().catch((e) => {
  console.error('[prerender-routes] Error:', e);
  process.exit(1);
});
