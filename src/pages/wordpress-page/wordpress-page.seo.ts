import { SeoMetaService, SeoMetaConfig } from '../../app/services/seo-meta.service';
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

export function buildWordPressSeoConfig(path: string, page: WordPressPageResponse): SeoMetaConfig {
  const seo = page.seo;
  return {
    title: resolveWordPressSeoDocumentTitle(path, page),
    description:
      seo?.description?.trim() ||
      page.excerpt?.trim() ||
      resolveWordPressDisplayTitle(path, page) ||
      'WordPress page content.',
    canonicalPath: seo?.canonicalPath?.trim() || `/${path}`,
    image: seo?.ogImage?.trim() || undefined,
    keywords: seo?.keywords?.trim() || undefined,
  };
}

export function applyWordPressPageSeo(
  seoMeta: SeoMetaService,
  path: string,
  page: WordPressPageResponse,
): void {
  seoMeta.updateMeta(buildWordPressSeoConfig(path, page));
}
