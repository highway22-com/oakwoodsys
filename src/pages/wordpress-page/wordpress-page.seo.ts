import { SeoMetaService, SeoMetaConfig } from '../../app/services/seo-meta.service';
import { CMS_BASE_URL } from '../../app/config/cms.config';
import { WordPressPageResponse } from '../../app/services/wordpress-page.service';

/** Reject Yoast titles that are empty or only a site-name suffix (e.g. " | Site Name"). */
export function isUsableSeoTitle(title: string | undefined | null): boolean {
  const trimmed = title?.trim() ?? '';
  if (!trimmed) return false;
  if (/^\s*\|/.test(trimmed)) return false;
  const main = trimmed.split('|')[0]?.trim() ?? '';
  return main.length >= 2;
}

export function humanizeWordPressPath(path: string): string {
  return path
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.replace(/[-_]+/g, ' '))
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' / ');
}

export function extractH1FromHtml(html: string): string {
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!match?.[1]) return '';
  return match[1].replace(/<[^>]*>/g, '').trim();
}

/** og:image from Yoast head markup when REST `seo.ogImage` is empty. */
export function extractOgImageFromHeadHtml(headHtml: string): string {
  if (!headHtml?.trim()) return '';
  const propertyFirst =
    headHtml.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ??
    headHtml.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  return propertyFirst?.[1]?.trim() ?? '';
}

/** First absolute or root-relative image in page body (fallback for social previews). */
export function extractFirstImageFromHtml(html: string): string {
  if (!html?.trim()) return '';
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  const src = match?.[1]?.trim();
  if (!src || src.startsWith('data:')) return '';
  return src;
}

export function resolveWordPressOgImage(page: WordPressPageResponse): string | undefined {
  const candidates = [
    page.seo?.ogImage?.trim(),
    extractOgImageFromHeadHtml(page.headHtml ?? ''),
    extractFirstImageFromHtml(page.content ?? ''),
  ];

  for (const candidate of candidates) {
    const normalized = normalizeOgImageUrl(candidate);
    if (normalized) return normalized;
  }

  return undefined;
}

function normalizeOgImageUrl(url: string | undefined): string | undefined {
  const trimmed = url?.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  const cmsOrigin = CMS_BASE_URL.replace(/\/$/, '');
  return `${cmsOrigin}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

export function resolveWordPressDisplayTitle(path: string, page: WordPressPageResponse): string {
  const wpTitle = page.title?.trim();
  if (wpTitle) return wpTitle;
  const h1 = extractH1FromHtml(page.content ?? '');
  if (h1) return h1;
  return humanizeWordPressPath(path);
}

export function resolveWordPressSeoDocumentTitle(path: string, page: WordPressPageResponse): string {
  const seoTitle = page.seo?.title?.trim();
  if (isUsableSeoTitle(seoTitle)) return seoTitle!;

  const wpTitle = page.title?.trim();
  if (wpTitle) return `${wpTitle} | Oakwood Systems`;

  const h1 = extractH1FromHtml(page.content ?? '');
  if (h1) return `${h1} | Oakwood Systems`;

  return `${humanizeWordPressPath(path)} | Oakwood Systems`;
}

/**
 * Vanity solutions URLs (e.g. /solutions/ai/ai-application-development) are kept in the
 * browser by resolveWordPressFetchPath, which looks the WordPress page up by its own flat
 * slug (ai-application-development) for the backend fetch. WordPress/Yoast has no idea the
 * vanity routing layer exists, so its own canonical always points at that flat slug — which
 * made every /solutions/* page declare itself a duplicate of a different, un-promoted URL.
 * For these paths the vanity URL actually being served is the real canonical, regardless of
 * what WordPress thinks its own canonical is.
 */
function isSolutionsVanityPath(path: string): boolean {
  const segments = path.split('/').filter(Boolean);
  return segments[0] === 'solutions' && segments.length >= 3;
}

export function buildWordPressSeoConfig(path: string, page: WordPressPageResponse): SeoMetaConfig {
  const seo = page.seo;
  const canonicalPath = isSolutionsVanityPath(path)
    ? `/${path}`
    : seo?.canonicalPath?.trim() || `/${path}`;
  return {
    title: resolveWordPressSeoDocumentTitle(path, page),
    description:
      seo?.description?.trim() ||
      page.excerpt?.trim() ||
      resolveWordPressDisplayTitle(path, page) ||
      'WordPress page content.',
    canonicalPath,
    image: resolveWordPressOgImage(page),
    keywords: seo?.keywords?.trim() || undefined,
    noindex: seo?.noindex === true,
  };
}

export function applyWordPressPageSeo(
  seoMeta: SeoMetaService,
  path: string,
  page: WordPressPageResponse,
): void {
  seoMeta.updateMeta(buildWordPressSeoConfig(path, page));
}

/**
 * SEO for when the CMS fetch itself failed (network error, timeout, 429, WP 5xx) — not a
 * real 404. Without this, the resolver's error path left whatever SEO tags index.html shipped
 * with (site-wide defaults) in the rendered HTML, so a transient CMS hiccup made Google see
 * this route's canonical/title/og as a duplicate of the homepage. noindex:true keeps a flaky
 * fetch from getting a broken/empty render indexed at all, and the real canonicalPath (instead
 * of falling back to "/") stops it from reading as a homepage duplicate to any crawler that
 * doesn't honor robots.
 */
export function buildWordPressSeoFallbackConfig(path: string): SeoMetaConfig {
  return {
    title: `${humanizeWordPressPath(path)} | Oakwood Systems`,
    description: 'WordPress page content.',
    canonicalPath: `/${path}`,
    noindex: true,
  };
}

export function applyWordPressPageSeoFallback(seoMeta: SeoMetaService, path: string): void {
  seoMeta.updateMeta(buildWordPressSeoFallbackConfig(path));
}
