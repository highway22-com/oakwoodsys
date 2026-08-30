import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { GraphQLContentService } from '../../app/services/graphql-content.service';
import { SeoMetaService } from '../../app/services/seo-meta.service';
import { humanizeSlug } from '../../app/utils/humanize-slug';
import { logError } from '../../app/utils/logger';

/** Slug used in the navbar/URL -> key used in industries-content.json (mirrors industries.ts). */
const SLUG_TO_KEY: Record<string, string> = {
  'education-public-sector': 'education',
};

interface IndustrySeoFields {
  title?: string;
  description?: string;
  backgroundImage?: string;
}

/**
 * Runs before the industries/:slug route activates so SSR waits for real per-page SEO
 * instead of shipping index.html's site-wide defaults (title/canonical never got past
 * ngOnInit's async subscribe chain before the page was serialized).
 */
export const industriesSeoResolver: ResolveFn<boolean> = (route: ActivatedRouteSnapshot) => {
  const graphql = inject(GraphQLContentService);
  const seoMeta = inject(SeoMetaService);
  const slug = route.paramMap.get('slug');

  if (!slug) {
    return of(true);
  }

  const contentKey = SLUG_TO_KEY[slug] ?? slug;

  return graphql.getIndustryByCMSSlug(slug).pipe(
    map((res) => {
      const industry = res?.industries?.[contentKey] as IndustrySeoFields | undefined;
      if (!industry?.title) {
        throw new Error(`Industry "${slug}" not found in CMS response`);
      }
      seoMeta.updateMeta({
        title: `${industry.title} | Oakwood Systems`,
        description: industry.description ?? seoMeta.defaultDescription,
        canonicalPath: `/industries/${slug}`,
        image: industry.backgroundImage,
      });
      return true;
    }),
    catchError((error) => {
      logError(`[industries] SEO resolver failed for slug "${slug}":`, error);
      seoMeta.updateMeta({
        title: `${humanizeSlug(slug)} | Oakwood Systems`,
        description:
          'Explore how Oakwood Systems helps healthcare, education, and other industries with Microsoft and Azure solutions.',
        canonicalPath: `/industries/${slug}`,
        noindex: true,
      });
      return of(true);
    }),
  );
};
