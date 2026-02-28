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
const GRAPHQL_URL = 'https://oakwoodsys.com/graphql';

const BLOG_SLUGS_QUERY = `query GetSlugsForPrerender {
  blog: genContentCategory(id: "blog", idType: SLUG) {
    genContents(first: 500) { nodes { slug } }
  }
  caseStudy: genContentCategory(id: "case-study", idType: SLUG) {
    genContents(first: 500) { nodes { slug } }
  }
}`;

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

async function main() {
  const routes = ['/', '/blog', '/resources/case-studies'];

  const { blog, caseStudy } = await fetchGraphQLSlugs();
  blog.forEach((s) => routes.push(`/blog/${s}`));
  caseStudy.forEach((s) => routes.push(`/resources/case-studies/${s}`));

  const industries = getSlugsFromJson('public/industries-content.json', 'industries');
  industries.forEach((s) => routes.push(`/industries/${s}`));

  const services = getSlugsFromJson('public/services-content.json', 'services');
  services.forEach((s) => routes.push(`/services/${s}`));

  STRUCTURED_SLUGS.forEach((s) => routes.push(`/structured-engagement/${s}`));

  const outPath = join(ROOT, 'prerender-routes.txt');
  writeFileSync(outPath, routes.join('\n') + '\n', 'utf8');
  console.log(`[prerender-routes] Wrote ${routes.length} routes to prerender-routes.txt`);
}

main().catch((e) => {
  console.error('[prerender-routes] Error:', e);
  process.exit(1);
});
