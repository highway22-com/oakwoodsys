import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { GraphQLContentService } from '../../app/services/graphql-content.service';
import { SeoMetaService } from '../../app/services/seo-meta.service';
import { humanizeSlug } from '../../app/utils/humanize-slug';
import { logError } from '../../app/utils/logger';

interface StructuredOfferSeoFields {
  title?: string;
  summary?: string;
}

/** Same shape-detection as structured-offer.ts's private asStructuredOfferPageConfig. */
function extractOffers(data: Record<string, unknown> | null): Record<string, StructuredOfferSeoFields> | null {
  if (!data || typeof data !== 'object') return null;
  const direct = data['offers'];
  if (direct && typeof direct === 'object') return direct as Record<string, StructuredOfferSeoFields>;
  const wrapped = (data as { content?: { offers?: unknown } }).content;
  if (wrapped?.offers && typeof wrapped.offers === 'object') return wrapped.offers as Record<string, StructuredOfferSeoFields>;
  return null;
}

/**
 * Runs before the structured-engagement/:slug route activates so SSR waits for real
 * per-offer SEO instead of shipping index.html's site-wide defaults.
 */
export const structuredOfferSeoResolver: ResolveFn<boolean> = (route: ActivatedRouteSnapshot) => {
  const graphql = inject(GraphQLContentService);
  const seoMeta = inject(SeoMetaService);
  const slug = route.paramMap.get('slug');

  if (!slug) {
    return of(true);
  }

  const applyFallback = () => {
    seoMeta.updateMeta({
      title: `${humanizeSlug(slug)} | Oakwood Systems`,
      description:
        'Drive efficiency and innovation with tailored, strategic engagements designed to align technology solutions with your unique business goals.',
      canonicalPath: `/structured-engagement/${slug}`,
      noindex: true,
    });
    return of(true);
  };

  return graphql.getStructuredEngagementOfferPageContent().pipe(
    map((data) => {
      const offers = extractOffers(data);
      const offer = offers?.[slug];
      if (!offer?.title) {
        throw new Error(`Structured offer "${slug}" not found in CMS response`);
      }
      seoMeta.updateMeta({
        title: `${offer.title} | Oakwood Systems`,
        description: offer.summary ?? seoMeta.defaultDescription,
        canonicalPath: `/structured-engagement/${slug}`,
      });
      return true;
    }),
    catchError((error) => {
      logError(`[structured-offer] SEO resolver failed for slug "${slug}":`, error);
      return applyFallback();
    }),
  );
};
