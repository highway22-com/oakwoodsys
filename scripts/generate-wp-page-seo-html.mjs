#!/usr/bin/env node
/**
 * Post-build: write dist/oaw/browser/{slug}/index.html with Yoast SEO meta
 * so view-source, link previews, and crawlers see correct tags without SSR.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const WP_BASE_URL = 'https://oakwoodsystemsgroup.com';
const PUBLIC_BASE = 'https://oakwoodsys.com';
const BROWSER_OUT = join(ROOT, 'dist/oaw/browser');
const INDEX_CANDIDATES = [
  join(BROWSER_OUT, 'index.csr.html'),
  join(BROWSER_OUT, 'index.html'),
];
const SLUGS_FILE = join(ROOT, 'wp-page-slugs.json');
const DEFAULT_OG_IMAGE = `${PUBLIC_BASE}/assets/og-image.png`;
const META_DESC_MAX = 155;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function normalizeDescription(text) {
  let value = String(text).replace(/<[^>]*>/g, '').trim();
  if (value.length <= META_DESC_MAX) return value;
  const cut = value.slice(0, META_DESC_MAX - 3);
  const lastSpace = cut.lastIndexOf(' ');
  const end = lastSpace >= 80 ? lastSpace : META_DESC_MAX - 3;
  return `${value.slice(0, end).trim()}...`;
}

function isUsableSeoTitle(title) {
  const trimmed = String(title ?? '').trim();
  if (!trimmed) return false;
  if (/^\s*\|/.test(trimmed)) return false;
  const main = trimmed.split('|')[0]?.trim() ?? '';
  return main.length >= 2;
}

function extractH1(html) {
  const match = String(html).match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!match?.[1]) return '';
  return match[1].replace(/<[^>]*>/g, '').trim();
}

function humanizeSlug(slug) {
  return String(slug)
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.replace(/[-_]+/g, ' '))
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' / ');
}

function resolveDocumentTitle(page, slug) {
  const seoTitle = page?.seo?.title?.trim();
  if (isUsableSeoTitle(seoTitle)) return seoTitle;

  const wpTitle = page?.title?.trim();
  if (wpTitle) return `${wpTitle} | Oakwood Systems`;

  const h1 = extractH1(page?.content ?? '');
  if (h1) return `${h1} | Oakwood Systems`;

  return `${humanizeSlug(slug)} | Oakwood Systems`;
}

function resolveDescription(page, slug) {
  const fromSeo = page?.seo?.description?.trim();
  if (fromSeo) return normalizeDescription(fromSeo);
  const excerpt = page?.excerpt?.trim();
  if (excerpt) return normalizeDescription(excerpt);
  const h1 = extractH1(page?.content ?? '');
  if (h1) return normalizeDescription(h1);
  return normalizeDescription(`WordPress page ${humanizeSlug(slug)}.`);
}

function patchIndexHtml(template, { title, description, canonicalUrl, image, keywords }) {
  let html = template;

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);

  html = html.replace(
    /<meta name="description"\s+content="[^"]*">/,
    `<meta name="description" content="${escapeHtml(description)}">`,
  );

  if (keywords) {
    html = html.replace(
      /<meta name="keywords"\s+content="[^"]*">/,
      `<meta name="keywords" content="${escapeHtml(keywords)}">`,
    );
  }

  html = html.replace(
    /<link rel="canonical" href="[^"]*">/,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}">`,
  );

  html = html.replace(
    /<meta property="og:title" content="[^"]*">/,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
  );
  html = html.replace(
    /<meta property="og:description"\s+content="[^"]*">/,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
  );
  html = html.replace(
    /<meta property="og:url" content="[^"]*">/,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}">`,
  );
  html = html.replace(
    /<meta property="og:image" content="[^"]*">/,
    `<meta property="og:image" content="${escapeHtml(image)}">`,
  );

  html = html.replace(
    /<meta name="twitter:title" content="[^"]*">/,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
  );
  html = html.replace(
    /<meta name="twitter:description"\s+content="[^"]*">/,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
  );
  html = html.replace(
    /<meta name="twitter:image" content="[^"]*">/,
    `<meta name="twitter:image" content="${escapeHtml(image)}">`,
  );

  return html;
}

async function fetchPage(slug) {
  const url = `${WP_BASE_URL}/wp-json/custom/v1/rendered-page?path=${encodeURIComponent(slug)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

async function main() {
  const templatePath = INDEX_CANDIDATES.find((candidate) => existsSync(candidate));
  if (!templatePath) {
    console.error('[wp-seo-html] Missing dist/oaw/browser/index.csr.html — run ng build first.');
    process.exit(1);
  }

  // Netlify SPA fallback expects /index.html at publish root.
  const rootIndex = join(BROWSER_OUT, 'index.html');
  if (!existsSync(rootIndex)) {
    writeFileSync(rootIndex, readFileSync(templatePath, 'utf8'), 'utf8');
    console.log('[wp-seo-html] Created browser/index.html from index.csr.html');
  }

  let slugs = [];
  if (existsSync(SLUGS_FILE)) {
    try {
      const data = JSON.parse(readFileSync(SLUGS_FILE, 'utf8'));
      slugs = Array.isArray(data?.slugs) ? data.slugs : [];
    } catch (e) {
      console.warn('[wp-seo-html] Could not read wp-page-slugs.json:', e.message);
    }
  }

  if (slugs.length === 0) {
    console.warn('[wp-seo-html] No WordPress slugs found; skipping.');
    return;
  }

  const template = readFileSync(templatePath, 'utf8');
  let written = 0;
  let failed = 0;

  for (const slug of slugs) {
    try {
      const page = await fetchPage(slug);
      const canonicalPath = page?.seo?.canonicalPath?.trim() || `/${slug}`;
      const canonicalUrl = canonicalPath.startsWith('http')
        ? canonicalPath
        : `${PUBLIC_BASE}${canonicalPath.startsWith('/') ? '' : '/'}${canonicalPath}`;
      const title = resolveDocumentTitle(page, slug);
      const description = resolveDescription(page, slug);
      const image = page?.seo?.ogImage?.trim() || DEFAULT_OG_IMAGE;
      const keywords = page?.seo?.keywords?.trim() || '';

      const html = patchIndexHtml(template, { title, description, canonicalUrl, image, keywords });
      const outDir = join(BROWSER_OUT, slug);
      mkdirSync(outDir, { recursive: true });
      writeFileSync(join(outDir, 'index.html'), html, 'utf8');
      written += 1;
    } catch (e) {
      failed += 1;
      console.warn(`[wp-seo-html] Failed for /${slug}:`, e.message);
    }
  }

  console.log(`[wp-seo-html] Wrote ${written} static HTML files (${failed} failed).`);
}

main().catch((e) => {
  console.error('[wp-seo-html] Error:', e);
  process.exit(1);
});
